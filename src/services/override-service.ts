import { IOverride, IPreferences, OperationMode } from "@/preferences";
import { generateUUID, hashCode } from "@/util";
import { AES, enc } from "crypto-js";
import { FileSystemClient } from "@/services/fs-client";
import browser from 'webextension-polyfill';
import { DateTime, Duration } from "luxon";

export class OverrideService {

    static create = async () => {
        const storeResult = await browser.storage.local.get({'override': {}});
        const currentOverride = storeResult['override'];
        if (currentOverride && currentOverride.id) {
            return new OverrideService(currentOverride);
        } else {
            return new OverrideService();
        }
    }
    private _current: IOverride | undefined;

    public get active() {
        return this._current != undefined && !!this._current?.id;
    }

    public get current() {
        return this._current;
    }

    /**
     *
     */
    private constructor(current?: IOverride) {
        if (current) {
            this._current = current;
        }
        
    }

    static overrideFileType = [{ accept: { 'text/json': '.betaoverride' }, description: 'Beta Protection Overrides' }];

    static createOverride(keyPhrase: string, allowedModes: OperationMode[], prefs: Partial<IPreferences>) {
        const overrideId = generateUUID();
        const key = AES.encrypt(overrideId, keyPhrase).toString();
        const override: IOverride = {
            key,
            id: overrideId,
            allowedModes,
            preferences: prefs,
            hash: hashCode(JSON.stringify(prefs))
        };
        return override;
    }

    static exportOverride = async (override: IOverride) => {
        const fs = new FileSystemClient();
        const output = JSON.stringify(override);
        await fs.saveTextFile(output, OverrideService.overrideFileType);
    }

    importOverride = async (): Promise<OverrideResult> => {
        if (this.current && this.current.id) {
            return {success: false, code: 409, message: 'There is already an override active!'};
        }
        try {
            const fs = new FileSystemClient();
            const file = await fs.getFile(OverrideService.overrideFileType);
            const text = await file.file.text();
            const override = JSON.parse(text) as IOverride;
            if (override?.id && override.allowedModes && override.allowedModes.length > 0) {
                const importHash = hashCode(JSON.stringify(override.preferences));
                if (override.hash && override.hash != importHash) {
                    return {success: false, code: 422, message: 'Override has been modified!'}
                }
                override.activatedTime = new Date().getTime();
                this._current = override;
                browser.storage.local.set({ 'override': override });
                return {success: true, code: 200, message: 'Override loaded and saved!'};
            }
            return {success: false, code: 400, message: 'Override is not in a valid format!'};
        } catch {
            return {success: false, code: 500, message: 'Error encountered importing override!'};
        }
    }

    tryDisable = async (keyPhrase: string): Promise<OverrideResult> => {
        if (!this._current) {
            return {success: true, code: 204, message: 'There is no override active!'};
        }
        const id = this._current.id;
        const input = this._current.key;
        const remaining = this.getTimeRemaining();
        if (remaining > 0) {
            return {success: false, code: 412, message: 'Required time has not passed!'};
        }
        try {
            const bytes = AES.decrypt(input, keyPhrase);
            const candidate = bytes.toString(enc.Utf8);
            if (candidate === id) {
                await browser.storage.local.remove('override');
                this._current = undefined;
                return {success: true, code: 200, message: 'Override successfully disabled!'};
            } else {
                return {success: false, code: 403, message: 'Unlock key did not match!'};
            }
        } catch {
            return {success: false, code: 500, message: 'Error encountered disabling override'};
        }
    }

    reload = async () => {
        const storeResult = await browser.storage.local.get({'override': {}});
        const currentOverride = storeResult['override'];
        this._current = currentOverride;
    }

    getTimeRemaining = () => {
        const override = this._current;
        if (override === undefined) { return 0 };
        if (override.activatedTime !== undefined && override.activatedTime > 0 &&
            override.minimumTime !== undefined && override.minimumTime > 0) {
            const now = DateTime.now();
            const then = DateTime.fromMillis(override.activatedTime);
            const target = then.plus(Duration.fromObject({ minutes: override.minimumTime }));
            return now > target ? 0 : target.diff(now).toMillis();
        }
        return 0;
    }
}

export type OverrideResult = {
    success: boolean,
    message: string,
    code: number
};

export const hasDurationPassed = (override: IOverride|undefined, defaultValue: boolean = false) => {
    if (override === undefined) {return defaultValue};
    if (override.activatedTime !== undefined && override.activatedTime > 0 &&
         override.minimumTime !== undefined && override.minimumTime > 0) {
        const now = DateTime.now();
        const then = DateTime.fromMillis(override.activatedTime);
        const target = then.plus(Duration.fromObject({minutes: override.minimumTime}));
        return now > target;
    }
    return true;
}
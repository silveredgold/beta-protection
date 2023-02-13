import { IExtensionPreferences, IOverride, IPreferences, OperationMode } from "@/preferences";
import { generateUUID, hashCode } from "@/util";
import { AES, enc } from "crypto-js";
import { services } from "@silveredgold/beta-shared-components";
import browser from 'webextension-polyfill';
import { DateTime, Duration } from "luxon";
const { FileSystemClient } = services;

export class OverrideService {

    static overrideFileType = [{ accept: { 'text/json': '.betaoverride' }, description: 'Beta Protection Overrides' }];

    static createOverride(keyPhrase: string, allowedModes: OperationMode[], prefs: Partial<IExtensionPreferences>) {
        const overrideId = generateUUID();
        const key = AES.encrypt(overrideId, keyPhrase).toString();
        const override: IOverride<IExtensionPreferences> = {
            key,
            id: overrideId,
            allowedModes,
            preferences: prefs,
            hash: hashCode(JSON.stringify(prefs))
        };
        return override;
    }

    static exportOverride = async (override: IOverride<IExtensionPreferences>) => {
        const fs = new FileSystemClient();
        const output = JSON.stringify(override);
        await fs.saveTextFile(output, OverrideService.overrideFileType);
    }
}

export type OverrideResult = {
    success: boolean,
    message: string,
    code: number
};

export const hasDurationPassed = (override: IOverride<IExtensionPreferences>|undefined, defaultValue: boolean = false) => {
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

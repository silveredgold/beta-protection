import { toTitleCase } from "@/util";
import { CensorType, IPreferences, OperationMode, rawPreferences } from "./types";
import clone from "just-clone";
import browser from 'webextension-polyfill';
import { MSG_UPDATE_PREFS } from "@/messaging";


export async function loadPreferencesFromStorage(): Promise<IPreferences> {
    const result = await browser.storage.local.get('preferences') as IPreferences;
    return result['preferences'];
}

export async function savePreferencesToStorage(prefs: IPreferences, skipClone: boolean = false): Promise<void> {
    const clonedPrefs = skipClone ? prefs : clone(prefs);
    await browser.storage.local.set({ 'preferences': clonedPrefs });
}

export async function mergeNewPreferences(prefs: IPreferences): Promise<void> {
    const clonedPrefs = clone(prefs);
    
    const storedPrefs = await loadPreferencesFromStorage();
    const mergedPrefs = {
        ...defaultPrefs,
        ...storedPrefs,
        ...clonedPrefs
    };
    await savePreferencesToStorage(mergedPrefs, true);
}

export function updateBackendPreferences(prefs: IPreferences) {
    return new Promise<boolean>((resolve, reject) => {
        const port = browser.runtime.connect({name: 'preferences:backend'});
        port.onMessage.addListener((msg, port) => {
            if (msg.msg == 'updatePreferences') {
                const success = msg.update as boolean;
                port.disconnect();
                resolve(success);
            } else {
                reject('wait what');
                port.disconnect();
            }
        });
        // console.debug('sending request on named port!');
        port.postMessage({msg: MSG_UPDATE_PREFS.event});
    });
}


export const defaultPrefs: IPreferences = {
    exposed: {
        Pits: {method: CensorType.Nothing, level: 1.0},
        Breasts: {method: CensorType.Caption, level: 5},
        Belly: {method: CensorType.Nothing, level: 1.9},
        Ass: {method: CensorType.Pixels, level: 5},
        Cock: {method: CensorType.Nothing, level: 1.0},
        Feet: {method: CensorType.Nothing, level: 1.9},
        Pussy: {method: CensorType.Sticker, level: 7.4}
    },
    covered: {
        Pits: {method: CensorType.Nothing, level: 1.1},
        Breasts: {method: CensorType.Caption, level: 5},
        Belly: {method: CensorType.Nothing, level: 1.9},
        Ass: {method: CensorType.Pixels, level: 5},
        Cock: {method: CensorType.Nothing, level: 1.0},
        Feet: {method: CensorType.Nothing, level: 1.9},
        Pussy: {method: CensorType.Sticker, level: 7.4}
    },
    otherCensoring: {
        femaleEyes: 'Nothing',
        femaleFace: {method: CensorType.Pixels, level: 1.0},
        maleFace: {method: CensorType.Nothing, level: 1.0}
    },
    mode: OperationMode.OnDemand,
    videoCensorLevel: 2,
    videoCensorMode: "Block",
    rescaleLevel: 3,
    saveLocalCopy: false,
    obfuscateImages: false,
    autoAnimate: false,
    enabledPlaceholders: ["Loser"],
    enabledStickers: ["Loser"],
    subliminal: {
        enabled: false,
        delay: 4000,
        duration: 250
    },
    allowList: [],
    forceList: [],
    errorMode: 'normal',
    hideDomains: true
}

export function createPreferencesFromBackend(raw: rawPreferences): IPreferences {

    return {
        ...defaultPrefs,
        allowList: raw["whitelist"] as string[] ?? [],
        autoAnimate: raw.animate === 'true',
        covered: {
            Ass: getCensorObj(raw, "cass"),
            Belly: getCensorObj(raw, "cbelly"),
            Breasts: getCensorObj(raw, "cbreasts"),
            Cock: getCensorObj(raw, "ccock"),
            Feet: getCensorObj(raw, "cfeet"),
            Pits: getCensorObj(raw, "cpits"),
            Pussy: getCensorObj(raw, "cpussy")
        },
        exposed: {
            Ass: getCensorObj(raw, "eass"),
            Belly: getCensorObj(raw, "ebelly"),
            Breasts: getCensorObj(raw, "ebreasts"),
            Cock: getCensorObj(raw, "ecock"),
            Feet: getCensorObj(raw, "efeet"),
            Pits: getCensorObj(raw, "epits"),
            Pussy: getCensorObj(raw, "epussy")
        },
        enabledPlaceholders: raw.selectedPlaceholders,
        enabledStickers: raw.selectedStickers,
        forceList: raw["blacklist"] ?? [],
        // mode: parseModus(raw.modus),
        obfuscateImages: raw.obfuscate === "true",
        otherCensoring: {
            femaleEyes: (() => {
                const rawEyes = raw.feyes.replace("feyes", "");
                return rawEyes === 'bb' 
                    ? 'Box'
                    : rawEyes === 'sticker'
                        ? 'Sticker'
                        : 'Nothing'
              })(),
            femaleFace: getCensorObj(raw, "fface"),
            maleFace: getCensorObj(raw, "mface")
        },
        rescaleLevel: +raw.rescalinglevel,
        saveLocalCopy: raw.localCopy === 'true',
        videoCensorLevel: +raw.videolevel,
        videoCensorMode: toTitleCase(raw.video.replace("video", "")) as "Block"|"Blur"|"Allow"
    }
}

export const toRaw = (prefs: IPreferences): Partial<rawPreferences> => {
    return {
        animate: prefs.autoAnimate.toString(),
        cass: `cass${prefs.covered.Ass.method.toLowerCase()}`,
        casslevel: prefs.covered.Ass.level.toFixed(1),
        cbelly: `cbelly${prefs.covered.Belly.method.toLowerCase()}`,
        cbellylevel: prefs.covered.Belly.level.toFixed(1),
        cbreasts: `cbreasts${prefs.covered.Breasts.method.toLowerCase()}`,
        cbreastslevel: prefs.covered.Breasts.level.toFixed(1),
        ccock: `ccock${prefs.covered.Cock.method.toLowerCase()}`,
        ccocklevel: prefs.covered.Cock.level.toFixed(1),
        cfeet: `cfeet${prefs.covered.Feet.method.toLowerCase()}`,
        cfeetlevel: prefs.covered.Feet.level.toFixed(1),
        cpits: `cpits${prefs.covered.Pits.method.toLowerCase()}`,
        cpitslevel: prefs.covered.Pits.level.toFixed(1),
        cpussy: `cpussy${prefs.covered.Pussy.method.toLowerCase()}`,
        cpussylevel: prefs.covered.Pussy.level.toFixed(1),
        eass: `eass${prefs.exposed.Ass.method.toLowerCase()}`,
        easslevel: prefs.exposed.Ass.level.toFixed(1),
        ebelly: `ebelly${prefs.exposed.Belly.method.toLowerCase()}`,
        ebellylevel: prefs.exposed.Belly.level.toFixed(1),
        ebreasts: `ebreasts${prefs.exposed.Breasts.method.toLowerCase()}`,
        ebreastslevel: prefs.exposed.Breasts.level.toFixed(1),
        ecock: `ecock${prefs.exposed.Cock.method.toLowerCase()}`,
        ecocklevel: prefs.exposed.Cock.level.toFixed(1),
        efeet: `efeet${prefs.exposed.Cock.method.toLowerCase()}`,
        efeetlevel: prefs.exposed.Feet.level.toFixed(1),
        epits: `epits${prefs.exposed.Pits.method.toLowerCase()}`,
        epitslevel: prefs.exposed.Pits.level.toFixed(1),
        epussy: `epussy${prefs.exposed.Pussy.method.toLowerCase()}`,
        epussylevel: prefs.exposed.Pussy.level.toFixed(1),
        feyes: `feyes${prefs.otherCensoring.femaleEyes === 'Box' ? 'bb' : prefs.otherCensoring.femaleEyes.toLowerCase()}`,
        fface: `fface${prefs.otherCensoring.femaleFace.method.toLowerCase()}`,
        ffacelevel: prefs.otherCensoring.femaleFace.level.toFixed(1),
        localCopy: prefs.saveLocalCopy.toString(),
        mface: `mface${prefs.otherCensoring.maleFace.method.toString()}`,
        mfacelevel: prefs.otherCensoring.maleFace.level.toFixed(1),
        modus: parseMode(prefs.mode),
        obfuscate: prefs.obfuscateImages.toString(),
        rescalinglevel: prefs.rescaleLevel.toFixed(0),
        video: `video${prefs.videoCensorMode}`,
        videolevel: prefs.videoCensorLevel.toFixed(0),
        selectedStickers: prefs.enabledStickers.length ? prefs.enabledStickers : Object.values(prefs.enabledStickers as any)
    }
}

function getCensorObj(rawPrefs: rawPreferences, key: string): {method: CensorType, level: number} {
    return {method: rawPrefs[key].replace(key, "") as CensorType, level: +rawPrefs[key + "level"]};
}

function parseModus(rawType: string): OperationMode {
    switch (rawType) {
        case "standardmodus":
            return OperationMode.Enabled;
        case "demandmous":
            return OperationMode.OnDemand;
        case "disablemodus":
        default:
            return OperationMode.Disabled;
    }
}

function parseMode(mode: OperationMode): string {
    switch (mode) {
        case OperationMode.Disabled:
            return "disablemodus";
        case OperationMode.OnDemand:
            return "demandmodus";
        case OperationMode.Enabled:
            return "standardmodus"
    }
}
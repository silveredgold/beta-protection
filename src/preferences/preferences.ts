import { CensorType, IPreferences, OperationMode, rawPreferences } from "./types";


export async function loadPreferencesFromStorage(): Promise<IPreferences> {
    let result = await chrome.storage.local.get("preferences") as IPreferences;
    return result['preferences'];
}


export const defaultPrefs: IPreferences = {
    
    exposed: {
        Pits: [CensorType.Nothing, 1.0],
        Breasts: [CensorType.Caption, 5],
        Belly: [CensorType.Nothing, 1.9],
        Ass: [CensorType.Pixels, 5],
        Cock: [CensorType.Nothing, 1],
        Feet: [CensorType.Nothing, 1.9],
        Pussy: [CensorType.Sticker, 7.4]
    },
    covered: {
        Pits: [CensorType.Nothing, 1],
        Breasts: [CensorType.Caption, 5],
        Belly: [CensorType.Nothing, 1.9],
        Ass: [CensorType.Pixels, 5],
        Cock: [CensorType.Nothing, 1],
        Feet: [CensorType.Nothing, 1.9],
        Pussy: [CensorType.Sticker, 7.4]
    },
    otherCensoring: {
        femaleEyes: CensorType.Nothing,
        femaleFace: [CensorType.Pixels, 1.0],
        maleFace: [CensorType.Nothing, 1.0]
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
        delay: 5000,
        duration: 200
    },
    allowList: [],
    forceList: []
}

export function createPreferencesFromBackend(raw: rawPreferences): IPreferences {

    return {
        ...defaultPrefs,
        allowList: raw["whitelist"] as string[] ?? [],
        autoAnimate: raw.animate === 'true',
        covered: {
            Ass: [raw.cass.replace("cass", "") as CensorType, +raw.casslevel],
            Belly: [raw.cbelly.replace("cbelly", "") as CensorType, +raw.cbellylevel],
            Breasts: [raw.cbreasts.replace("cbreasts", "") as CensorType, +raw.cbreastslevel],
            Cock: [raw.ccock.replace("ccock", "") as CensorType, +raw.ccocklevel],
            Feet: [raw.cfeet.replace("cfeet", "") as CensorType, +raw.cfeetlevel],
            Pits: [raw.cpits.replace("cpits", "") as CensorType, +raw.cpitslevel],
            Pussy: getCensorSet(raw, "cpussy")
        },
        exposed: {
            Ass: getCensorSet(raw, "eass"),
            Belly: getCensorSet(raw, "ebelly"),
            Breasts: getCensorSet(raw, "ebreasts"),
            Cock: getCensorSet(raw, "ecock"),
            Feet: getCensorSet(raw, "efeet"),
            Pits: getCensorSet(raw, "epits"),
            Pussy: getCensorSet(raw, "epussy")
        },
        enabledPlaceholders: raw.selectedPlaceholders,
        enabledStickers: raw.selectedStickers,
        forceList: raw["blacklist"] ?? [],
        mode: parseModus(raw.modus),
        obfuscateImages: raw.obfuscate === "true",
        otherCensoring: {
            femaleEyes: raw.feyes.replace("feyes", "") as CensorType,
            femaleFace: getCensorSet(raw, "fface"),
            maleFace: getCensorSet(raw, "mface")
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
        cass: `cass${prefs.covered.Ass[0].toLowerCase()}`,
        casslevel: prefs.covered.Ass[1].toFixed(1),
        cbelly: `cbelly${prefs.covered.Belly[0].toLowerCase()}`,
        cbellylevel: prefs.covered.Belly[1].toFixed(1),
        cbreasts: `cbreasts${prefs.covered.Breasts[0].toLowerCase()}`,
        cbreastslevel: prefs.covered.Breasts[1].toFixed(1),
        ccock: `ccock${prefs.covered.Cock[0].toLowerCase()}`,
        ccocklevel: prefs.covered.Cock[1].toFixed(1),
        cfeet: `cfeet${prefs.covered.Feet[0].toLowerCase()}`,
        cfeetlevel: prefs.covered.Feet[1].toFixed(1),
        cpits: `cpits${prefs.covered.Pits[0].toLowerCase()}`,
        cpitslevel: prefs.covered.Pits[1].toFixed(1),
        cpussy: `cpussy${prefs.covered.Pussy[0].toLowerCase()}`,
        cpussylevel: prefs.covered.Pussy[1].toFixed(1),
        eass: `eass${prefs.exposed.Ass[0].toLowerCase()}`,
        easslevel: prefs.exposed.Ass[1].toFixed(1),
        ebelly: `ebelly${prefs.exposed.Belly[0].toLowerCase()}`,
        ebellylevel: prefs.exposed.Belly[1].toFixed(1),
        ebreasts: `ebreasts${prefs.exposed.Breasts[0].toLowerCase()}`,
        ebreastslevel: prefs.exposed.Breasts[1].toFixed(1),
        ecock: `ecock${prefs.exposed.Cock[0].toLowerCase()}`,
        ecocklevel: prefs.exposed.Cock[1].toFixed(1),
        efeet: `efeet${prefs.exposed.Cock[0].toLowerCase()}`,
        efeetlevel: prefs.exposed.Feet[1].toFixed(1),
        epits: `epits${prefs.exposed.Pits[0].toLowerCase()}`,
        epitslevel: prefs.exposed.Pits[1].toFixed(1),
        epussy: `epussy${prefs.exposed.Pussy[0].toLowerCase()}`,
        epussylevel: prefs.exposed.Pussy[1].toFixed(1),
        feyes: `feyes${prefs.otherCensoring.femaleEyes.toLowerCase()}`,
        fface: `fface${prefs.otherCensoring.femaleFace[0].toLowerCase()}`,
        ffacelevel: prefs.otherCensoring.femaleFace[1].toFixed(1),
        localCopy: prefs.saveLocalCopy.toString(),
        mface: `mface${prefs.otherCensoring.maleFace[0].toString()}`,
        mfacelevel: prefs.otherCensoring.maleFace[1].toFixed(1),
        modus: parseMode(prefs.mode),
        obfuscate: prefs.obfuscateImages.toString(),
        rescalinglevel: prefs.rescaleLevel.toFixed(0),
        video: `video${prefs.videoCensorMode}`,
        videolevel: prefs.videoCensorLevel.toFixed(0)
    }
}

function getCensorSet(rawPrefs: rawPreferences, key: string): [CensorType, number] {
    return [rawPrefs[key].replace(key, "") as CensorType, +rawPrefs[key + "level"]];
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

function toTitleCase(str: string) {
    return str.replace(
      /\w\S*/g,
      function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
    );
  }
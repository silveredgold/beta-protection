import { CensorType, IPreferences, OperationMode, rawPreferences } from "./types";


export async function loadPreferencesFromStorage(): Promise<IPreferences> {
    var result = await chrome.storage.local.get("preferences") as IPreferences;
    return result;
}


export const defaultPrefs: IPreferences = {
    
    exposed: {
        Pits: [CensorType.Nothing, 1.0],
        Breasts: [CensorType.Caption, 5],
        Belly: [CensorType.Nothing, 1.9],
        Ass: [CensorType.Pixels, 5],
        Cock: [CensorType.Nothing, 1],
        Feet: [CensorType.Nothing, 1.9]
    },
    covered: {
        Pits: [CensorType.Nothing, 1],
        Breasts: [CensorType.Caption, 5],
        Belly: [CensorType.Nothing, 1.9],
        Ass: [CensorType.Pixels, 5],
        Cock: [CensorType.Nothing, 1],
        Feet: [CensorType.Nothing, 1.9]
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

function createPreferencesFromBackend(raw: rawPreferences): IPreferences {

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
            Pits: [raw.cpits.replace("cpits", "") as CensorType, +raw.cpitslevel]
        },
        exposed: {
            Ass: getCensorSet(raw, "eass"),
            Belly: getCensorSet(raw, "ebelly"),
            Breasts: getCensorSet(raw, "ebreasts"),
            Cock: getCensorSet(raw, "ecock"),
            Feet: getCensorSet(raw, "efeet"),
            Pits: getCensorSet(raw, "epits")
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

function toTitleCase(str: string) {
    return str.replace(
      /\w\S*/g,
      function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
    );
  }
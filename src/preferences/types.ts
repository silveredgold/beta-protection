export interface IPreferences {
    mode: OperationMode;
    exposed: BodyCensorModes;
    covered: BodyCensorModes;
    otherCensoring: {
        femaleEyes: CensorType;
        femaleFace: [CensorType, number],
        maleFace: [CensorType, number]
    }
    videoCensorLevel: number;
    videoCensorMode: "Block"|"Blur"|"Allow";
    rescaleLevel: number;
    saveLocalCopy: boolean;
    obfuscateImages: boolean;
    autoAnimate: boolean;
    enabledPlaceholders: string[];
    enabledStickers: string[];
    subliminal: SubliminalOptions;
    allowList: string[];
    forceList: string[];
}


export enum OperationMode {
    Disabled = "disabled",
    OnDemand = "onDemand",
    Enabled = "enabled"
}

export type SubliminalOptions = {
    enabled: boolean;
    delay: number;
    duration: number;
}

export type RawCensorModes = {
    femaleEyes: CensorType,
    femaleFace: [CensorType, number],
    maleFace: [CensorType, number],
    coveredPits: [CensorType, number],
    exposedPits: [CensorType, number],
    coveredBreasts: [CensorType, number],
    exposedBreasts: [CensorType, number],
    coveredBelly: [CensorType, number],
    exposedBelly: [CensorType, number],
    coveredAss: [CensorType, number],
    exposedAss: [CensorType, number],
    coveredCock: [CensorType, number],
    exposedCock: [CensorType, number],
    coveredFeet: [CensorType, number]
    exposedFeet: [CensorType, number],

}

export type BodyCensorModes = {
    Pits: [CensorType, number],
    Breasts: [CensorType, number],
    Belly: [CensorType, number],
    Ass: [CensorType, number],
    Cock: [CensorType, number],
    Feet: [CensorType, number]
}

export enum CensorType {
    Nothing = "nothing",
    Pixels = "pix",
    Caption = "caption",
    Sticker = "sticker",
    Blur = "blur"
}

export type rawPreferences = {
    video: string;
    modus: string;
    fface: string;
    feyes: string;
    mface: string;
    cpits: string;
    epits: string;
    cbreasts: string;
    ebreasts: string;
    cbelly: string;
    ebelly: string;
    cass: string;
    eass: string;
    cpussy: string;
    epussy: string;
    ccock: string;
    ecock: string;
    cfeet: string;
    efeet: string;
    rescalinglevel: string;
    videolevel: string;
    ffacelevel: string;
    mfacelevel: string;
    cpitslevel: string;
    epitslevel: string;
    cbreastslevel: string;
    ebreastslevel: string;
    cbellylevel: string;
    ebellylevel: string;
    casslevel: string;
    easslevel: string;
    cpussylevel: string;
    epussylevel: string;
    ccocklevel: string;
    ecocklevel: string;
    cfeetlevel: string;
    efeetlevel: string;
    localCopy: string;
    obfuscate: string;
    animate: string;
    selectedPlaceholders: string[];
    selectedStickers: string[];
}
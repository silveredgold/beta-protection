export interface IPreferences {
    mode: OperationMode;
    exposed: BodyCensorModes;
    covered: BodyCensorModes;
    otherCensoring: {
        femaleEyes: CensorType;
        femaleFace: {method: CensorType, level: number},
        maleFace: {method: CensorType, level: number}
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

type CensorMode = {method: CensorType, level: number};

export type BodyCensorModes = {
    Pits: {method: CensorType, level: number},
    Breasts: CensorMode,
    Belly: CensorMode,
    Ass: CensorMode,
    Cock: CensorMode,
    Feet: CensorMode,
    Pussy: CensorMode
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
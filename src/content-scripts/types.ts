import { IExtensionPreferences, IPreferences } from "@/preferences"
import { ICensorBackend } from "@/transport";
import { PageObserver } from "./observer"
import { Purifier } from "./purifier"
import browser from 'webextension-polyfill';

export type CensoringState = {
    activeCensoring: boolean
}

export type CensoringContext = {
    state: CensoringState,
    preferences: IExtensionPreferences,
    backendClient?: ICensorBackend,
    purifier: Purifier,
    observer?: PageObserver,
    port?: browser.Runtime.Port
};

export type ImageStyleElement = {
    element: Element,
    background: string,
    imageUrl?: string
};

export type VideoCensoringOptions = {
    videoMode: "Block" | "Blur" | "Allow",
    gifsAsVideos: boolean
}
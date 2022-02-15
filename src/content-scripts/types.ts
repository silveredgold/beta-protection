import { IPreferences } from "@/preferences/types"
import { WebSocketClient } from "@/transport/webSocketClient"
import { PageObserver } from "./observer"
import { Purifier } from "./purifier"
import browser from 'webextension-polyfill';

export type CensoringState = {
    activeCensoring: boolean
}

export type CensoringContext = {
    state: CensoringState,
    preferences: IPreferences,
    socketClient?: WebSocketClient,
    purifier: Purifier,
    observer?: PageObserver,
    port: browser.Runtime.Port
};

export type ImageStyleElement = {
    element: Element,
    background: string,
    imageUrl?: string
};
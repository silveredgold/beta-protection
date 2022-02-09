import { IPreferences } from "@/preferences/types"
import { WebSocketClient } from "@/transport/webSocketClient"
import { CSSManager } from "./cssManager"
import { PageObserver } from "./observer"
import { Purifier } from "./purifier"

export type CensoringState = {
    activeCensoring: boolean
}

export type CensoringContext = {
    state: CensoringState,
    preferences: IPreferences,
    socketClient?: WebSocketClient,
    purifier: Purifier,
    observer?: PageObserver,
    port: chrome.runtime.Port
};

export type ImageStyleElement = {
    element: Element,
    background: string,
    imageUrl?: string
};
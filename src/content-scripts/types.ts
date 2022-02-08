import { IPreferences } from "@/preferences/types"
import { WebSocketClient } from "@/transport/webSocketClient"
import { CSSManager } from "./cssManager"
import { Purifier } from "./purifier"

export type CensoringState = {
    activeCensoring: boolean
}

export type CensoringContext = {
    // tab: chrome.tabs.Tab,
    state: CensoringState,
    preferences: IPreferences,
    socketClient?: WebSocketClient,
    purifier: Purifier
    // cssManager: CSSManager
}

export type ImageStyleElement = {
    element: Element,
    background: string,
    imageUrl?: string
};
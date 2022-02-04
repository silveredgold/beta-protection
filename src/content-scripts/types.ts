import { IPreferences } from "@/preferences/types"
import { WebSocketClient } from "@/transport/webSocketClient"

export type CensoringState = {
    activeCensoring: boolean
}

export type CensoringContext = {
    state: CensoringState,
    preferences?: IPreferences,
    socketClient?: WebSocketClient
}

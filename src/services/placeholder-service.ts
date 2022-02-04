import { WebSocketClient } from "@/transport/webSocketClient";


export class PlaceholderService {
    private _socketClient: WebSocketClient;

    /**
     *
     */
    constructor(socketClient: WebSocketClient) {
        this._socketClient = socketClient;
        
    }
    
    private _availablePlaceholders: string[] = [];
    public get available() : string[] {
        return this._availablePlaceholders;
    }

    public getLoaded = async (): Promise<any[]> => {
        return [];
    }
    
}
import { CensorMode, IPreferences } from "@silveredgold/beta-shared/preferences";
import { toNudeNet } from "@silveredgold/beta-shared/preferences/nudenet";
import { ActionPayload, AssetType, CancelRequest, ConnectionStatus, ICensorBackend, ImageCensorRequest, ImageCensorResponse, StatisticsData } from "@silveredgold/beta-shared/transport";
import { EventDispatcher, IEvent, ISimpleEvent, SimpleEventDispatcher } from "strongly-typed-events";
import { HttpResponse, HttpTransportType, HubConnectionState } from "@microsoft/signalr";
import signalR, {HubConnectionBuilder} from "@microsoft/signalr";
// import signalR from "@microsoft/signalr/dist/browser/signalr";
import { censorImageRequest, censorImageResponse } from "./types";
import { log } from "missionlog";
import { base64ArrayBuffer, dbgLog } from "@/util";

export class BetaCensorClient implements ICensorBackend {

    private _onImageCensored = new EventDispatcher<ICensorBackend, ImageCensorResponse>();
    private _onReceivePreferences = new EventDispatcher<ICensorBackend, Partial<IPreferences>>();
    private _onUpdate = new SimpleEventDispatcher<ActionPayload>();
    private _connection: signalR.HubConnection;
    private _srcMap = new Map<string, string|number>();
    private _ready: Promise<void>;
    host: string;

    /**
     *
     */
    constructor(host?: string) {
        // debugger;
        this.host = host ?? '//localhost:2382';
        const connection = this.getConnection();
        this._connection = connection;
        connection.on('handleCensoredImage', (payload) => {
            this.handleCensoredImage(payload);
        });
        connection.on('onRequestUpdate', (requestId: string, stateMessage: string) => {
            console.info('got request update!', requestId, stateMessage);
        });
        connection.on('onCensoringError', (requestId: string, errorMessage: string) => {
            console.warn('got image error!', requestId, errorMessage);
        });
        connection.onclose(e => {
            if (e) {
                console.log('SignalR transport connection closed!', e);
            }
        });
        this._ready = connection.start();
    }

    private getConnection = (host?: string) => {
        const connection = new HubConnectionBuilder()
            .withUrl((host ?? this.host) + "/live", {
                transport: HttpTransportType.WebSockets,
                skipNegotiation: true
            })
            .build();
        return connection;
    }

    private handleCensoredImage = (payload: censorImageResponse) => {
        console.debug('got censored image result payload', payload);
        // console.timeEnd('censor:internal');
        // console.timeEnd('censor:transport');
        console.debug('session info', payload.imageResult['session']);
        console.timeEnd(`censorRequest:${payload.requestId}`);
        if (payload.requestId) {
            const status = this._onImageCensored.dispatch(this, {
                id: payload.requestId,
                url: payload.censoredImage?.imageDataUrl,
                srcId: this._srcMap.get(payload.requestId)?.toString(),
                responseData: {},
                error: payload.error
            });
            if (this.ephemeral) {
                setTimeout(() => {
                    this._connection.stop();
                }, 1000);
            }
        }
    }
    
    ephemeral: boolean = false;
    async censorImage(request: ImageCensorRequest): Promise<ImageCensorResponse | undefined> {
        if (request.srcId) {
            this._srcMap.set(request.id, request.srcId);
            const opts = toBetaCensor(request.preferences);
            // console.time('getImageData');
            let encoded: string|undefined = undefined;
            if (request.url.startsWith('data:')) {
                encoded = request.url;
            } else {
                try {
                    dbgLog('fetching path', request.url);
                    const resp = await fetch(request.url, {credentials: 'include'});
                    const type = resp.headers.get('content-type');
                    dbgLog('getting buffer from bg response', resp.status, type);
                    const blob = await resp.blob();
                    encoded = await new Promise<string>( callback =>{
                        let reader = new FileReader();
                        reader.onload = function(){ callback(this.result as string) } ;
                        reader.readAsDataURL(blob);
                    });
                } catch (e) {
                    log.warn('fetch', 'Failed to fetch image, reverting to URL request', e);
                }
            }
            // console.timeEnd('getImageData');
            const payload: censorImageRequest = {
                RequestId: request.id,
                ImageDataUrl: encoded ?? null,
                ImageUrl: request.url,
                CensorOptions: opts
            };
            console.log('payload char length: ' + JSON.stringify(payload).length);
            await this._ready;
            console.debug('sending model payload', payload);
            // const test = await this._connection.invoke('CensorImageSimple', request.url);
            // console.time('censor:transport');
            console.log('signalr: sending request', request.id);
            console.time(`censorRequest:${request.id}`);
            const result: boolean = await this._connection.invoke('CensorImage', payload);
            // console.time('censor:internal');
            console.log('signalr: request sent', request.id, result);
        }
        return undefined;
    }
    get onImageCensored() {
        return this._onImageCensored.asEvent();
    }
    getRemotePreferences(): Promise<Partial<IPreferences>> {
        return Promise.resolve({});
    }
    get onReceivePreferences() {
        return this._onReceivePreferences.asEvent();
    }
    updateRemotePreferences(preferences: IPreferences): Promise<boolean> {
        return Promise.resolve(false);
    }
    getStatistics(): Promise<StatisticsData | undefined> {
        return Promise.resolve(undefined);
    }
    resetStatistics(): Promise<boolean> {
        return Promise.resolve(false);
    }
    getAvailableAssets(assetType: AssetType): Promise<string[] | undefined> {
        return Promise.resolve(undefined);
    }
    get onUpdate() {
        return this._onUpdate.asEvent();
    }
    cancelRequests(request: CancelRequest): Promise<void> {
        return Promise.resolve();
    }
    check(host?: string): Promise<ConnectionStatus> {
        return new Promise<ConnectionStatus>((resolve, reject) => {
            const status: ConnectionStatus = {available: false};
            const connection = new HubConnectionBuilder()
            .withUrl((host ?? this.host) + "/live", {
                transport: HttpTransportType.WebSockets,
                skipNegotiation: true
            })
            .withAutomaticReconnect([1,2])
            .build();
            connection.start()
                .then(() => {
                    status.available = connection.state === HubConnectionState.Connected;
                    connection.stop();
                    resolve(status);
                }).catch(reason => {
                    status.message = reason.toString();
                    resolve(status);
                });
        })
    }

}

const toBetaCensor = (prefs: IPreferences): {[key: string]: {CensorType: string, Level: number}} => {
    return {
        COVERED_BELLY: toPayload(prefs.covered.Belly),
        COVERED_BREAST_F: toPayload(prefs.covered.Breasts),
        COVERED_BUTTOCKS: toPayload(prefs.covered.Ass),
        COVERED_FEET: toPayload(prefs.covered.Feet),
        COVERED_GENITALIA_F: toPayload(prefs.covered.Pussy),
        EXPOSED_ANUS: toPayload(prefs.exposed.Ass),
        EXPOSED_ARMPITS: toPayload(prefs.exposed.Pits),
        EXPOSED_BELLY: toPayload(prefs.exposed.Belly),
        EXPOSED_BREAST_F: toPayload(prefs.exposed.Breasts),
        EXPOSED_BUTTOCKS: toPayload(prefs.exposed.Ass),
        EXPOSED_FEET: toPayload(prefs.exposed.Feet),
        EXPOSED_GENITALIA_F: toPayload(prefs.exposed.Pussy),
        EXPOSED_GENITALIA_M: toPayload(prefs.exposed.Cock),
        FACE_F: toPayload(prefs.otherCensoring.femaleFace),
        FACE_M: toPayload(prefs.otherCensoring.maleFace)
    };
}

const toPayload = (type: CensorMode) => {
    return {CensorType: type.method, Level: Math.round(type.level)};
}
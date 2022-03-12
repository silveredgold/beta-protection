import { CensorMode, CensorType, IPreferences } from "@silveredgold/beta-shared/preferences";
import { toNudeNet } from "@silveredgold/beta-shared/preferences/nudenet";
import { ActionPayload, AssetType, CancelRequest, ConnectionStatus, ICensorBackend, ImageCensorRequest, ImageCensorResponse, StatisticsData } from "@silveredgold/beta-shared/transport";
import { EventDispatcher, IEvent, ISimpleEvent, SimpleEventDispatcher } from "strongly-typed-events";
import { HttpResponse, HttpTransportType, HubConnectionState } from "@microsoft/signalr";
import signalR, { HubConnectionBuilder } from "@microsoft/signalr";
// import signalR from "@microsoft/signalr/dist/browser/signalr";
import { censorImageRequest, censorImageResponse } from "./types";
import { log } from "missionlog";
import { base64ArrayBuffer, dbg, dbgLog, dbgTime } from "@/util";

export class BetaCensorClient implements ICensorBackend {

    private _onImageCensored = new EventDispatcher<ICensorBackend, ImageCensorResponse>();
    private _onReceivePreferences = new EventDispatcher<ICensorBackend, Partial<IPreferences>>();
    private _onUpdate = new SimpleEventDispatcher<ActionPayload>();
    private _connection: signalR.HubConnection;
    private _srcMap = new Map<string, string | number>();
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
        console.debug('got censored image result payload', payload, payload.imageResult['session']);
        // console.timeEnd('censor:internal');
        // console.timeEnd('censor:transport');
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
            let encoded: string | undefined = undefined;
            if (request.url.startsWith('data:')) {
                encoded = request.url;
            } else {
                try {
                    // dbgLog('fetching path', request.url);
                    const resp = await fetch(request.url, { credentials: 'include' });
                    const type = resp.headers.get('content-type');
                    // dbgLog('getting buffer from bg response', resp.status, type);
                    const blob = await resp.blob();
                    encoded = await new Promise<string>(callback => {
                        const reader = new FileReader();
                        reader.onload = function () { callback(this.result as string) };
                        reader.readAsDataURL(blob);
                    });
                } catch (e) {
                    log.warn('fetch', 'Failed to fetch image, reverting to URL request', e);
                }
            }
            const payload: censorImageRequest = {
                RequestId: request.id,
                ImageDataUrl: encoded ?? null,
                ImageUrl: request.url,
                CensorOptions: opts
            };
            if (JSON.stringify(payload).length > 4194304) {
                console.warn('payload would have exceeded message limits! Attempting to trim.');
                if (payload.ImageUrl) {
                    payload.ImageDataUrl = undefined;
                }
            }
            await this._ready;
            dbg('sending model payload', payload);
            dbgTime(`censorRequest:${request.id}`);
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
    async getAvailableAssets(assetType: AssetType): Promise<string[] | undefined> {
        if (assetType == "stickers") {
            const resp = await fetch(this.host + "/assets/categories?type=stickers");
            const json = await resp.json() as string[];
            return json;
        }
        return undefined;
    }
    get onUpdate() {
        return this._onUpdate.asEvent();
    }
    async cancelRequests(request: CancelRequest): Promise<void> {
        try {
            dbg('starting cancel request', request);
            await this._ready;
            dbgLog('got cancel request', request, this._srcMap);
            const requests = request.requestId === undefined ? [] : typeof request.requestId === 'string' ? [request.requestId] : request.requestId as unknown as string[];
            for (const [id, src] of this._srcMap.entries()) {
                if (src == request.srcId) {
                    requests.push(id);
                }
            }
            const uniqueRequests = [...new Set(requests)];
            dbg('invoking cancel', uniqueRequests);
            await this.ensureConnected();
            // dbg('connection ready for cancel');
            this._connection.invoke("CancelRequests", { requests: uniqueRequests });
        } catch {
            //ignored
        }
    }
    check(host?: string): Promise<ConnectionStatus> {
        return new Promise<ConnectionStatus>((resolve, reject) => {
            const status: ConnectionStatus = { available: false, name: 'Beta Censoring' };
            const connection = new HubConnectionBuilder()
                .withUrl((host ?? this.host) + "/live", {
                    transport: HttpTransportType.WebSockets,
                    skipNegotiation: true
                })
                .withAutomaticReconnect([1, 2])
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

    ensureConnected = (): Promise<void> => {
        if (this._connection.state !== HubConnectionState.Connected) {
            return this._connection.start();
        } else {
            return Promise.resolve();
        }
    }

}

const toBetaCensor = (prefs: IPreferences): { [key: string]: { CensorType: string, Level: number } } => {
    return {
        COVERED_BELLY: toPayload(prefs.covered.Belly, prefs),
        COVERED_BREAST_F: toPayload(prefs.covered.Breasts, prefs),
        COVERED_BUTTOCKS: toPayload(prefs.covered.Ass, prefs),
        COVERED_FEET: toPayload(prefs.covered.Feet, prefs),
        COVERED_GENITALIA_F: toPayload(prefs.covered.Pussy, prefs),
        EXPOSED_ANUS: toPayload(prefs.exposed.Ass, prefs),
        EXPOSED_ARMPITS: toPayload(prefs.exposed.Pits, prefs),
        EXPOSED_BELLY: toPayload(prefs.exposed.Belly, prefs),
        EXPOSED_BREAST_F: toPayload(prefs.exposed.Breasts, prefs),
        EXPOSED_BUTTOCKS: toPayload(prefs.exposed.Ass, prefs),
        EXPOSED_FEET: toPayload(prefs.exposed.Feet, prefs),
        EXPOSED_GENITALIA_F: toPayload(prefs.exposed.Pussy, prefs),
        EXPOSED_GENITALIA_M: toPayload(prefs.exposed.Cock, prefs),
        FACE_F: toPayload(prefs.otherCensoring.femaleFace, prefs),
        FACE_M: toPayload(prefs.otherCensoring.maleFace, prefs)
    };
}

const toPayload = (type: CensorMode, prefs: IPreferences): {CensorType: CensorType|string, Level: number} => {
    if (type.method == CensorType.Sticker) {
        return {CensorType: type.method + ":" + prefs.enabledStickers.join(';'), Level: Math.round(type.level)};
    } else {
        return { CensorType: type.method, Level: Math.round(type.level) };
    }
}
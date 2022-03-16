import { ICensorBackend } from '@silveredgold/beta-shared/transport';
import { InjectionKey } from 'vue';
import { BetaCensoringProvider } from './beta-censor';
import { BetaSafetyProvider } from './beta-safety';
import { RuntimePortManager } from './runtimePort';
import browser from 'webextension-polyfill';


export class BackendService {

    static create = async (): Promise<BackendService> => {
        // let host: string|undefined = undefined;
        // let backend: string|undefined = undefined;
        const configHost = await browser.storage.local.get({'backendHost': 'ws://localhost:8090/ws', 'backendId': 'beta-safety'});
            const host = configHost['backendHost'] as string;
            const backend = configHost['backendId'] as string;
            return new BackendService(backend, host, [new BetaSafetyProvider(), new BetaCensoringProvider()]);
        
    }
    /**
     *
     */
    private constructor(id: string, host: string, providers?: IBackendProvider<ICensorBackend>[]) {
        this._availableProviders = providers ?? [];
        id = id ?? this.defaultId;
        this._currentProvider = this._availableProviders.find(p => p.id == id)!;
        this._host = host;
    }

    private _availableProviders: IBackendProvider<ICensorBackend>[] = [];

    public addProvider(provider: IBackendProvider<ICensorBackend>): BackendService {
        this._availableProviders.push(provider);
        return this;
    }

    private _host : string;
    public get host() : string {
        return this._host;
    }
    public set host(v : string) {
        this._host = v;
    }
    
    

    
    private _defaultId : string = 'beta-safety';
    public get defaultId() : string {
        return this._defaultId;
    }
    public set defaultId(v : string) {
        this._defaultId = v;
    }

    private _currentProvider: IBackendProvider<ICensorBackend>;
    public get currentProvider() : IBackendProvider<ICensorBackend> {
        return this._currentProvider;
    }

    getSupported = (url?: string) => {
        if (url) {
            return this._availableProviders.filter(p => p.supportsUrl(url)).map(p => p.id);
        } else {
            return this._availableProviders.map(p => p.id);
        }
    }

    setCurrentProvider = (id: string) => {
        const validProvider = this._availableProviders.find(p => p.id == id);
        if (!validProvider) {
            throw new Error(`Could not find supported backend provider for '${id}'!`);
        }
        this._currentProvider = validProvider;
        return this;
    }
}

export interface IBackendProvider<ICensorBackend> {
    readonly id: string;
    supportsUrl(url: string): boolean;
    getClient(portManager: RuntimePortManager, host?: string): Promise<ICensorBackend>;
    getRequestClient(requestId: string, portManager: RuntimePortManager, host?: string): Promise<ICensorBackend>;
}

export * from '@silveredgold/beta-shared/transport';

// export const backendProvider: InjectionKey<() => IBackendProvider<ICensorBackend>> = Symbol();
export const backendService: InjectionKey<() => Promise<BackendService>> = Symbol();
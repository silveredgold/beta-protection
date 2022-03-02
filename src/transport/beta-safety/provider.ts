import { getExtensionVersion } from "@/util";
import { ICensorBackend, IBackendProvider } from "@/transport";
import browser from 'webextension-polyfill';
import { BetaSafetyBackendClient, defaultMessageEvents } from ".";
import { ExtensionEventHandler } from "./eventHandler";
import { RuntimePortManager } from "../runtimePort";

const version = getExtensionVersion();


export class BetaSafetyProvider implements IBackendProvider<ICensorBackend> {
    public get name() : string {
        return "Beta Safety"
    }
    
    async getClient(portManager: RuntimePortManager, host?: string): Promise<ICensorBackend> {
        if (__DEBUG__) {
            console.trace('creating new socket client!');
        }
        if (!host) {
            const configHost = await browser.storage.local.get('backendHost');
            if (configHost['backendHost']) {
                host = configHost['backendHost'];
            }
        }
        const client = new BetaSafetyBackendClient(defaultMessageEvents, undefined, host);
        client.version = version;
        ExtensionEventHandler.RegisterEvents(client, portManager);
        return client;
    }
    async getRequestClient(requestId: string, portManager: RuntimePortManager, host?: string): Promise<ICensorBackend> {
        if (__DEBUG__) {
            console.trace('creating new request socket client!');
        }
        if (!host) {
            const configHost = await browser.storage.local.get('backendHost');
            if (configHost['backendHost']) {
                host = configHost['backendHost'];
            }
        }
        const client = new BetaSafetyBackendClient(defaultMessageEvents, requestId, host);
        client.version = version;
        ExtensionEventHandler.RegisterEvents(client, portManager);
        return client;
    }

}
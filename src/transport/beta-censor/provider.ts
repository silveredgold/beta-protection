import { getExtensionVersion } from "@/util";
import { ICensorBackend, IBackendProvider } from "@/transport";
import browser from 'webextension-polyfill';
import { RuntimePortManager } from "../runtimePort";
import { BetaCensorClient } from "@silveredgold/beta-censor-client";
import { PreferencesService } from "@/stores";

const version = getExtensionVersion();


export class BetaCensoringProvider implements IBackendProvider<ICensorBackend> {
    supportsUrl(url: string): boolean {
        return (url.startsWith('http') || url.startsWith('https')) && !url.endsWith('/ws');
    }
    public get id() : string {
        return "beta-censoring"
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
        const client = new BetaCensorClient(host);
        this.registerEvents(client, portManager);
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
        const client = new BetaCensorClient(host);
        client.ephemeral = true;
        this.registerEvents(client, portManager);
        return client;
    }

    private registerEvents(backend: ICensorBackend, portManager: RuntimePortManager) {
        backend.onImageCensored.subscribe(async (sender, payload) => {
            if (payload.srcId !== '-1') {
                const store = PreferencesService.create();
                const prefs = payload.responseData['preferences']
                    ? payload.responseData['preferences']
                    : (await store).currentPreferences;
                if (payload.error) {
                    console.log(`error image response`, payload);
                    payload.url = prefs.errorMode === 'normal'
                        ? browser.runtime.getURL("images/error_normal.jpg")
                        : browser.runtime.getURL("images/error_simple.png");
                }
                const body = {
                    msg: "setSrc", censorURL: payload.url, id: payload.id, 
                    tabid: payload.srcId ? +payload.srcId : undefined, error: payload.error
                };
                portManager.sendMessage(body, payload.id);
            }
        });
    }
}
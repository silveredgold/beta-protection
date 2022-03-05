import { Plugin } from "vue";
import { backendProvider, censorBackend, IBackendProvider, ICensorBackend } from "@/transport";
import { BetaCensoringProvider } from "@/transport/beta-censor";
import { BetaSafetyProvider } from "./transport/beta-safety";
import { RuntimePortManager } from "./transport/runtimePort";

export const getProvider = (): IBackendProvider<ICensorBackend> => {
    return new BetaCensoringProvider();
}

export const backendProviderPlugin: BackendPlugin = {
    provider: getProvider(),
    install: (app, options) => {
        const provider = getProvider();
        const getBackend = (requestId?: string) => {
            return requestId 
                ? provider.getRequestClient(requestId, new RuntimePortManager(), options?.host)
                : provider.getClient(new RuntimePortManager(), options?.host);
        }
        app.provide(backendProvider, provider);
        app.provide(censorBackend, getBackend());
    }
}

export type BackendPlugin = Plugin & {
    provider: IBackendProvider<ICensorBackend>;
}
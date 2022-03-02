import { Plugin } from "vue";
import { backendProvider, censorBackend } from "@/transport";
import { BetaSafetyProvider } from "./transport/beta-safety";
import { RuntimePortManager } from "./transport/runtimePort";

export const backendProviderPlugin: Plugin = {
    install: (app, options) => {
        const provider = new BetaSafetyProvider();
        const getBackend = (requestId?: string) => {
            return requestId 
                ? provider.getRequestClient(requestId, new RuntimePortManager(), options?.host)
                : provider.getClient(new RuntimePortManager(), options?.host);
        }
        app.provide(backendProvider, provider);
        app.provide(censorBackend, getBackend());
    }
}
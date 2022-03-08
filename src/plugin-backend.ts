import { Plugin } from "vue";
import { backendService, BackendService, IBackendProvider, ICensorBackend } from "@/transport";
import { RuntimePortManager } from "./transport/runtimePort";
import { censorBackend } from "@silveredgold/beta-shared-components";
import { dbgLog } from "./util";

export const backendProviderPlugin: BackendPlugin = {
    install: (app, options) => {
        const getBackendAsync = () => new Promise<ICensorBackend>((resolve) => {
            dbgLog('getting backend service for injection');
            BackendService.create().then(service => {
                dbgLog('getting censoring backend for injection', service);
                const provider = service.currentProvider;
                resolve(provider.getClient(new RuntimePortManager(), options?.host));
            })
        });
        const getBackend = async (requestId?: string) => {
            const service = await BackendService.create();
            const provider = service.currentProvider;
            return requestId 
                ? provider.getRequestClient(requestId, new RuntimePortManager(), options?.host)
                : provider.getClient(new RuntimePortManager(), options?.host);
        }
        // app.provide(backendProvider, () => _service.current);
        app.provide(censorBackend, getBackendAsync);
        app.provide(backendService, BackendService.create);
    }
}

export type BackendPlugin = Plugin & {
    // provider: IBackendProvider<ICensorBackend>;
}
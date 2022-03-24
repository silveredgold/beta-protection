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
        app.provide(censorBackend, getBackendAsync);
        app.provide(backendService, BackendService.create);
    }
}

// this was going to have a lot of other stuff in it that's now in the BackendService
export type BackendPlugin = Plugin & {
    // provider: IBackendProvider<ICensorBackend>;
}
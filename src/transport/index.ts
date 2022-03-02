import { ICensorBackend } from '@silveredgold/beta-shared/transport';
import { InjectionKey } from 'vue';
import { RuntimePortManager } from './runtimePort';

export interface IBackendProvider<ICensorBackend> {
    readonly name: string;
    getClient(portManager: RuntimePortManager, host?: string): Promise<ICensorBackend>;
    getRequestClient(requestId: string, portManager: RuntimePortManager, host?: string): Promise<ICensorBackend>;
}

export * from '@silveredgold/beta-shared/transport';

export const backendProvider: InjectionKey<IBackendProvider<ICensorBackend>> = Symbol();
export const censorBackend: InjectionKey<Promise<ICensorBackend>> = Symbol();
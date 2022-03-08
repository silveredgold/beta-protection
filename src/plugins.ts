import { Component, createApp } from "vue";
import { backendProviderPlugin } from '@/plugin-backend';
import { eventEmitterPlugin } from "@silveredgold/beta-shared-components";

export function createBetaApp(rootComponent: Component, options: {unwrapInjected?: boolean, enableBackend?: boolean, enableEvents?: boolean} = {}) {
    const app = createApp(rootComponent);
    if (options.enableBackend) {
        app.use(backendProviderPlugin);
    }
    if (options.enableEvents) {
        app.use(eventEmitterPlugin);
    }
    if (options.unwrapInjected) {
        app.config.unwrapInjectedRef = true;
    }
    return app;
}
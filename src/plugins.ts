import { Component, createApp } from "vue";
import { backendProviderPlugin } from '@/plugin-backend';
import { eventEmitterPlugin } from "@silveredgold/beta-shared-components";
import { createPinia } from "pinia";

export function createBetaApp(rootComponent: Component, options: {unwrapInjected?: boolean, enableBackend?: boolean, enableEvents?: boolean, disableStore?: boolean} = {}) {
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
    if (!options.disableStore) {
        app.use(createPinia());
    }
    return app;
}
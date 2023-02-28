import { Component, createApp, h } from "vue";
import { backendProviderPlugin } from '@/plugin-backend';
import { eventEmitterPlugin } from "@silveredgold/beta-shared-components";
import { createPinia } from "pinia";
import { DebouncePlugin } from "./stores/debounce";
import AsyncView from "./views/AsyncView.vue"
import { InitializePlugin, PersistencePlugin } from "./stores/persistent";

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
        const pinia = createPinia();
        pinia.use(InitializePlugin);
        pinia.use(DebouncePlugin);
        pinia.use(PersistencePlugin)
        app.use(pinia);
    }
    return app;
}

export function createBetaView(rootComponent: Component) {
    return h(AsyncView, {component: rootComponent});
}

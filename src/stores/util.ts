import { createBetaView } from "@/plugins";
import { createPinia, Pinia, setActivePinia } from "pinia";
import { createApp } from "vue";
import { DebouncePlugin } from "./debounce";
import { InitializePlugin, PersistencePlugin } from "./persistent";
import { usePreferencesStore } from "./preferences";
import Container from "@/components/Container.vue"

export const loadPreferencesPlugin = async () => {
  const app = createApp(null!);
  const pinia = createPinia();
  pinia.use(PersistencePlugin);
  pinia.use(DebouncePlugin);
  pinia.use(InitializePlugin);
  setActivePinia(pinia);
  app.use(pinia);

  const preferencesStore = usePreferencesStore(undefined, pinia);
  console.log('got pinia state for preferences', preferencesStore.$state);
  await (preferencesStore as any).ready;
  console.log('finished waiting for preferences to be ready');
  return preferencesStore;
}

export const getPreferencesPlugin = () => {
  const app = createApp(Container);
  const pinia = getPinia();
  // setActivePinia(pinia);
  app.use(pinia);

  const preferencesStore = usePreferencesStore(undefined, pinia);
  console.log('got pinia state for preferences direct', preferencesStore.$state);
  return preferencesStore;
}

let piniaInstance: Pinia|null = null

export const getPinia = (): Pinia => {
    if (piniaInstance !== null) return piniaInstance

    piniaInstance = createPinia();
    piniaInstance.use(PersistencePlugin);
    piniaInstance.use(InitializePlugin);

    return piniaInstance
}

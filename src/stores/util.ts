import { createBetaView } from "@/plugins";
import { createPinia, Pinia, setActivePinia } from "pinia";
import { createApp } from "vue";
import { DebouncePlugin } from "./debounce";
import { InitializePlugin, PersistencePlugin } from "./persistent";
import { usePreferencesStore } from "./preferences";

export const getPreferencesStore = (readOnly: boolean = true) => {
  const app = createApp(null!);
  const pinia = getPinia();
  // setActivePinia(pinia);
  app.use(pinia);

  const preferencesStore = usePreferencesStore(undefined, pinia, readOnly);
  return preferencesStore;
}

export const waitForPreferencesStore = async (readOnly: boolean = true) => {
  const store = getPreferencesStore(readOnly);
  await store.ready;
  return store;
}

let piniaInstance: Pinia|null = null

export const getPinia = (): Pinia => {
    if (piniaInstance !== null) return piniaInstance

    piniaInstance = createPinia();
    piniaInstance.use(PersistencePlugin);
    piniaInstance.use(InitializePlugin);

    return piniaInstance
}

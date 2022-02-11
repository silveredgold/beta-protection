<template>
  <n-config-provider :theme-overrides="themeOverrides" :theme="theme">
    <n-notification-provider>
      <store-header v-if="preferences" :placeholders="placeholders" :preferences="preferences" style="height: calc(20vh - 3rem);" />
      <store v-if="preferences" :preferences="preferences" :placeholders="placeholders" style="height: calc(80vh - 3rem);" />
    </n-notification-provider>
    <n-global-style />
  </n-config-provider>
</template>

<script setup lang="ts">
import { darkTheme, NConfigProvider, NGlobalStyle, NNotificationProvider, NCard, NButton, NIcon, NAvatar, NPageHeader, NSpace, NCollapse, NCollapseItem, GlobalThemeOverrides, useOsTheme, NGrid, NGi } from "naive-ui";
import { Settings } from "@vicons/ionicons5";
import BackendHost from '../components/BackendHost.vue';
import { InjectionKey, onMounted, provide, reactive, Ref, ref, onBeforeMount, computed, watch } from 'vue';
import { debounce } from "throttle-debounce";
import { defaultPrefs, getAvailablePlaceholders, IPreferences, loadPreferencesFromStorage, savePreferencesToStorage } from '../preferences';
import { updateUserPrefs, userPrefs } from "@/options/services";
import { themeOverrides } from "../util";
import browser from 'webextension-polyfill';
import StoreHeader from './StoreHeader.vue';
import Store from './components/Store.vue';
import mitt from 'mitt';
import { eventEmitter, ActionEvents } from "@/messaging";
import { PlaceholderSet } from "./types";
import { PlaceholderService } from "@/services/placeholder-service";

const events = mitt<ActionEvents>();
const osTheme = useOsTheme()
const theme = computed(() => (osTheme.value === 'dark' ? darkTheme : null))

const preferences = ref<IPreferences|undefined>(undefined);
const placeholders = ref<PlaceholderSet>({allImages: [], categories: []});

const getCurrentPrefs = async () => {
  var storeResponse = await loadPreferencesFromStorage();
  console.log(`options loaded prefs:`, storeResponse);
  return storeResponse;
}

const getCurrentPlaceholders = async () => {
  const storeResponse = await getAvailablePlaceholders();
  console.log(`options loaded placeholders:`, storeResponse);
  return storeResponse;
}

const _updateFunc = debounce(1000, async (prefs) => {
  console.log(`persisting prefs`, prefs);
  console.log(`serialized prefs`, JSON.stringify(prefs));
  await savePreferencesToStorage(prefs);
  return true;
})

const updatePreferences = async (prefs?: IPreferences) => {
    const targetPrefs = prefs?.mode ? prefs : preferences;
    return await _updateFunc(targetPrefs);
}

watch(preferences, async (newMode, prevMode) => {
    console.log('new mode', newMode);
}, {deep: true});

onBeforeMount(async () => {
  preferences.value = await getCurrentPrefs();
  placeholders.value = await getCurrentPlaceholders();
});

browser.runtime.onMessage.addListener((request, sender) => {
  if (request['msg'] === 'reloadPreferences') {
    setTimeout(() => {
      console.log('reloading preferences for placeholder view');
      getCurrentPrefs().then(prefs => {
        preferences.value = prefs;
      });
    }, 1000);
  }
});

events.on('reload', evt => {
  console.log('got emitter event', evt);
  if (evt == 'placeholders') {
    getCurrentPlaceholders().then(set => {
      placeholders.value = set;
    });
  } else if (evt == 'preferences') {
    getCurrentPrefs().then(prefs => {
      preferences.value = prefs;
    });
  }
});

// provide(userPrefs, prefs);
provide(updateUserPrefs, updatePreferences);
provide(eventEmitter, events);


</script>

<style>
html {
  max-width: 80%;
  padding: 1.5rem;
  margin-left:auto;
  margin-right:auto;
}
</style>

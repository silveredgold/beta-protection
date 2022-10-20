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
import { darkTheme, NConfigProvider, NGlobalStyle, NNotificationProvider, useOsTheme} from "naive-ui";
import { provide, ref, onBeforeMount, computed } from 'vue';
import { getAvailablePlaceholders, IExtensionPreferences } from '@/preferences';
import { updateUserPrefs } from "@silveredgold/beta-shared-components";
import { themeOverrides, dbg } from "@/util";
import browser from 'webextension-polyfill';
import StoreHeader from './StoreHeader.vue';
import {Store} from '@/components/placeholders';
import { useEventEmitter } from "@silveredgold/beta-shared-components";
import { PlaceholderSet } from "./types";
import { loadPreferencesStore } from "@/stores";

const events = useEventEmitter();
const osTheme = useOsTheme()
const theme = computed(() => (osTheme.value === 'dark' ? darkTheme : null))

const preferences = ref<IExtensionPreferences|undefined>(undefined);
const placeholders = ref<PlaceholderSet>({allImages: [], categories: []});

const store = await loadPreferencesStore();

const getCurrentPrefs = async () => {
  var storeResponse = await store.load();
  dbg(`options loaded prefs:`, storeResponse);
  return storeResponse;
}

const getCurrentPlaceholders = async () => {
  const storeResponse = await getAvailablePlaceholders();
  dbg(`options loaded placeholders:`, storeResponse);
  return storeResponse;
}

const updatePrefs = async (preferences?: IExtensionPreferences) => {
  await store.save(preferences);
  return true;
}
// watch(preferences, async (newMode, prevMode) => {
//     console.log('new mode', newMode);
// }, {deep: true});

onBeforeMount(async () => {
  preferences.value = await getCurrentPrefs();
  placeholders.value = await getCurrentPlaceholders();
});

browser.runtime.onMessage.addListener((request, sender) => {
  if (request['msg'] === 'reloadPreferences') {
    setTimeout(() => {
      dbg('reloading preferences for placeholder view');
      getCurrentPrefs().then(prefs => {
        preferences.value = prefs;
      });
    }, 1000);
  }
});

events?.on('reload', evt => {
  dbg('got emitter event', evt);
  if (evt == 'placeholders') {
    getCurrentPlaceholders().then(set => {
      placeholders.value = set;
    });
  } else if (evt == 'preferences') {
    store.load();
  }
});

// provide(userPrefs, prefs);
provide(updateUserPrefs, updatePrefs);

</script>
<style>
html {
  max-width: 80%;
  padding: 1.5rem;
  margin-left:auto;
  margin-right:auto;
}
</style>

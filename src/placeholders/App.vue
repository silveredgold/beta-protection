<template>
  <n-config-provider :theme-overrides="themeOverrides" :theme="theme">
    <n-notification-provider>
      <n-page-header
        subtitle="For the full set of options, check the extension settings"
        style="padding-bottom: 2rem;"
      >
        <template #title>Beta Protection</template>
        <!-- <template #header>
      <n-breadcrumb>
        <n-breadcrumb-item>Podcast</n-breadcrumb-item>
        <n-breadcrumb-item>Best Collection</n-breadcrumb-item>
        <n-breadcrumb-item>Ultimate Best Collection</n-breadcrumb-item>
        <n-breadcrumb-item>Anyway.FM</n-breadcrumb-item>
      </n-breadcrumb>
        </template>-->
        <template #avatar>
          <n-avatar :src="iconSrc" />
        </template>
        <template #extra>
          <n-space>
            <n-button size="small">
              <n-icon size="30" :component="Settings" />
            </n-button>
          </n-space>
        </template>
        <template #footer>To change the censoring mode, use the popup from your extension toolbar!</template>
      </n-page-header>
    </n-notification-provider>
    <n-global-style />
  </n-config-provider>
</template>

<script setup lang="ts">
import { darkTheme, NConfigProvider, NGlobalStyle, NNotificationProvider, NCard, NButton, NIcon, NAvatar, NPageHeader, NSpace, NCollapse, NCollapseItem, GlobalThemeOverrides, useOsTheme } from "naive-ui";
import { Settings } from "@vicons/ionicons5";
import BackendHost from '../components/BackendHost.vue';
import { InjectionKey, onMounted, provide, reactive, Ref, ref, onBeforeMount, computed, watch } from 'vue';
import { debounce } from "throttle-debounce";
import { defaultPrefs, IPreferences, loadPreferencesFromStorage, savePreferencesToStorage } from '../preferences';
import { updateUserPrefs, userPrefs } from "./services";
import CensoringPreferences from "../components/CensoringPreferences.vue";
import VideoOptions from "../components/VideoOptions.vue";
import PlaceholderOptions from "../components/placeholders/PlaceholderOptions.vue";
import StickerOptions from "../components/StickerOptions.vue";
import SettingsReset from "../components/SettingsReset.vue";
import ConnectionStatus from "../components/ConnectionStatus.vue";
import DomainListOptions from "../components/DomainListOptions.vue";
import { themeOverrides } from "../util";

const osTheme = useOsTheme()
const theme = computed(() => (osTheme.value === 'dark' ? darkTheme : null))

// let prefs = ref({} as IPreferences);

const iconSrc = chrome.runtime.getURL('/images/icon.png');

const getCurrentPrefs = async () => {
  var storeResponse = await loadPreferencesFromStorage();
  console.log(`options loaded prefs:`, storeResponse);
  // prefs = reactive(storeResponse);
  return storeResponse;
}

const updateFunc = debounce(1000, async (prefs) => {
  console.log(`persisting prefs`, prefs);
  console.log(`serialized prefs`, JSON.stringify(prefs));
  await savePreferencesToStorage(prefs);
})

let store = reactive({
  preferences: {} as IPreferences,
  updatePreferences(prefs?: IPreferences) {
    let targetPrefs = prefs?.mode ? prefs : this.preferences;
    updateFunc(targetPrefs);
    // var storeResponse = await chrome.storage.local.set({ 'preferences': targetPrefs });
  }
})

let prefs = computed(() => store.preferences);

watch(prefs, async (newMode, prevMode) => {
    console.log('new mode', newMode);
}, {deep: true});

const updatePrefs = async (preferences?: IPreferences) => {
  console.log(`queuing prefs save`);
  store.updatePreferences(preferences);
}

onBeforeMount(async () => {
  store.preferences = await getCurrentPrefs();
});

chrome.runtime.onMessage.addListener((request, sender, response) => {
  if (request['msg'] === 'reloadPreferences') {
    setTimeout(() => {
      console.log('reloading preferences for options view');
      getCurrentPrefs().then(prefs => {
        store.preferences = prefs;
      });
    }, 1000);
  }
});

// provide(userPrefs, prefs);
provide(updateUserPrefs, updatePrefs);


</script>

<style scoped>
html {
  width: 800px;
  height: 800px;
  padding: 1.5rem;
}
</style>

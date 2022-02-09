<template>
  <n-config-provider :theme-overrides="themeOverrides" :theme="theme">
    <n-notification-provider>
      <n-page-header
        style="padding-bottom: 2rem;"
      >
        <template #title>Beta Protection</template>
        <template #avatar>
          <n-avatar :src="iconSrc" />
        </template>
        <template #extra>
          <n-popover trigger="click">
            <template #trigger>
              <n-button size="small">
                <n-icon size="30" :component="InformationCircleOutline" />
              </n-button>
            </template>
            <div class="medium-text">v{{extensionVersion}}</div>
          </n-popover>
        </template>
        <template #footer>To change the censoring mode, use the popup from your extension toolbar!</template>
      </n-page-header>
      <connection-status :style="{marginBottom: '2em'}" />
      <n-collapse :style="{ marginTop: '1em', marginBottom: '1em', padding: '0.5em'}">
        <n-collapse-item title="Backend Host" name="backend-host">
          <backend-host />
          <template #header-extra>Set where your backend is running</template>
        </n-collapse-item>
        <n-collapse-item title="Censoring Options" name="censoring-options" v-if="prefs">
          <censoring-preferences :preferences="prefs" />
          <error-options :preferences="prefs" />
          <template #header-extra>Fine tune the censoring</template>
        </n-collapse-item>
        <n-collapse-item title="Video Options" name="video-options" v-if="prefs">
          <video-options :preferences="prefs" />
          <template #header-extra>Choose video behaviour</template>
        </n-collapse-item>
        <n-collapse-item title="Placeholders and Stickers" name="placeholder-options" v-if="prefs">
          <placeholder-options :preferences="prefs" v-if="prefs" />
          <sticker-options :preferences="prefs" v-if="prefs" />
          <template #header-extra>Choose your placeholders and stickers</template>
        </n-collapse-item>
        <n-collapse-item title="Placeholder Store" name="placeholder-store" v-if="prefs">
          <placeholder-upload :preferences="prefs" />
          <beta-safety-import :preferences="pref" />
          <template #header-extra>Add new placeholders</template>
        </n-collapse-item>
        <n-collapse-item title="Domain Lists" name="domain-options" v-if="prefs">
          <domain-list-options :preferences="prefs" v-if="prefs" />
          <template #header-extra>Edit your allowed and forced sites</template>
        </n-collapse-item>
        <n-collapse-item title="Danger Zone" name="danger=zone">
          <settings-reset />
          <template #header-extra>Be careful in here!</template>
        </n-collapse-item>
      </n-collapse>
    </n-notification-provider>
    <n-global-style />
  </n-config-provider>
</template>

<script setup lang="ts">
import { darkTheme, NConfigProvider, NGlobalStyle, NNotificationProvider, NCard, NButton, NIcon, NAvatar, NPageHeader, NSpace, NCollapse, NCollapseItem, GlobalThemeOverrides, useOsTheme, NPopover } from "naive-ui";
import { InformationCircleOutline } from "@vicons/ionicons5";
import BackendHost from '../components/BackendHost.vue';
import { InjectionKey, onMounted, provide, reactive, Ref, ref, onBeforeMount, computed, watch } from 'vue';
import { debounce } from "throttle-debounce";
import { defaultPrefs, IPreferences, loadPreferencesFromStorage, savePreferencesToStorage } from '../preferences';
import { updateUserPrefs, userPrefs } from "./services";
import CensoringPreferences from "../components/CensoringPreferences.vue";
import VideoOptions from "../components/VideoOptions.vue";
import PlaceholderOptions from "../components/PlaceholderOptions.vue";
import {PlaceholderUpload, BetaSafetyImport} from "../components/placeholders";
import StickerOptions from "../components/StickerOptions.vue";
import SettingsReset from "../components/SettingsReset.vue";
import ConnectionStatus from "../components/ConnectionStatus.vue";
import DomainListOptions from "../components/DomainListOptions.vue";
import { getExtensionVersion, themeOverrides } from "../util";
import ErrorOptions from "@/components/ErrorOptions.vue";

const osTheme = useOsTheme()
const theme = computed(() => (osTheme.value === 'dark' ? darkTheme : null))
const extensionVersion = getExtensionVersion();
// const notif = useNotification();

// let prefs = ref({} as IPreferences);

const iconSrc = chrome.runtime.getURL('/images/icon.png');

const getCurrentPrefs = async () => {
  var storeResponse = await loadPreferencesFromStorage();
  console.log(`options loaded prefs:`, storeResponse);
  // prefs = reactive(storeResponse);
  return storeResponse;
}

const updateFunc = debounce(1000, async (prefs) => {
  // console.log(`persisting prefs`, prefs);
  // console.log(`serialized prefs`, JSON.stringify(prefs));
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

const openPopup = () => {
  chrome.runtime.open
}

// provide(userPrefs, prefs);
provide(updateUserPrefs, updatePrefs);


</script>

<style>
html {
  max-width: 800px;
  height: 800px;
  padding: 1.5rem;
  margin-left:auto;
  margin-right:auto;
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
}

/* purgecss start ignore */
@tailwind base;
@tailwind components;
/* purgecss end ignore */

@tailwind utilities;
</style>

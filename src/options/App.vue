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
          <backend-host class="control-group" />
          <privacy-options :preferences="prefs" class="control-group" />
          <template #header-extra>Set where your backend is running</template>
        </n-collapse-item>
        <n-collapse-item title="Censoring Options" name="censoring-options" v-if="prefs">
          <censoring-preferences :preferences="prefs" class="control-group" />
          <error-options :preferences="prefs" class="control-group" />
          <template #header-extra>Fine tune the censoring</template>
        </n-collapse-item>
        <n-collapse-item title="Video Options" name="video-options" v-if="prefs">
          <video-options :preferences="prefs" class="control-group" />
          <template #header-extra>Choose video behaviour</template>
        </n-collapse-item>
        <n-collapse-item title="Placeholders and Stickers" name="placeholder-options" v-if="prefs">
          <n-alert title="About Placeholders" type="default" closable>
            <template #icon>
              <n-icon :component="InformationCircle" />
            </template>
            While censoring takes place, images will be replaced by a placeholder image randomly selected from the images in any enabled categories. Here is where you choose which categories you want to see images from.
          </n-alert>
          <placeholder-options :preferences="prefs" v-if="prefs" class="control-group" />
          <sticker-options :preferences="prefs" v-if="prefs" class="control-group" />
          <template #header-extra>Choose your placeholders and stickers</template>
        </n-collapse-item>
        <n-collapse-item title="Placeholder Store" name="placeholder-store" v-if="prefs">
          <n-alert title="About Placeholders" type="default" closable>
            <template #icon>
              <n-icon :component="InformationCircle" />
            </template>
            While censoring takes place, images will be replaced by a placeholder image randomly selected from the images in any enabled categories. Here is where you add additional placeholders.
          </n-alert>
          <n-collapse :style="{ marginTop: '1em', marginBottom: '1em', padding: '0.5em'}">
            <n-collapse-item title="Placeholder Management">
              <open-store />
              <template #header-extra>Manage your installed placeholders</template>
            </n-collapse-item>
            <n-collapse-item title="Upload and Import">
              <placeholder-upload :preferences="prefs" class="control-group" />
              <beta-safety-import :preferences="prefs" class="control-group" />
              <template #header-extra>Import new placeholders</template>
            </n-collapse-item>
          </n-collapse>
          
          <template #header-extra>Add new placeholders</template>
        </n-collapse-item>
        <n-collapse-item title="Domain Lists" name="domain-options" v-if="prefs">
          <domain-list-options :preferences="prefs" v-if="prefs" class="control-group" />
          <template #header-extra>Edit your allowed and forced sites</template>
        </n-collapse-item>
        <n-collapse-item title="Danger Zone" name="danger=zone">
          <subliminal-options :preferences="prefs" v-if="prefs.subliminal" class="control-group" />
          <settings-reset class="control-group" />
          <template #header-extra>Be careful in here!</template>
        </n-collapse-item>
      </n-collapse>
    </n-notification-provider>
    <n-global-style />
  </n-config-provider>
</template>

<script setup lang="ts">
import { darkTheme, NConfigProvider, NGlobalStyle, NNotificationProvider, NButton, NIcon, NAvatar, NPageHeader, NCollapse, NCollapseItem, GlobalThemeOverrides, useOsTheme, NPopover, NAlert, NCard } from "naive-ui";
import { InformationCircleOutline, InformationCircle } from "@vicons/ionicons5";
import BackendHost from '../components/BackendHost.vue';
import { InjectionKey, onMounted, provide, reactive, Ref, ref, onBeforeMount, computed, watch } from 'vue';
import { debounce } from "throttle-debounce";
import { defaultPrefs, IPreferences, loadPreferencesFromStorage, savePreferencesToStorage } from '../preferences';
import { updateUserPrefs, userPrefs } from "./services";
import CensoringPreferences from "../components/CensoringPreferences.vue";
import VideoOptions from "../components/VideoOptions.vue";
import PlaceholderOptions from "../components/placeholders/PlaceholderOptions.vue";
import {PlaceholderUpload, BetaSafetyImport} from "../components/placeholders";
import StickerOptions from "../components/StickerOptions.vue";
import SettingsReset from "../components/SettingsReset.vue";
import ConnectionStatus from "../components/ConnectionStatus.vue";
import DomainListOptions from "../components/DomainListOptions.vue";
import { getExtensionVersion, themeOverrides } from "../util";
import ErrorOptions from "@/components/ErrorOptions.vue";
import SubliminalOptions from "@/components/SubliminalOptions.vue";
import PrivacyOptions from "@/components/PrivacyOptions.vue";
import OpenStore from "@/placeholders/components/OpenStore.vue";
import { eventEmitter, ActionEvents } from "@/messaging";
import browser from 'webextension-polyfill';
import mitt from "mitt";

const osTheme = useOsTheme()
const theme = computed(() => (osTheme.value === 'dark' ? darkTheme : null))
const extensionVersion = getExtensionVersion();
const events = mitt<ActionEvents>();
// const notif = useNotification();

// let prefs = ref({} as IPreferences);

const iconSrc = browser.runtime.getURL('/images/icon.png');

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

const store = reactive({
  preferences: {} as IPreferences,
  updatePreferences(prefs?: IPreferences) {
    const targetPrefs = prefs?.mode ? prefs : this.preferences;
    updateFunc(targetPrefs);
    // var storeResponse = await chrome.storage.local.set({ 'preferences': targetPrefs });
  }
})

const prefs = computed(() => store.preferences);

watch(prefs, async (newMode, prevMode) => {
    console.log('new mode', newMode);
}, {deep: true});

const updatePrefs = async (preferences?: IPreferences) => {
  console.log(`queuing prefs save`);
  store.updatePreferences(preferences);
  return true;
}

onBeforeMount(async () => {
  store.preferences = await getCurrentPrefs();
});

browser.runtime.onMessage.addListener((request, sender) => {
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
provide(eventEmitter, events);


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

.control-group {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
</style>

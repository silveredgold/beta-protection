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
          <n-space item-style="display: flex;" justify="end">
            <n-popover trigger="hover" placement="bottom">
              <template #trigger>
                  <n-button @click="openCensoring">
                      <n-icon size="30" :component="Images" />
                  </n-button>
              </template>
              Open Censoring
            </n-popover>
            <n-popover trigger="hover" placement="bottom">
              <template #trigger>
                  <n-button @click="openOverrides">
                      <n-icon size="30" :component="LockOpen" />
                  </n-button>
              </template>
              Open Overrides
            </n-popover>
            <n-popover trigger="hover" placement="bottom">
              <template #trigger>
                  <n-button @click="openStatistics">
                      <n-icon size="30" :component="StatsChart" />
                  </n-button>
              </template>
              Open Statistics
            </n-popover>
            <n-popover trigger="click" placement="bottom-end">
              <template #trigger>
                <n-button >
                  <n-icon size="30" :component="InformationCircleOutline" />
                </n-button>
              </template>
              <extension-info />
            </n-popover>
          </n-space>
        </template>
        <template #footer>To change the censoring mode, use the popup from your extension toolbar!</template>
      </n-page-header>
      <connection-status :style="{marginBottom: '2em'}" :host-config="getHost" />
      <n-collapse :style="{ marginTop: '1em', marginBottom: '1em', padding: '0.5em'}" style="width: unset;">
        <n-collapse-item title="Backend Host" name="backend-host">
          <suspense>
            <backend-host class="control-group" />
          </suspense>
          <privacy-options :preferences="prefs" class="control-group" />
          <template #header-extra>Set where your backend is running</template>
        </n-collapse-item>
        <n-collapse-item title="Censoring Options" name="censoring-options" v-if="prefs">
          <overridable-option :option="currentOverride?.preferences?.covered" title="Censoring Preferences">
            <censoring-preferences :preferences="prefs" class="control-group" />
          </overridable-option>
          <overridable-option title="Error Display Preferences" :option="currentOverride?.preferences?.errorMode">
            <error-options :preferences="prefs" class="control-group" />
          </overridable-option>
          <template #header-extra>Fine tune the censoring</template>
        </n-collapse-item>
        <n-collapse-item title="Video Options" name="video-options" v-if="prefs">
          <overridable-option :option="currentOverride?.preferences?.videoCensorMode">
            <video-options :preferences="prefs" class="control-group" />
          </overridable-option>
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
        <n-collapse-item title="Placeholder Management" name="placeholder-store" v-if="prefs">
          <n-alert title="About Placeholders" type="default" closable>
            <template #icon>
              <n-icon :component="InformationCircle" />
            </template>
            While censoring takes place, images will be replaced by a placeholder image randomly selected from the images in any enabled categories. Here is where you add additional placeholders.
          </n-alert>
          <n-collapse :style="{ marginTop: '1em', marginBottom: '1em', padding: '0.5em'}">
            <n-collapse-item title="Placeholder Store">
              <open-store />
              <template #header-extra>Manage your installed placeholders</template>
            </n-collapse-item>
            <n-collapse-item title="Upload and Import">
              <placeholder-upload :preferences="prefs" class="control-group" />
              <beta-safety-import :preferences="prefs" class="control-group" />
              <template #header-extra>Import new placeholders</template>
            </n-collapse-item>
          </n-collapse>
          
          <template #header-extra>Add and remove placeholders</template>
        </n-collapse-item>
        <n-collapse-item title="Domain Lists" name="domain-options" v-if="prefs">
          <overridable-option :option="currentOverride?.preferences?.allowList">
            <domain-list-options :allow-list="prefs.allowList" :force-list="prefs.forceList" v-if="prefs" class="control-group" />
          </overridable-option>
          <template #header-extra>Edit your allowed and forced sites</template>
        </n-collapse-item>
        <n-collapse-item title="Danger Zone" name="danger=zone">
          <subliminal-options :preferences="prefs" v-if="prefs.subliminal" class="control-group" />
          <settings-reset class="control-group" />
          <template #header-extra>Be careful in here!</template>
        </n-collapse-item>
      </n-collapse>
      <import-export @imported="handleImport" :preferences="prefs" />
    </n-notification-provider>
    <n-global-style />
  </n-config-provider>
</template>

<script setup lang="ts">
import { darkTheme, NConfigProvider, NGlobalStyle, NNotificationProvider, NButton, NIcon, NAvatar, NPageHeader, NCollapse, NCollapseItem, NSpace, useOsTheme, NPopover, NAlert } from "naive-ui";
import { InformationCircleOutline, InformationCircle, StatsChart, LockOpen, Images } from "@vicons/ionicons5";
import BackendHost from '@/components/BackendHost.vue';
import { provide, reactive, Ref, ref, onBeforeMount, computed, watch } from 'vue';
import { debounce } from "throttle-debounce";
import { IExtensionPreferences, IOverride, IPreferences, loadPreferencesFromStorage, savePreferencesToStorage } from '@/preferences';
import { updateUserPrefs, userPrefs } from "@silveredgold/beta-shared-components";
import { themeOverrides, dbgLog } from "@/util";
import {PlaceholderUpload, BetaSafetyImport, PlaceholderOptions} from "@/components/placeholders";
import StickerOptions from "@/components/StickerOptions.vue";
import SettingsReset from "@/components/SettingsReset.vue";
import DomainListOptions from "@/components/DomainListOptions.vue";

import SubliminalOptions from "@/components/SubliminalOptions.vue";
import PrivacyOptions from "@/components/PrivacyOptions.vue";
import OpenStore from "@/components/placeholders/OpenStore.vue";
import ExtensionInfo from "@/components/ExtensionInfo.vue";
import { webExtensionNavigation } from "@/components/util";
import browser from 'webextension-polyfill';
import {OverridableOption} from "@/components/overrides";
import { OverrideService } from "@/services/override-service";
import { ImportExport, CensoringPreferences, VideoOptions, ConnectionStatus, ErrorOptions } from "@silveredgold/beta-shared-components";
import type {HostConfigurator} from '@silveredgold/beta-shared-components'
const { openOverrides, openStatistics, openCensoring } = webExtensionNavigation;

const getHost: HostConfigurator = {
  getBackendHost: async () : Promise<string> => {
    const configHost = await browser.storage.local.get('backendHost');
    const host = configHost['backendHost'];
    return host;
  }
}

const osTheme = useOsTheme()
const theme = computed(() => (osTheme.value === 'dark' ? darkTheme : null))

const iconSrc = browser.runtime.getURL('/images/icon.png');

const currentOverride: Ref<IOverride<IExtensionPreferences>|undefined> = ref(undefined);

const getCurrentPrefs = async () => {
  const storeResponse = await loadPreferencesFromStorage();
  dbgLog(`options loaded prefs:`, storeResponse);
  const overrideService = await OverrideService.create();
  currentOverride.value = overrideService.current;
  // prefs = reactive(storeResponse);
  return storeResponse;
}

const updateFunc = debounce(500, async (prefs) => {
  await savePreferencesToStorage(prefs);
})

const store = reactive({
  preferences: {} as IExtensionPreferences,
  updatePreferences(prefs?: IPreferences) {
    const targetPrefs = prefs?.mode ? prefs : this.preferences;
    updateFunc(targetPrefs);
    // var storeResponse = await chrome.storage.local.set({ 'preferences': targetPrefs });
  }
})

const prefs = computed(() => store.preferences);

// watch(prefs, async (newMode, prevMode) => {
//     dbgLog('new mode', newMode);
// }, {deep: true});

const updatePrefs = async (preferences?: IPreferences) => {
  dbgLog(`queuing prefs save`);
  store.updatePreferences(preferences);
  return true;
}

const handleImport = (prefs: IExtensionPreferences) => {
  updatePrefs(prefs).then(() => {
    console.log('imported new preferences!', prefs);
  });
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

.control-group {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
</style>

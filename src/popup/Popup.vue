<template>
<n-config-provider :theme-overrides="themeOverrides" :theme="darkTheme">
  <n-notification-provider>
    <n-card size="small">
    <n-page-header subtitle="For the full set of options, check the extension settings" >
    <template #title>
        Beta Protection
    </template>
    <!-- <template #avatar>
      <n-avatar :src="iconSrc" />
    </template> -->
    <template #extra>
      <n-space item-style="display: flex;" justify="end" :vertical="true">
        <n-button-group>
          <n-popover trigger="hover" placement="bottom">
            <template #trigger>
                <n-button size="small" @click="openCensoring">
                    <n-icon size="25" :component="Images" />
                </n-button>
            </template>
            Open Censoring
        </n-popover>
        <n-popover trigger="hover" placement="bottom">
            <template #trigger>
                <n-button size="small" @click="openStatistics">
                    <n-icon size="25" :component="StatsChart" />
                </n-button>
            </template>
            Open Statistics
        </n-popover>
        <n-popover trigger="hover" placement="bottom">
            <template #trigger>
                <n-button size="small" @click="openSettings">
                    <n-icon size="25" :component="Settings" />
                </n-button>
            </template>
            Open Settings
        </n-popover>
        </n-button-group>
      </n-space>
    </template>
  </n-page-header>
  <connection-status :compact="true" :host-config="getHost" />
  <mode-switch />
  <overridable-option :option="currentOverride?.preferences?.videoCensorMode" title="Video Censoring">
    <video-options :preferences="prefs" :compact="true" />
  </overridable-option>
  </n-card>
  </n-notification-provider>
  <n-global-style />
</n-config-provider>

</template>

<script setup lang="ts">
import { NButton, NButtonGroup, darkTheme, NGlobalStyle, NConfigProvider, NNotificationProvider, NPageHeader, NAvatar, NSpace, NIcon, NPopover, NCard } from "naive-ui";
import { Settings, StatsChart, LockClosed, Images } from "@vicons/ionicons5";
import ModeSwitch from "@/components/ModeSwitch.vue";
import { webExtensionNavigation } from "@/components/util";
import { IExtensionPreferences, IOverride } from "@/preferences";
import { computed, onBeforeMount, provide, reactive, ref, Ref, watch } from "vue";
import { updateUserPrefs } from "@silveredgold/beta-shared-components";
import { ConnectionStatus, VideoOptions } from "@silveredgold/beta-shared-components";
import { dbg, dbgLog, themeOverrides } from "@/util";
import browser from 'webextension-polyfill';
import { OverridableOption } from "@/components/overrides";
import type {HostConfigurator} from '@silveredgold/beta-shared-components';
import { usePreferencesStore } from "@/stores";
const { openOverrides, openStatistics, openSettings, openCensoring } = webExtensionNavigation

const getHost: HostConfigurator = {
  getBackendHost: async () : Promise<string> => {
    const configHost = await browser.storage.local.get('backendHost');
    const host = configHost['backendHost'];
    return host;
  }
}

const iconSrc = browser.runtime.getURL('/images/icon.png');

// const currentOverride: Ref<IOverride<IExtensionPreferences>|undefined> = ref(undefined);

const store = usePreferencesStore();

//component setup
const prefs = computed(() => store.currentPreferences);
const currentOverride = computed(() => store.currentOverride);

const updatePrefs = async (preferences?: IExtensionPreferences) => {
  // var err = new Error();
  dbgLog(`queuing prefs save`, preferences);
  // console.trace();
  await store.save(preferences);
  return true;
}

provide(updateUserPrefs, updatePrefs);


//I don't see how this would ever be possible/needed, but may as well
browser.runtime.onMessage.addListener((request, sender) => {
  if (request['msg'] === 'reloadPreferences') {
    setTimeout(() => {
      dbg('reloading preferences for options view');
      store.load();
    }, 1000);
  }
});

onBeforeMount(async () => {
  await store.load();
});

// provide(userPrefs, prefs);

</script>

<style>
html {
  width: 500px;
  height: 540px;
}
</style>

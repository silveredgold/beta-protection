<template>
<n-config-provider :theme-overrides="themeOverrides" :theme="darkTheme">
  <n-notification-provider>
    <n-card size="small">
    <n-page-header subtitle="For the full set of options, check the extension settings" >
    <template #title>
        Beta Protection
    </template>
    <template #avatar>
      <n-avatar :src="iconSrc" />
    </template>
    <template #extra>
      <n-space item-style="display: flex;" justify="end" :vertical="true">
        <n-button-group>
          <n-popover trigger="hover" placement="bottom">
            <template #trigger>
                <n-button size="small" @click="openOverrides">
                    <n-icon size="25" :component="LockClosed" />
                </n-button>
            </template>
            Open Overrides
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
    <!-- <template #footer>Ensure you already have Beta Safety running in the background!</template> -->
  </n-page-header>
  <connection-status :compact="true" />
  <mode-switch />
  <overridable-option :option="currentOverride?.preferences?.videoCensorMode">
    <video-options :preferences="prefs" :compact="true" />
  </overridable-option>
  </n-card>
  </n-notification-provider>
  <n-global-style />
</n-config-provider>
  
</template>

<script setup lang="ts">
import { NButton, NButtonGroup, darkTheme, NGlobalStyle, NConfigProvider, NNotificationProvider, NPageHeader, NAvatar, NSpace, NIcon, NPopover, NCard } from "naive-ui";
import { Settings, StatsChart, LockClosed } from "@vicons/ionicons5";
import VideoOptions from "@/components/VideoOptions.vue";
import ModeSwitch from "@/components/ModeSwitch.vue";
import { openSettings, openStatistics, openOverrides } from "@/components/util"
import { IOverride, IPreferences, loadPreferencesFromStorage, savePreferencesToStorage } from "@/preferences";
import { debounce } from "throttle-debounce";
import { computed, onBeforeMount, provide, reactive, ref, Ref, watch } from "vue";
import { updateUserPrefs } from "@/options/services";
import ConnectionStatus from "../components/ConnectionStatus.vue";
import { themeOverrides } from "../util";
import browser from 'webextension-polyfill';
import { OverrideService } from "@/services/override-service";
import { OverridableOption } from "@/components/overrides";


const iconSrc = browser.runtime.getURL('/images/icon.png');

const currentOverride: Ref<IOverride|undefined> = ref(undefined);

// loading
const getCurrentPrefs = async () => {
  var storeResponse = await loadPreferencesFromStorage();
  console.log(`popup loaded prefs:`, storeResponse);
  const overrideService = await OverrideService.create();
  currentOverride.value = overrideService.current;
  return storeResponse;
}

// store bullshit
const updateFunc = debounce(1000, async (prefs) => {
  console.log(`persisting prefs`, prefs);
  await savePreferencesToStorage(prefs);
  return true;
  // const n = notif?.create({
  //         content: 'Saved!',
  //         duration: 2500,
  //         closable: true
  //       });
});

const store = reactive({
  preferences: {} as IPreferences,
  async updatePreferences(prefs?: IPreferences) {
    const targetPrefs = prefs?.mode ? prefs : this.preferences;
    const result = await updateFunc(targetPrefs);
    return result;
    // var storeResponse = await chrome.storage.local.set({ 'preferences': targetPrefs });
  }
})

//component setup
const prefs = computed(() => store.preferences);

watch(prefs, async (newMode, prevMode) => {
    console.log('new mode', newMode);
}, {deep: true});

const updatePrefs = async (preferences: IPreferences | undefined) => {
  const result = await store.updatePreferences(preferences);
  return result;
}

provide(updateUserPrefs, updatePrefs);


//I don't see how this would ever be possible/needed, but may as well
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

onBeforeMount(async () => {
  store.preferences = await getCurrentPrefs();
});

// provide(userPrefs, prefs);

</script>

<style>
html {
  width: 500px;
  height: 540px;
}
</style>

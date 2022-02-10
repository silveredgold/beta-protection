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
      <n-space>
        <n-button size="small" @click="openSettings">
            <n-icon size="25" :component="Settings" />
        </n-button>
      </n-space>
    </template>
    <!-- <template #footer>Ensure you already have Beta Safety running in the background!</template> -->
  </n-page-header>
  <connection-status />
  <mode-switch />
  <video-options :preferences="prefs" :compact="true" />
  </n-card>
  </n-notification-provider>
  <n-global-style />
</n-config-provider>
  
</template>

<script setup lang="ts">
import { NButton, darkTheme, NGlobalStyle, NConfigProvider, NNotificationProvider, NPageHeader, NAvatar, NSpace, NIcon, GlobalThemeOverrides, NCard } from "naive-ui";
import { Settings } from "@vicons/ionicons5";
import VideoOptions from "../components/VideoOptions.vue";
import ModeSwitch from "../components/ModeSwitch.vue";
import { IPreferences, loadPreferencesFromStorage, savePreferencesToStorage } from "@/preferences";
import { debounce } from "throttle-debounce";
import { computed, onBeforeMount, provide, reactive, watch } from "vue";
import { updateUserPrefs } from "@/options/services";
import ConnectionStatus from "../components/ConnectionStatus.vue";
import { themeOverrides } from "../util";


const iconSrc = chrome.runtime.getURL('/images/icon.png');
// const notif = useNotification();
const openSettings = () => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
}

// loading
const getCurrentPrefs = async () => {
  var storeResponse = await loadPreferencesFromStorage();
  console.log(`popup loaded prefs:`, storeResponse);
  // prefs = reactive(storeResponse);
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

onBeforeMount(async () => {
  store.preferences = await getCurrentPrefs();
});

// provide(userPrefs, prefs);

</script>

<style>
html {
  width: 500px;
  height: 500px;
}
</style>

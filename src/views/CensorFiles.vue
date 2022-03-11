<template>
  <n-config-provider :theme-overrides="themeOverrides" :theme="theme">
    <n-notification-provider>
        <n-tabs size="large" justify-content="space-evenly">
        <!-- <n-tabs type="segment"> -->
            <n-tab-pane name="local" tab="Local Files">
                <Suspense>
                    <template #fallback>
                        Loading...
                    </template>
                        <LocalCensorWizard v-if="!!currentPreferences" :preferences="currentPreferences" />
                </Suspense>
            </n-tab-pane>
            <n-tab-pane name="remote" tab="Create New">
                <Suspense>
                    <template #fallback>
                        Loading...
                    </template>
                        test
                </Suspense>
            </n-tab-pane>
        </n-tabs>
    </n-notification-provider>
    <n-global-style />
  </n-config-provider>
</template>

<script setup lang="ts">
import { darkTheme, NConfigProvider, NGlobalStyle, NNotificationProvider, GlobalThemeOverrides, useOsTheme, NTabs, NTabPane } from "naive-ui";
import { InjectionKey, onMounted, provide, reactive, Ref, ref, onBeforeMount, computed, watch, Suspense } from 'vue';
import { dbg, themeOverrides } from "@/util";
import browser from 'webextension-polyfill';
import {OverrideDetails, CreateOverride} from "@/components/overrides"
import { OverrideService } from "@/services/override-service";
import { IOverride, IPreferences, loadPreferencesFromStorage } from "@/preferences";
import { overrideService } from "./override";
import { useEventEmitter } from "@silveredgold/beta-shared-components";
import LocalCensorWizard from "@/components/LocalCensorWizard.vue";

const osTheme = useOsTheme()
const theme = computed(() => (osTheme.value === 'dark' ? darkTheme : null));
const events = useEventEmitter();

const currentPreferences: Ref<IPreferences|undefined> = ref(undefined);

onBeforeMount(async () => {
    await onUpdate();
});

const onUpdate = async () => {
    const prefs = await loadPreferencesFromStorage();
    currentPreferences.value = prefs;
}

// events.on('reload', evt => {
//   console.log('got emitter event', evt);
//   if (evt == 'override' && svc) {
//     svc?.value?.reload();
//   }
// });

</script>

<style>
html {
  max-width: 80%;
  padding: 1.5rem;
  margin-left:auto;
  margin-right:auto;
}
</style>

<template>
  <n-config-provider :theme-overrides="themeOverrides" :theme="theme">
    <n-notification-provider>
        <n-tabs size="large" justify-content="space-evenly">
        <!-- <n-tabs type="segment"> -->
            <n-tab-pane name="current" tab="Current">
                <Suspense>
                    <template #fallback>
                        Loading...
                    </template>
                        <override-details />
                </Suspense>
            </n-tab-pane>
            <n-tab-pane name="create" tab="Create New">
                <Suspense>
                    <template #fallback>
                        Loading...
                    </template>
                        <create-override />
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
import { IExtensionPreferences, IOverride } from "@/preferences";
import { overrideService } from "./override";
import { useEventEmitter } from "@silveredgold/beta-shared-components";

const osTheme = useOsTheme()
const theme = computed(() => (osTheme.value === 'dark' ? darkTheme : null));
const events = useEventEmitter();

// const svc: Ref<OverrideService|undefined> = ref(undefined);

const current: Ref<IOverride<IExtensionPreferences>|undefined> = ref(undefined);

// onBeforeMount(async () => {
//     await onUpdate();
// });

// const onUpdate = async () => {
//     const service = await OverrideService.create();
//     dbg('onUpdate', service);
//     // svc.value = service;
//     current.value = service.current;
// }

// events.on('reload', evt => {
//   console.log('got emitter event', evt);
//   if (evt == 'override' && svc) {
//     svc?.value?.reload();
//   }
// });

// provide(overrideService, computed(() => svc.value) as unknown);

browser.runtime.onMessage.addListener((msg, sender) => {
    if (msg.msg == 'storageChange:local' && msg.keys && msg.keys.includes('override')) {
        events?.emit('reload', 'override');
    }
    if (msg.msg == 'reloadOverride') {
        // svc?.value?.reload();
    }
});

</script>

<style>
html {
  max-width: 80%;
  padding: 1.5rem;
  margin-left:auto;
  margin-right:auto;
}
</style>

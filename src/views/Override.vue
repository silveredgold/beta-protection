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
                        <override-details :override="current" />
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
import { themeOverrides } from "../util";
import browser from 'webextension-polyfill';
import mitt from 'mitt';
import { eventEmitter, ActionEvents } from "@/messaging";
import { StatisticsData, StatisticsService } from "@/services/statistics-service";
import {OverrideDetails, CreateOverride} from "@/components/overrides"
import { OverrideService } from "@/services/override-service";
import { IOverride } from "@/preferences";
import { overrideService } from "./override";

const events = mitt<ActionEvents>();
const osTheme = useOsTheme()
const theme = computed(() => (osTheme.value === 'dark' ? darkTheme : null))

let svc: Ref<OverrideService|undefined> = ref(undefined);

const current: Ref<IOverride|undefined> = ref(undefined);

onBeforeMount(async () => {
    await onUpdate();
});

const onUpdate = async () => {
    const service = await OverrideService.create();
    console.log('onUpdate', service);
    svc.value = service;
    current.value = service.current;
}



// browser.runtime.onMessage.addListener((request, sender) => {
//   if (request['msg'] === 'reloadStatistics' && request['statistics']) {
//     statistics.value = request.statistics as StatisticsData
//   }
// });

events.on('reload', evt => {
  console.log('got emitter event', evt);
  if (evt == 'override' && svc) {
    svc?.value?.reload();
  }
});

// provide()
provide(eventEmitter, events);
provide(overrideService, computed(() => svc.value) as unknown);

</script>

<style>
html {
  max-width: 80%;
  padding: 1.5rem;
  margin-left:auto;
  margin-right:auto;
}
</style>

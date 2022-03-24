<template>
  <n-config-provider :theme-overrides="themeOverrides" :theme="theme">
    <n-notification-provider>
      <Suspense>
          <template #fallback>
            Loading...
          </template>
            <statistics-header v-if="statistics" :statistics="statistics"  :nav-service="webExtensionNavigation"  />
      </Suspense>
      <Suspense>
          <template #fallback>
            Loading...
          </template>
            <statistics-detail v-if="statistics" :statistics="statistics" :nav-service="webExtensionNavigation" />
      </Suspense>
    </n-notification-provider>
    <n-global-style />
  </n-config-provider>
</template>

<script setup lang="ts">
import { darkTheme, NConfigProvider, NGlobalStyle, NNotificationProvider, useOsTheme } from "naive-ui";
import { Ref, ref, onBeforeMount, computed, Suspense } from 'vue';
import { dbg, themeOverrides } from "@/util";
import { StatisticsData } from "@/transport";
import { StatisticsDetail, StatisticsHeader, useEventEmitter, useLazyBackendTransport } from "@silveredgold/beta-shared-components";
import { webExtensionNavigation } from "@/components/util";

const events = useEventEmitter();
const osTheme = useOsTheme()
const theme = computed(() => (osTheme.value === 'dark' ? darkTheme : null))
const backend = useLazyBackendTransport();

const statistics: Ref<StatisticsData> = ref({} as StatisticsData);

onBeforeMount(async () => {
  await getCurrentStatistics();
});

const getCurrentStatistics = async () => {
    const client = await backend();
    const results = await client.getStatistics();
    if (results) {
      dbg('got statistics from backend', client, results);
      statistics.value = results;
    }
}


// browser.runtime.onMessage.addListener((request, sender) => {
//   if (request['msg'] === 'reloadStatistics' && request['statistics']) {
//     statistics.value = request.statistics as StatisticsData
//   }
// });

events?.on('reload', evt => {
  console.log('got emitter event', evt);
  if (evt == 'statistics') {
    getCurrentStatistics();
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

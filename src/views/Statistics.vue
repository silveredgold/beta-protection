<template>
  <n-config-provider :theme-overrides="themeOverrides" :theme="theme">
    <n-notification-provider>
      <Suspense>
          <template #fallback>
            Loading...
          </template>
            <statistics-header v-if="statistics" :statistics="statistics" />
      </Suspense>
      <Suspense>
          <template #fallback>
            Loading...
          </template>
            <statistics-detail v-if="statistics" :statistics="statistics" />
      </Suspense>
    </n-notification-provider>
    <n-global-style />
  </n-config-provider>
</template>

<script setup lang="ts">
import { darkTheme, NConfigProvider, NGlobalStyle, NNotificationProvider, GlobalThemeOverrides, useOsTheme } from "naive-ui";
import { InjectionKey, onMounted, provide, reactive, Ref, ref, onBeforeMount, computed, watch, Suspense } from 'vue';
import { themeOverrides } from "../util";
import browser from 'webextension-polyfill';
import mitt from 'mitt';
import { eventEmitter, ActionEvents } from "@/messaging";
import { StatisticsData, StatisticsService } from "@/services/statistics-service";
import StatisticsHeader from "@/components/StatisticsHeader.vue";
import StatisticsDetail from "@/components/StatisticsDetail.vue";

const events = mitt<ActionEvents>();
const osTheme = useOsTheme()
const theme = computed(() => (osTheme.value === 'dark' ? darkTheme : null))

const statistics: Ref<StatisticsData> = ref({} as StatisticsData);

onBeforeMount(async () => {
  await getCurrentStatistics();
});

const getCurrentStatistics = async () => {
    const svc = new StatisticsService();
    // console.log('firing statistics service');
    const result = await svc.getStatistics();
    // console.log('got statistics response', result);
    statistics.value = result as StatisticsData;

}


// browser.runtime.onMessage.addListener((request, sender) => {
//   if (request['msg'] === 'reloadStatistics' && request['statistics']) {
//     statistics.value = request.statistics as StatisticsData
//   }
// });

events.on('reload', evt => {
  console.log('got emitter event', evt);
  if (evt == 'statistics') {
    getCurrentStatistics();
  }
});

// provide()
provide(eventEmitter, events);


</script>

<style>
html {
  max-width: 80%;
  padding: 1.5rem;
  margin-left:auto;
  margin-right:auto;
}
</style>

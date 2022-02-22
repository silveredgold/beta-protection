<template>
<n-page-header
    subtitle="Check the statistics from the censoring backend."
    style="padding-bottom: 2rem;"
    >
    <template #header>Beta Protection</template>
    <template #title>Censoring Statistics</template>
    <template #avatar>
        <n-avatar :src="iconSrc" />
    </template>
    <template #extra>
        <n-space>
            <n-popover trigger="hover" placement="bottom">
                <template #trigger>
                    <n-button @click="openSettings">
                        <n-icon size="30" :component="Settings" />
                    </n-button>
                </template>
                Open Options
            </n-popover>
            <n-popover trigger="hover" placement="bottom">
                <template #trigger>
                    <n-button @click="refresh">
                        <n-icon size="30" :component="Refresh" />
                    </n-button>
                </template>
                Refresh
            </n-popover>
        </n-space>
    </template>
    <n-grid :cols="3" v-if="statistics">
        <n-gi>
        <n-statistic label="Safe Images" :value="safeCount" />
        </n-gi>
        <n-gi>
        <n-statistic label="Softcore" :value="softcoreCount" />
        </n-gi>
        <n-gi>
        <n-statistic label="Hardcore" :value="hardcoreCount" />
        </n-gi>
    </n-grid>
</n-page-header>
</template>
<script setup lang="ts">
import { NPageHeader, NGrid, NGi, NAvatar, NStatistic, NButton, NSpace, NIcon, useNotification, NPopover } from "naive-ui";
import { Settings, Refresh, AddCircle } from "@vicons/ionicons5";
import { computed, inject, Ref, toRefs } from "vue";
import browser from 'webextension-polyfill';
import { eventEmitter, ActionEvents } from "@/messaging";
import { AssetSource, openSettings } from "@/components/util";
import {StatisticsData} from "@/services/statistics-service";

const props = defineProps<{
    statistics: StatisticsData,
    assetSource: AssetSource
}>();

const emitter = inject(eventEmitter);
const notif = useNotification();
const { statistics, assetSource } = toRefs(props);

const enabled = computed(() => statistics.value && Object.keys(statistics.value).length > 0);
const safeCount = computed(() => Object.values(statistics.value).reduce((a, b) => a = a + b.safe, 0));
const softcoreCount = computed(() => Object.values(statistics.value).reduce((a, b) => a = a + b.softcore, 0));
const hardcoreCount = computed(() => Object.values(statistics.value).reduce((a, b) => a = a + b.hardcore, 0));

const iconSrc = assetSource.value('/images/icon.png');

const refresh = () => {
    emitter?.emit('reload', 'statistics');
}
</script>
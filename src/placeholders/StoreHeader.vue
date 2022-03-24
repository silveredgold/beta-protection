<template>
<n-page-header
    subtitle="Add and remove placeholders from the store using the controls below."
    style="padding-bottom: 2rem;"
    >
    <template #header>Beta Protection</template>
    <template #title>Placeholder Store</template>
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
            <n-popover trigger="hover" placement="bottom">
                <template #trigger>
                    <n-popover trigger="click">
                        <template #trigger>
                            <n-button>
                                <n-icon size="30" :component="AddCircle" />
                            </n-button>
                        </template>
                        <placeholder-upload :preferences="preferences" />
                    </n-popover>
                </template>
                Add New...
            </n-popover>
        </n-space>
    </template>
    <n-grid :cols="3" v-if="placeholders">
        <n-gi>
        <n-statistic label="Categories" :value="categoryCount" />
        </n-gi>
        <n-gi>
        <n-statistic label="Placeholders" :value="placeholderCount" />
        </n-gi>
        <n-gi>
        <n-statistic label="Currently Enabled" :value="enabledImageCount" />
        </n-gi>
    </n-grid>
</n-page-header>
</template>
<script setup lang="ts">
import { NPageHeader, NGrid, NGi, NAvatar, NStatistic, NButton, NSpace, NIcon, useNotification, NPopover } from "naive-ui";
import { Settings, Refresh, AddCircle } from "@vicons/ionicons5";
import { computed, inject, Ref, toRefs } from "vue";
import { IExtensionPreferences } from "@/preferences";
import { PlaceholderSet } from ".";
import browser from 'webextension-polyfill';
import { getEnabledFromSet } from "./util";
import { eventEmitter, ActionEvents } from "@/messaging";
import PlaceholderUpload from "@/components/placeholders/PlaceholderUpload.vue"

const props = defineProps<{
    preferences: IExtensionPreferences,
    placeholders: PlaceholderSet
}>();

const emitter = inject(eventEmitter);
const notif = useNotification();
const { preferences, placeholders } = toRefs(props);
const prefs = preferences;

const enabled = computed(() => prefs?.value?.enabledPlaceholders ?? []);
const categoryCount = computed(() => placeholders.value.categories.length);
const placeholderCount = computed(() => placeholders.value.allImages.length);
const enabledImageCount = computed(() => getEnabledFromSet(placeholders.value, prefs.value).length);

const iconSrc = browser.runtime.getURL('/images/icon.png');


const openSettings = () => {
    window.open(browser.runtime.getURL('options.html'));
}

const refresh = () => {
    emitter?.emit('reload', 'placeholders');
}
</script>
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
                        <LocalCensorWizard v-if="!!prefs" :preferences="prefs" />
                    </Suspense>
                </n-tab-pane>
            </n-tabs>
        </n-notification-provider>
        <n-global-style />
    </n-config-provider>
</template>

<script setup lang="ts">
import { darkTheme, NConfigProvider, NGlobalStyle, NNotificationProvider, GlobalThemeOverrides, useOsTheme, NTabs, NTabPane } from "naive-ui";
import { onBeforeMount, computed, Suspense } from 'vue';
import { dbg, themeOverrides } from "@/util";
import browser from 'webextension-polyfill';
import { useEventEmitter } from "@silveredgold/beta-shared-components";
import LocalCensorWizard from "@/components/LocalCensorWizard.vue";
import { usePreferencesStore } from "@/stores";

const osTheme = useOsTheme()
const theme = computed(() => (osTheme.value === 'dark' ? darkTheme : null));
const events = useEventEmitter();

const store = usePreferencesStore();
const prefs = computed(() => store.currentPreferences);

onBeforeMount(async () => {
    await store.load();
});

</script>

<style>
html {
    max-width: 80%;
    padding: 1.5rem;
    margin-left: auto;
    margin-right: auto;
}
</style>

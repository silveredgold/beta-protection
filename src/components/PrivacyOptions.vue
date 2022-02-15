<template>
    <n-card :title='enableTitle ? "Domain Tracking Preferences" : ""' size="small">
        <template #title>Domain Tracking Preferences</template>
        <n-thing>
            <template #avatar >
                <n-icon :component="AlertCircleOutline" />
            </template>
            <template #header>About Domain Logging</template>
            <!-- <template #description>The Beta Safety backend keeps a log of censoring requests by domain.</template> -->
            The Beta Safety backend retains a log of the <em>domain</em> (like <code>reddit.com</code> or <code>tumblr.com</code>) you're browsing when it censors images. This log is retained in the backend, and seems to be mostly used so that Beta Safety can display statistics of censoring results by domain. Since users have no control or visibility over how the backend handles this information, Beta Protection defaults to sending fake domains with its requests.
        </n-thing>
        <template #footer>
            <!-- <p>{{mode}}</p> -->
            If you want Beta Protection to send the real domain to the backend instead, disable the option below.
        </template>
        <template #action>
            <n-space item-style="display: flex;" justify="end" v-if="loaded">
                <n-checkbox size="large" v-model:checked="prefs.hideDomains">Enable hiding domains</n-checkbox>
            </n-space>
        </template>
    </n-card>
</template>
<script setup lang="ts">
import { Ref, watch, computed, toRefs, inject } from 'vue';
import { NCard, NIcon, NCheckbox, NSpace, NThing, useNotification } from "naive-ui";
import { AlertCircleOutline } from "@vicons/ionicons5";
import { IPreferences } from '../preferences';
import { updateUserPrefs } from '../options/services';

const props = defineProps<{
    preferences: IPreferences
}>();

const enableTitle = false;

const notif = useNotification();
const { preferences } = toRefs(props);
const prefs = preferences;
const updatePrefs = inject(updateUserPrefs);

const loaded = computed(() => !!preferences.value);

watch(prefs, async (newMode, prevMode) => {
    updatePrefs?.();
}, {deep: true});




</script>
<style>
</style>
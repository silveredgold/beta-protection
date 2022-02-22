<template>
    <n-card
        size="small"
        title="Manage your placeholders"
        :segmented="{
            content: 'soft',
            footer: 'soft'
        }"
    >
        Beta Protection has its own store of placeholders it uses, so you can easily add or remove placeholders at any time. To view the placeholders you have currently loaded, or remove any you don't want anymore, open the Placeholder Store with the button below.
        <template #footer>
            <em>Placeholders are always kept locally, and are stored directly inside your browser.</em>
        </template>
        <template #action>
            <n-button @click="openStore">
                <template #icon>
                    <n-icon :component="Open" />
                </template>
                Open Placeholder Store
            </n-button>
        </template>
    </n-card>
</template>
<script setup lang="ts">
import { NCard, NButton, NIcon } from "naive-ui";
import { Open } from "@vicons/ionicons5";
import browser from 'webextension-polyfill';

const openStore = () => {
    browser.tabs.create({url: browser.runtime.getURL('store.html')});
}
</script>
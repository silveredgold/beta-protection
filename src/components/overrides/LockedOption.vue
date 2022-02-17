<template>
    <n-card
        size="small"
        :title="title"
        :segmented="{
            content: 'soft',
            footer: 'soft'
        }"
    >
        These options are locked by your currently loaded override. If you want to change these settings, you will need to disable your current override first!
        <template #footer>
            <em>You will need the key for your current override to disable it.</em>
        </template>
        <template #action>
            <n-button @click="openOverride">
                <template #icon>
                    <n-icon :component="Open" />
                </template>
                Open Override
            </n-button>
        </template>
    </n-card>
</template>
<script setup lang="ts">
import { NCard, NButton, NIcon } from "naive-ui";
import { Open } from "@vicons/ionicons5";
import browser from 'webextension-polyfill';
import { toRefs } from "vue";

interface Props {
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Options Locked',
})

const {title} = toRefs(props)

const openOverride = () => {
    browser.tabs.create({url: browser.runtime.getURL('override.html')});
}
</script>
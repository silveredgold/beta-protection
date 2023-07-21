<template>
    <n-card title="Hardcore Options" size="small">
        <template #header-extra>
            <n-popover trigger="hover" placement="bottom">
                <template #trigger>
                    <n-icon style="margin-top: auto; margin-bottom: auto;" :component="Warning" :size="30" />
                </template>
                These options are <strong><em>one-way</em></strong> and can <strong><em>dramatically affect</em></strong> your Beta Protection experience.
            </n-popover>
        </template>
        <div>
            <n-space item-style="display: flex;" justify="space-between" align="center" :wrap="false">
                <n-thing>
                    <template #header>Force overwriting local images</template>
                    <template #description><n-text>When censoring local images, you usually pick between overwriting or saving the censored images alongside the originals. With this enabled, you can <em>only</em> overwrite the originals.</n-text></template>
                </n-thing>
                <n-button @click="() => confirmOverwriteMode()" :disabled="!options.allowUnsafeLocal">{{ options.allowUnsafeLocal ? 'Enable' : 'Activated' }}</n-button>
            </n-space>
        </div>
        <div>
            <n-space item-style="display: flex;" justify="space-between" align="center" :wrap="false">
                <n-thing>
                    <template #header>Overrides apply to local censoring</template>
                    <template #description><n-text>If you enable this option, any overrides you have active will <em>also apply to local censoring</em>. You won't be able to edit or customize censoring types for local images when you have an override active.</n-text></template>
                </n-thing>
                <n-button @click="() => confirmHardcoreOption(options.enableOverridesOnLocal)" :disabled="!options.allowCustomLocalPreferences">{{ options.allowCustomLocalPreferences ? 'Enable' : 'Activated' }}</n-button>
            </n-space>
        </div>
        <template #action>
            <n-space item-style="display: flex;" justify="end">
                <n-text type="warning">These options are <strong><em>one-way</em></strong> and can <strong><em>dramatically affect</em></strong> your Beta Protection experience.</n-text>
            </n-space>
        </template>
    </n-card>
</template>
<script setup lang="ts">
import { onBeforeMount } from 'vue';
import { NCard, NButton, NSpace, NThing, NIcon, NText, useDialog, useMessage, NPopover } from "naive-ui";
import { Warning } from "@vicons/ionicons5";
import { useUserOptionsStore } from '@/stores';


const message = useMessage();
const dialog = useDialog();
const options = useUserOptionsStore();

const confirmHardcoreOption = (action: () => Promise<any>, modeText?: string) => {
  modeText = modeText || 'this hardcore option';
    dialog.warning({
          title: 'Enable',
          content: 'Are you sure? This CANNOT BE UNDONE!',
          positiveText: 'Confirm and Activate',
          negativeText: 'Cancel',
          onPositiveClick: () => {
            action().then(() => {
              message.success('Hardcore option activated!');
            });
          },
          onNegativeClick: () => {

          }
        })
}

const confirmOverwriteMode = (modeText?: string) => {
    modeText = modeText || 'this hardcore option';
    dialog.warning({
          title: 'Enable',
          content: 'Are you sure? This CANNOT BE UNDONE!',
          positiveText: 'Confirm and Activate',
          negativeText: 'Cancel',
          onPositiveClick: () => {
            options.enableForcedOverwriting().then(() =>
            message.success('Hardcore option activated!'));
          },
          onNegativeClick: () => {

          }
        })
}

onBeforeMount(async () => {
  await options.load();
});

</script>

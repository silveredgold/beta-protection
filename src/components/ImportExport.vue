<template>
    <n-card title="Import and Export Preferences" size="small">
        <n-grid :x-gap="12" :cols="2">
            <n-grid-item>
                <n-thing title="Export Settings" v-if="loaded">
                    Export your preferences (does not include backend configuration).
                    <template #footer>
                          <n-text type="warning">This will include the effects of any active overrides!</n-text>&nbsp;
                    </template>
                    <template #action>
                        <n-space item-style="display: flex;" justify="end" >
                            <n-button @click="exportToBackend" icon-placement="right">
                                Export to Beta Safety
                                <template #icon>
                                    <n-popover trigger="hover" placement="bottom">
                                        <template #trigger>
                                            <n-icon :component="HelpCircleOutline" />
                                        </template>
                                        This will update Beta Safety's preferences to match your preferences here.
                                    </n-popover>
                                </template>
                            </n-button>
                            <n-button @click="exportPrefs">Export to File</n-button>
                        </n-space>
                    </template>
                </n-thing>
            </n-grid-item>
            <n-grid-item>
                <n-thing title="Import Settings" v-if="loaded">
                    Import your Beta Protection preferences from a previously exported file.
                    <template #footer>
                          <n-text type="warning">This will overwrite your current preferences!</n-text>&nbsp;
                    </template>
                    <template #action>
                        <n-space item-style="display: flex;" justify="end">
                            <n-popover trigger="hover" placement="bottom">
                                <template #trigger>
                                    <n-icon style="margin-top: auto; margin-bottom: auto;" :component="HelpCircleOutline" :size="30" />
                                </template>
                                <n-thing title="Looking for Beta Safety import?">
                                    Your Beta Safety preferences (if you had any) were already imported when you installed Beta Protection!
                                </n-thing>
                            </n-popover>
                            <n-button @click="importPrefs">Import</n-button>
                        </n-space>
                    </template>
                </n-thing>
            </n-grid-item>
        </n-grid>
    </n-card>
</template>
<script setup lang="ts">
import { watch, computed, toRefs, inject } from 'vue';
import { NCard, useNotification, NThing, NGrid, NGridItem, NSpace, NButton, NText, NIcon, NPopover } from "naive-ui";
import { HelpCircleOutline } from "@vicons/ionicons5";
import { IPreferences, mergeNewPreferences, updateBackendPreferences } from '@/preferences';
import { updateUserPrefs } from '@/options/services';
import { FileSystemClient } from '@/services/fs-client';
import { eventEmitter } from '@/messaging';
import { dbg } from '@/util';
interface Props {
    preferences: IPreferences,
    compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    compact: false
});

const notif = useNotification();
const { preferences } = toRefs(props);
const updatePrefs = inject(updateUserPrefs);
const emitter = inject(eventEmitter);

const loaded = computed(() => preferences.value !== undefined);

watch(preferences!, async (newMode, prevMode) => {
    updatePrefs?.();
}, { deep: true });

const importPrefs = async () => {
    const fs = new FileSystemClient();
    const result = await fs.getFile(fs.jsonFiles);
    const content = await result.file.text();
    const newPrefs = JSON.parse(content) as IPreferences;
    dbg('imported new preferences', newPrefs);
    if (newPrefs && newPrefs.exposed) {
        await mergeNewPreferences(newPrefs);
        emitter?.emit('reload', 'preferences');
        notif?.create({
            type: 'success',
            content: 'Merged preferences saved'
        });
    } else {
        emitter?.emit('reload', 'preferences');
        notif?.create({
            type: 'warning',
            content: 'Failed to import preferences!'
        });
    }
}

const exportPrefs = async () => {
    const fs = new FileSystemClient();
    const text = JSON.stringify(preferences.value);
    await fs.saveTextFile(text, fs.jsonFiles);
    notif?.create({
        title: 'Settings Exported!',
        content: 'Exported Beta Protection preferences to file.',
        type: 'success'
    });
}

const exportToBackend = async () => {
    const result = await updateBackendPreferences(preferences.value);
    dbg('notified backend to update preferences', result);
    if (result) {
        notif?.create({
            type: 'success',
            content: 'Backend preferences updated'
        });
    } else {
        notif?.create({
            type: 'warning',
            content: 'Failed to update backend preferences!'
        });
    }
}


</script>
<style>
</style>
<template>
<n-card title="Reset to Default" size="small">
        <!-- <template #header-extra>Backend Host</template> -->
        <div>
            This will reset <strong>all</strong> your settings to the defaults! Use with caution!
        </div>
        <template #action>
            <n-space item-style="display: flex;" justify="end">
                <n-button strong ghost type="warning" @click="resetToBackend()">Reset to Backend</n-button>
                <n-button strong type="error" @click="resetToDefault()">Reset to Default</n-button>
            </n-space>
        </template>
    </n-card>
</template>
<script setup lang="ts">
import { inject } from 'vue';
import { NCard, NButton, NSpace } from "naive-ui";
import { defaultExtensionPrefs } from '@/preferences';
import { updateUserPrefs, useLazyBackendTransport } from '@silveredgold/beta-shared-components';
import { usePreferencesStore } from '@/stores';

const store = usePreferencesStore();

const updatePrefs = inject(updateUserPrefs);
const backend = useLazyBackendTransport();

const resetToDefault = async () => {
  updatePrefs?.(defaultExtensionPrefs).then(() => {
    //   browser.runtime.sendMessage({msg: 'reloadPreferences'}); //the background script does this for us now
  });
}

const resetToBackend = async () => {
    const client = await backend();
    var prefs = await client.getRemotePreferences();
    if (prefs !== undefined) {
        await store.ready;
        await store.merge(prefs, false);
    } else {
        resetToDefault();
    }
}

</script>

<template>
<n-card title="Reset to Default" size="small">
        <!-- <template #header-extra>Backend Host</template> -->
        <div>
            This will reset <strong>all</strong> your settings to the defaults! Use with caution!
        </div>
        <template #action>
            <n-button strong secondary type="warning" @click="resetToDefault()">Reset to Default</n-button>
        </template>
    </n-card>
</template>
<script setup lang="ts">
import { inject } from 'vue';
import { NCard, NButton } from "naive-ui";
import { defaultPrefs } from '@/preferences';
import { updateUserPrefs } from '@silveredgold/beta-shared-components';
import browser from 'webextension-polyfill';

const updatePrefs = inject(updateUserPrefs);


const resetToDefault = async () => {
  updatePrefs?.(defaultPrefs).then(() => {
      browser.runtime.sendMessage({msg: 'reloadPreferences'});
  });

}

</script>
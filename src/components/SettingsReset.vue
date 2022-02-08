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
import { ComponentOptions, defineComponent, onMounted, reactive, Ref, ref, watch, computed, toRefs, inject } from 'vue';
import { NCard, useNotification, NButton } from "naive-ui";
import { loadPreferencesFromStorage, IPreferences, OperationMode, defaultPrefs } from '../preferences';
import { updateUserPrefs } from '../options/services';

// const props = defineProps<{
//     preferences: Ref<IPreferences>
// }>();

const notif = useNotification();
// let { preferences } = toRefs(props);
// const prefs = preferences;
const updatePrefs = inject(updateUserPrefs);

// watch(prefs, async (newMode, prevMode) => {
//     updatePrefs();
// }, {deep: true});


const resetToDefault = async () => {
  updatePrefs!(defaultPrefs).then(() => {
      chrome.runtime.sendMessage({msg: 'reloadPreferences'});
  });

}



</script>
<style>
</style>
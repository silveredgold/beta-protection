<template>
    <n-card title="Censoring Mode" size="small">
        <!-- <template #header-extra>Backend Host</template> -->
        <div>
            
            <n-radio-group v-model:value="mode" name="left-size" size="small" style="margin-bottom: 12px;">
    <n-radio-button value="enabled">Enabled</n-radio-button>
    <n-radio-button value="onDemand">On Demand</n-radio-button>
    <n-radio-button value="disabled">Disabled</n-radio-button>
  </n-radio-group>
        </div>
        <template #footer>
            <!-- <p>{{mode}}</p> -->
            Enabled wil censor all images, On Demand will censor only images from the Forced list or on demand, Disabled will disable Beta Protection temporarily.
        </template>
    </n-card>
</template>
<script setup lang="ts">
import { ComponentOptions, defineComponent, onMounted, reactive, Ref, ref, watch } from 'vue';
import { NCard, NRadioGroup, NRadioButton, useNotification } from "naive-ui";
import { loadPreferencesFromStorage, IPreferences, OperationMode, savePreferencesToStorage } from '../preferences';
import browser from 'webextension-polyfill';

const notif = useNotification();
const mode: Ref<OperationMode> = ref("" as OperationMode);
let prefs = reactive(null as IPreferences);
const getCurrentMode = async () => {
    var storeResponse = await loadPreferencesFromStorage();
    prefs = storeResponse;
    mode.value = storeResponse.mode;
}

const updateMode = async () => {
    console.log(`saving new mode ${mode.value}`);
    prefs.mode = mode.value;
    const modeText = (mode.value as OperationMode) == OperationMode.Disabled
        ? '❌'
        : (mode.value as OperationMode) == OperationMode.Enabled
            ? '✅'
            : '💡';
    try {
        browser.action.setBadgeText({ text: modeText });
        browser.action.setBadgeBackgroundColor({color: 'silver'});
    } catch {}
    await savePreferencesToStorage(prefs);
}

onMounted(getCurrentMode);

watch(mode, async (newMode, prevMode) => {
    // console.log(`values: ${prevMode}->${newMode}`);
    if (prevMode && (prevMode as string) !== "") {
    await updateMode();
    const n = notif.create({
          content: 'Saved!',
          duration: 2500,
          closable: true
        });
    }
});

// return {
//     host,
//     getCurrentHost,
//     saveHost
// }

</script>
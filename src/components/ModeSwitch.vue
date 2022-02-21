<template>
    <n-card title="Censoring Mode" size="small">
        <!-- <template #header-extra>Backend Host</template> -->
        <div>
            <n-radio-group v-model:value="mode" name="left-size" size="small" style="margin-bottom: 12px;">
                <n-radio-button :disabled="allowedModes.length > 0 && !allowedModes.includes(OperationMode.Enabled)" value="enabled">Enabled</n-radio-button>
                <n-radio-button :disabled="allowedModes.length > 0 && !allowedModes.includes(OperationMode.OnDemand)" value="onDemand">On Demand</n-radio-button>
                <n-radio-button :disabled="allowedModes.length > 0 && !allowedModes.includes(OperationMode.Disabled)" value="disabled">Disabled</n-radio-button>
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
import { setModeBadge } from "@/util"
import { OverrideService } from '@/services/override-service';

const notif = useNotification();
const mode: Ref<OperationMode> = ref("" as OperationMode);
let prefs = reactive({} as IPreferences);
const getCurrentMode = async () => {
    const storeResponse = await loadPreferencesFromStorage();
    const svc = await OverrideService.create();
    if (svc && svc.active) {
        console.debug('settings allowed modes', svc.current?.allowedModes);
        allowedModes.value = svc.current!.allowedModes;
    }
    prefs = storeResponse;
    mode.value = storeResponse.mode;
}

const allowedModes: Ref<OperationMode[]> = ref([]);

const updateMode = async () => {
    console.log(`saving new mode ${mode.value}`);
    prefs.mode = mode.value;
    setModeBadge(mode.value);
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
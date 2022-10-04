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
import { onMounted, reactive, Ref, ref, watch } from 'vue';
import { NCard, NRadioGroup, NRadioButton, useNotification } from "naive-ui";
import { IPreferences, OperationMode, IExtensionPreferences } from '@/preferences';
import { dbg, setModeBadge } from "@/util"
import { usePreferencesStore } from '@/stores';

const notif = useNotification();
const mode: Ref<OperationMode> = ref("" as OperationMode);
const store = usePreferencesStore();


const getCurrentMode = async () => {
    await store.load();
    mode.value = store.mode;
    allowedModes.value = store.allowedModes;
}

const allowedModes: Ref<OperationMode[]> = ref([]);

const updateMode = async () => {
    dbg(`saving new mode ${mode.value}`);
    await store.setMode(mode.value);
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

</script>
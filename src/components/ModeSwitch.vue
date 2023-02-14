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
import { computed, onMounted, reactive, Ref, ref, watch } from 'vue';
import { NCard, NRadioGroup, NRadioButton, useNotification } from "naive-ui";
import { IPreferences, OperationMode, IExtensionPreferences } from '@/preferences';
import { dbg, dbgLog, setModeBadge } from "@/util"
import { usePreferencesStore } from '@/stores';
import { MutationType } from 'pinia';

const notif = useNotification();
const mode: Ref<OperationMode> = ref("" as OperationMode);
const store = usePreferencesStore();

store.$subscribe((mutation, state) => {
  mode.value = store.mode;
});


const getCurrentMode = async () => {
  await store.ready;
    // await store.load();
    mode.value = store.mode;
}

// const mode: Ref<OperationMode> = computed(() => store.mode);
const allowedModes: Ref<OperationMode[]> = computed(() => store.allowedModes);

const updateMode = async () => {
    dbg(`saving new mode ${mode.value}`);
    await store.setMode(mode.value);
}

onMounted(getCurrentMode);

watch(mode, async (newMode, prevMode) => {
    dbgLog(`values: ${prevMode}->${newMode}`);
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

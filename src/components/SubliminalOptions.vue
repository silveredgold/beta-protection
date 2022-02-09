<template>
    <n-card size="small">
        <n-thing>
            <template #header>Subliminal Messages</template>
            <template
                #description
            >Enable displaying "subliminal" messages while censoring is enabled.</template>
            This will enable a "subliminal message" overlay that will flash messages across the page very briefly at semi-regular intervals.
            These messages will noticeably flash and may cause irritation for some users, as well as being (deliberately) intrusive.
        </n-thing>
        <template #footer>
            <n-space item-style="display: flex;" justify="space-around" align="center" >
                <n-input-group>
                    <n-input-group-label>Delay</n-input-group-label>
                    <n-input-number
                        v-model:value="prefs.subliminal.delay"
                        :style="{ width: '75%' }"
                        :step="100"
                    />
                    <n-input-group-label>ms</n-input-group-label>
                </n-input-group>
                <n-input-group>
                    <n-input-group-label>Duration</n-input-group-label>
                    <n-input-number
                        v-model:value="prefs.subliminal.duration"
                        :style="{ width: '75%' }"
                        :step="100"
                    />
                    <n-input-group-label>ms</n-input-group-label>
                </n-input-group>
            </n-space>
        </template>
        <template #action>
            <n-space item-style="display: flex;" vertical align="end" v-if="loaded">
                <div>Only enable if you're ready for it!</div>
                <n-checkbox v-model:checked="prefs.subliminal.enabled">Enable Subliminal Messaging</n-checkbox>
            </n-space>
        </template>
    </n-card>
</template>
<script setup lang="ts">
import { ComponentOptions, defineComponent, onMounted, reactive, Ref, ref, watch, computed, toRefs, inject } from 'vue';
import { NCard, NThing, NSpace, NCheckbox, useNotification, NInputGroup, NInputGroupLabel, NInputNumber } from "naive-ui";
import { loadPreferencesFromStorage, IPreferences, OperationMode } from '../preferences';
import { updateUserPrefs } from '../options/services';
interface Props {
    preferences: IPreferences,
    compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    compact: false,
    preferences: {}
});

const notif = useNotification();
const { preferences } = toRefs(props);
const prefs = preferences;
const updatePrefs = inject(updateUserPrefs);

const loaded = computed(() => preferences.value !== {});

watch(prefs, async (newMode, prevMode) => {
    updatePrefs();
}, { deep: true });




</script>
<style>
</style>
<template>
    <n-card title="Domain Options" size="small">
        <!-- <template #header-extra></template> -->
        <n-tabs type="segment">
            <n-tab-pane name="allow-list" tab="Allowed">
                <div v-if="prefs">
                    <n-list bordered>
                        <template #header>
                            These sites will
                            <strong>not</strong> be censored, regardless of mod!
                        </template>
                        <n-list-item v-for="match in allowed" v-bind:key="match">
                            {{ match }}
                            <template #suffix>
                                <n-button @click="allowed.splice(allowed.indexOf(match))">Remove</n-button>
                            </template>
                        </n-list-item>
                        <template #footer>
                            <n-input-group>
                                <n-input-group-label>Match</n-input-group-label>
                                <n-input :style="{ maxWidth: '50%' }" v-model:value="newMatch" />
                                <n-button type="primary" @click="addAllow">Add New</n-button>
                            </n-input-group>
                        </template>
                    </n-list>
                </div>
            </n-tab-pane>
            <n-tab-pane name="force-list" tab="Forced">
                <div v-if="prefs">
                    <n-list bordered>
                        <template
                            #header
                        >These sites will be automatically censored, even in On Demand mode.</template>
                        <n-list-item v-for="match in forced" v-bind:key="match">
                            {{ match }}
                            <template #suffix>
                                <n-button @click="forced.splice(forced.indexOf(match))">Remove</n-button>
                            </template>
                        </n-list-item>
                        <template #footer>
                            <n-input-group>
                                <n-input-group-label>Match</n-input-group-label>
                                <n-input :style="{ maxWidth: '50%' }" v-model:value="newMatch" />
                                <n-button type="primary" @click="addForced">Add New</n-button>
                            </n-input-group>
                        </template>
                    </n-list>
                </div>
            </n-tab-pane>
        </n-tabs>
        <template
            #footer
        >The Allowed list overrides the Forced list in On Demand mode. Your changes are automatically saved.</template>
    </n-card>
</template>
<script setup lang="ts">
import { ComponentOptions, computed, ComputedRef, defineComponent, inject, onMounted, Ref, ref, toRefs, watch } from 'vue';
import { NCard, NList, NListItem, useNotification, NTabs, NTab, NTabPane, NSpace, NInput, NInputGroupLabel, NInputGroup, NButton } from "naive-ui";
import { loadPreferencesFromStorage, IPreferences, OperationMode, CensorType, BodyCensorModes } from '../preferences';
import { updateUserPrefs, userPrefs } from "../options/services";
import { toTitleCase } from "../util";

const props = defineProps<{
    preferences: Ref<IPreferences>
}>()

const notif = useNotification();

let { preferences } = toRefs(props);
const prefs = preferences;
const updatePrefs = inject(updateUserPrefs);

const newMatch = ref("");
const addForced = () => {
    forced.value.push(newMatch.value);
    newMatch.value = '';
}
const addAllow = () => {
    allowed.value.push(newMatch.value);
    newMatch.value = '';
}

watch(prefs, async (newMode, prevMode) => {
    updatePrefs!();
}, { deep: true });

const allowed = computed(() => prefs.value.allowList);
const forced = computed(() => prefs?.value.forceList);

</script>
<style>
.censor-input-group {
    /* justify-content: flex-end; */
    justify-content: space-evenly;
}

.censor-input {
    margin: 0em 1em;
}
</style>
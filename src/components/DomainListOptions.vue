<template>
    <n-card title="Domain Options" size="small">
        <!-- <template #header-extra></template> -->
        <n-tabs type="segment">
            <n-tab-pane name="allow-list" tab="Allowed">
                <div>
                    <n-list bordered>
                        <template #header>
                            These sites will <strong>not</strong> be censored, regardless of mode!<br />
                            A site only needs to <em>partially</em> match any of the values below to be allowed.
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
                <div>
                    <n-list bordered>
                        <template #header >
                            These sites will be automatically censored, even in On Demand mode.<br />
                            A site only needs to <em>partially</em> match any of the values below to be censored.
                        </template>
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
import { computed, inject, ref, toRefs, watch } from 'vue';
import { NCard, NList, NListItem, NTabs, NTab, NTabPane, NSpace, NInput, NInputGroupLabel, NInputGroup, NButton } from "naive-ui";
import { updateUserPrefs, userPrefs } from "@silveredgold/beta-shared-components";

const props = defineProps<{
    allowList: string[],
    forceList: string[]
}>();

// const { preferences } = toRefs(props);
// const prefs = preferences;
const updatePrefs = inject(updateUserPrefs);
const { allowList, forceList} = toRefs(props)

const newMatch = ref("");
const addForced = () => {
    forced.value.push(newMatch.value);
    newMatch.value = '';
}
const addAllow = () => {
    allowed.value.push(newMatch.value);
    newMatch.value = '';
}

watch(allowList, async (newMode, prevMode) => {
    updatePrefs!();
}, { deep: true });

watch(forceList, async (newMode, prevMode) => {
    updatePrefs!();
}, { deep: true });

const allowed = computed(() => allowList?.value ?? []);
const forced = computed(() => forceList?.value ?? []);

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
<template>
    <n-card title="Censoring Options" size="small">
        <!-- <template #header-extra>Backend Host</template> -->
        <n-tabs type="segment">
            <n-tab-pane name="special" tab="Special">
                <div v-if="prefs && prefs.otherCensoring">
                    <n-form :model="prefs.otherCensoring" label-placement="left" :label-width="120">
                        <n-form-item label="Female Eyes" path="femaleEyes">
                            <n-input-group class="censor-input-group">
                                <n-select
                                        v-model:value="prefs.otherCensoring.femaleEyes"
                                        :options="rawCensorTypes"
                                        :style="{ width: '75%' }"
                                        class="censor-input"
                                    />
                            </n-input-group>
                        </n-form-item>
                        <n-form-item label="Female Face" path="femaleFace">
                            <n-input-group class="censor-input-group">
                                    <n-select
                                        v-model:value="prefs.otherCensoring.femaleFace.method"
                                        :options="rawCensorTypes"
                                        :style="{ width: '25%' }"
                                        class="censor-input"
                                    />
                                    <n-slider
                                        :min="1"
                                        :max="22"
                                        v-model:value="prefs.otherCensoring.femaleFace.level"
                                        :marks="sliderMarks"
                                        :step="1"
                                        :style="{ width: '50%' }"
                                        class="censor-input"
                                    />
                                </n-input-group>
                        </n-form-item>
                        <n-form-item label="Male Face" path="maleFace">
                            <n-input-group class="censor-input-group">
                                    <n-select
                                        v-model:value="prefs.otherCensoring.maleFace.method"
                                        :options="rawCensorTypes"
                                        class="censor-input"
                                        :style="{ width: '25%' }"
                                    />
                                    <n-slider
                                        :min="1"
                                        :max="22"
                                        v-model:value="prefs.otherCensoring.maleFace.level"
                                        :marks="sliderMarks"
                                        :step="1"
                                        :style="{ width: '50%' }"
                                        class="censor-input"
                                    />
                                </n-input-group>
                        </n-form-item>
                    </n-form>
                    
                </div>
            </n-tab-pane>
            <template v-for="mode in ['exposed', 'covered']" v-bind:key="mode">
            <n-tab-pane :name="mode" :tab="toTitleCase(mode)">
                <div v-if="prefs && prefs[mode]">
                    <n-form :model="prefs[mode]" label-placement="left" :label-width="120">
                        <template v-for="(value, name) in (prefs[mode] as BodyCensorModes)" v-bind:key="name">
                            <n-form-item
                                :label="name"
                                :path="name"
                                v-if="(prefs[mode][name] as any).length"
                            >
                                <n-input-group class="censor-input-group">
                                    <n-select
                                        v-model:value="prefs[mode][name][0]"
                                        :options="rawCensorTypes"
                                        :style="{ width: '25%' }"
                                        class="censor-input"
                                    />
                                    <n-slider
                                        :min="1"
                                        :max="22"
                                        v-model:value="prefs[mode][name][1]"
                                        :marks="sliderMarks"
                                        :step="1"
                                        :style="{ width: '50%' }"
                                        class="censor-input"
                                    />
                                </n-input-group>
                            </n-form-item>
                        </template>
                        <template v-for="(value, name) in (prefs[mode] as BodyCensorModes)" v-bind:key="name">
                            <n-form-item
                                :label="name"
                                :path="name"
                                v-if="(prefs[mode][name] as any).method"
                            >
                                <n-input-group class="censor-input-group">
                                    <n-select
                                        v-model:value="(prefs[mode][name] as { method: CensorType, level: number }).method"
                                        :options="rawCensorTypes"
                                        :style="{ width: '25%' }"
                                        class="censor-input"
                                    />
                                    <n-slider
                                        :min="1"
                                        :max="22"
                                        v-model:value="(prefs[mode][name] as { method: CensorType, level: number }).level"
                                        :marks="sliderMarks"
                                        :step="1"
                                        :style="{ width: '50%' }"
                                        class="censor-input"
                                    />
                                </n-input-group>
                            </n-form-item>
                        </template>
                    </n-form>
                </div>
            </n-tab-pane>
            </template>
        </n-tabs>
        <template #footer>
            You can individually adjust each body part using the sliders and dropdowns above.
        </template>
    </n-card>
</template>
<script setup lang="ts">
import { ComponentOptions, defineComponent, inject, onMounted, Ref, ref, toRefs, watch } from 'vue';
import { NCard, NRadioGroup, NRadioButton, useNotification, NTabs, NTab, NTabPane, NSpace, NForm, NFormItem, NInput, NSelect, NInputGroup, NSlider } from "naive-ui";
import { loadPreferencesFromStorage, IPreferences, OperationMode, CensorType, BodyCensorModes } from '../preferences';
import { updateUserPrefs, userPrefs } from "../options/services";
import { toTitleCase } from "../util";

const props = defineProps<{
    preferences: Ref<IPreferences>
}>()

const notif = useNotification();

const sliderMarks = {
    1: "Very Light",
    22: "Very Heavy"
}
let { preferences } = toRefs(props);
const prefs = preferences;
const updatePrefs = inject(updateUserPrefs);
console.log(`injected prefs: ${JSON.stringify(preferences.value)}`);
console.log(`injected updater: ${!!updatePrefs}`);

const rawCensorTypes = [{
    label: "Nothing", value: "nothing"
}, { label: "Pixels", value: "pix" }, { label: "Caption", value: "caption" }, { label: "Sticker", value: "sticker" }, { label: "Blur", value: "blur" }];

watch(prefs, async (newMode, prevMode) => {
    console.log(`prefs watch: ${prevMode}->${newMode}`);
    updatePrefs!();
}, {deep: true});

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
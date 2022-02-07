<template>
<n-card title="Video Censoring Preferences" size="small">
        <!-- <template #header-extra>Backend Host</template> -->
        <div>
            
            <n-radio-group v-model:value="prefs.videoCensorMode" name="left-size" size="small" style="margin-bottom: 12px;">
            <template v-for="opt in ['Block', 'Blur', 'Allow']" v-bind:key="opt">
                <n-radio-button :value="opt">{{opt}}</n-radio-button>
            </template>
            </n-radio-group>
        </div>
        <template #footer>
            <!-- <p>{{mode}}</p> -->
            Block will hide all videos from view, Blur will display videos but blur the video, Allow leaves videos untouched.
        </template>
    </n-card>
</template>
<script setup lang="ts">
import { ComponentOptions, defineComponent, onMounted, reactive, Ref, ref, watch, computed, toRefs, inject } from 'vue';
import { NCard, NRadioGroup, NRadioButton, useNotification } from "naive-ui";
import { loadPreferencesFromStorage, IPreferences, OperationMode } from '../preferences';
import { updateUserPrefs } from '../options/services';

const props = defineProps<{
    preferences: Ref<IPreferences>
}>();

const notif = useNotification();
let { preferences } = toRefs(props);
const prefs = preferences;
const updatePrefs = inject(updateUserPrefs);

watch(prefs, async (newMode, prevMode) => {
    updatePrefs();
}, {deep: true});




</script>
<style>
</style>
<template>
<n-card title="Error Display Preferences" size="small">
        <!-- <template #header-extra>Backend Host</template> -->
        <div>
            
            <n-radio-group v-model:value="prefs.errorMode" name="left-size" size="small" style="margin-bottom: 12px;">
            <template v-for="opt in ['Subtle', 'Normal']" v-bind:key="opt">
                <n-radio-button :value="opt.toLowerCase()">{{opt}}</n-radio-button>
            </template>
            </n-radio-group>
        </div>
        <template #footer>
            <!-- <p>{{mode}}</p> -->
            Subtle will show a subtler SFW placeholder when censoring fails, while Normal will show an NSFW image instead.
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
const { preferences } = toRefs(props);
const prefs = preferences;
const updatePrefs = inject(updateUserPrefs);

watch(prefs, async (newMode, prevMode) => {
    updatePrefs();
}, {deep: true});




</script>
<style>
</style>
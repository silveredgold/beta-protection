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
        <template #action>
                    <n-thing>
                        <template #header>Animate GIFs</template>
                        <!-- <template #description>Attempt to automatically animate GIFs.</template> -->
                        Attempt to automatically animate GIFs. This is very intensive, can take a very long time, and will not always work at all.
                        <template #foooter>Enable with caution!</template>
                        <template #action>
                            <n-space item-style="display: flex;" align="center">
                                <n-checkbox v-model:checked="prefs.autoAnimate">Enable animation by default</n-checkbox>
                            </n-space>
                        </template>
                    </n-thing>
        </template>
    </n-card>
</template>
<script setup lang="ts">
import { ComponentOptions, defineComponent, onMounted, reactive, Ref, ref, watch, computed, toRefs, inject } from 'vue';
import { NCard, NRadioGroup, NRadioButton, useNotification, NThing, NSpace, NCheckbox } from "naive-ui";
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
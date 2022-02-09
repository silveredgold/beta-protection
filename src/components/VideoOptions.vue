<template>
<n-card title="Video Censoring Preferences" size="small">
        <!-- <template #header-extra>Backend Host</template> -->
        <n-thing title="Censor Mode" v-if="loaded">
            <n-radio-group v-model:value="prefs.videoCensorMode" name="left-size" size="small" style="margin-bottom: 12px;">
            <template v-for="opt in ['Block', 'Blur', 'Allow']" v-bind:key="opt">
                <n-radio-button :value="opt">{{opt}}</n-radio-button>
            </template>
            </n-radio-group>
        </n-thing>
        <template #footer>
            <!-- <p>{{mode}}</p> -->
            Block will hide all videos from view, Blur will display videos but blur the video, Allow leaves videos untouched.
        </template>
        <n-thing title="Censor Level" description="Higher levels cause more blur" v-if="loaded && !compact">
            <n-slider
                :min="1"
                :max="10"
                v-model:value="prefs.videoCensorLevel"
                :step="1"
                :style="{ width: '50%' }"
                class="censor-input"
            />
        </n-thing>
        
        <template #action>
                    <n-thing v-if="loaded && !compact">
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
import { NCard, NRadioGroup, NRadioButton, useNotification, NThing, NSpace, NCheckbox, NSlider } from "naive-ui";
import { loadPreferencesFromStorage, IPreferences, OperationMode } from '../preferences';
import { updateUserPrefs } from '../options/services';
interface Props {
    preferences: IPreferences,
    compact: boolean
}

const props = withDefaults(defineProps<Props>(), {
    compact: false,
    preferences: {}
});

const notif = useNotification();
let { preferences } = toRefs(props);
const prefs = preferences;
const updatePrefs = inject(updateUserPrefs);

const loaded = computed(() => prefs.value !== {});

watch(prefs, async (newMode, prevMode) => {
    updatePrefs();
}, {deep: true});




</script>
<style>
</style>
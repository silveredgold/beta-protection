<template>
  <n-card title="Video Censoring Preferences" size="small">
      <n-thing title="Censor Mode" v-if="loaded">
          <n-radio-group v-model:value="mode" name="left-size" size="small" style="margin-bottom: 12px;">
          <template v-for="opt in ['Block', 'Blur', 'Allow']" v-bind:key="opt">
              <n-radio-button :value="opt">{{opt}}</n-radio-button>
          </template>
          </n-radio-group>
      </n-thing>
      <template v-slot:footer>
          Block will hide all videos from view, Blur will display videos but blur the video, Allow leaves videos untouched.
      </template>
      <n-thing title="Censor Level" description="Higher levels cause more blur" v-if="loaded && !compact && mode === 'Blur'">
          <n-slider
              :min="1"
              :max="10"
              v-model:value="level"
              :step="1"
              :style="{ width: '50%' }"
              class="censor-input"
          />
      </n-thing>
      <template v-slot:action>
      <template v-if="loaded && !compact && (autoAnimate !== undefined)">
                  <n-thing>
                      <template v-slot:header>Animate GIFs</template>
                      <!-- <template v-slot:description>Attempt to automatically animate GIFs.</template> -->
                      Attempt to automatically animate GIFs. This is very intensive, can take a very long time, and will not always work at all.
                      <template v-slot:foooter>Enable with caution!</template>
                      <template v-slot:action>
                          <n-space item-style="display: flex;" align="center">
                              <n-checkbox v-model:checked="autoAnimate">Enable animation by default</n-checkbox>
                          </n-space>
                      </template>
                  </n-thing>
      </template>
      </template>
  </n-card>
</template>
<script setup lang="ts">
import { watch, computed, toRefs, inject, ref, Ref, onBeforeMount } from 'vue';
import { NCard, NRadioGroup, NRadioButton, NThing, NSpace, NCheckbox, NSlider } from "naive-ui";
import { usePreferencesStore } from '@/stores';
import { dbg } from '@/util';
import { IPreferences } from '@/preferences';


const props = withDefaults(defineProps<{preferences: IPreferences;
    compact?: boolean;}>(), {
  compact: false
});

const mode: Ref<"Block" | "Blur" | "Allow"|undefined> = ref(undefined);
const level: Ref<number|undefined> = ref(undefined);
const autoAnimate: Ref<boolean|undefined> = ref(undefined);
const store = usePreferencesStore();

// store.$subscribe((mutation, state) => {
//   mode.value = store.currentPreferences.videoCensorMode;
// });


const getCurrentMode = async () => {
  await store.ready;
    // await store.load();
    mode.value = store.currentPreferences.videoCensorMode;
    level.value = store.currentPreferences.videoCensorLevel;
    autoAnimate.value = store.currentPreferences.autoAnimate;
}

const loaded = computed(() => mode.value !== undefined);

const prefs = computed(() => store.currentPreferences);

const patchStore = () => {
  dbg('running watch for VideoOptions changer');
  store.$patch({basePreferences: {videoCensorMode: mode.value, videoCensorLevel: level.value, autoAnimate: autoAnimate.value}});
};

watch(mode, patchStore);
watch(level, patchStore);
watch(autoAnimate, patchStore);

onBeforeMount(getCurrentMode);

</script>

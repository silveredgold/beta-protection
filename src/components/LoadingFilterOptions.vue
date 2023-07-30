<template>
  <n-card title="Loading Filter Preferences" size="small">
    <n-card title="About the loading filter" size="small">
      <template #header-extra>
        <n-icon :component="AlertCircleOutline" />
      </template>
      The "loading filter" is how we refer to a series of techniques used in Beta Protection to hide images while the page
      loads <em><strong>before</strong></em> they're replaced with placeholders. This blurs images so you won't see
      uncensored images before the placeholders load, though this will affect every image on the page regardless of
      content!
      <template #footer>
        If you find the loading filter distracting and are okay with seeing uncensored images while the page loads,
        disable the option below.
      </template>
    </n-card>
    <template #action>
      <n-grid x-gap="12" :cols="6" style="padding: 0.25rem;">
        <n-grid-item span="2">
          <n-thing title="Status" v-if="loaded">
            <n-checkbox size="large" v-model:checked="filterEnabled">Enable loading filter</n-checkbox>
          </n-thing>
        </n-grid-item>
        <n-grid-item span="4">
          <n-thing title="Blur Level" v-if="loaded && filterEnabled">
            <n-slider :min="1" :max="20" v-model:value="blurLevel" :step="1" :style="{ width: '85%' }"
              class="censor-input" />
          </n-thing>
        </n-grid-item>
      </n-grid>
    </template>
  </n-card>
</template>
<script setup lang="ts">
import { watch, computed, toRefs, inject, ref, Ref } from 'vue';
import { NCard, NIcon, NThing, NSpace, NCheckbox, NSlider, NGrid, NGridItem, NGi } from "naive-ui";
import { AlertCircleOutline } from "@vicons/ionicons5";
import { updateUserPrefs, watchForChanges } from '@silveredgold/beta-shared-components';
import { IExtensionPreferences } from '@/preferences';
import { debounce } from 'throttle-debounce';
import { dbg } from '@/util';
import { onBeforeMount } from 'vue';


const props = defineProps<{ preferences: IExtensionPreferences }>();
const { preferences } = toRefs(props);
const prefs = preferences;
const _blurLevel: Ref<number|undefined> = ref(undefined);

const filterEnabled = computed({
  get: () => prefs?.value?.loadingFilter?.enabled ?? true,
  set: val => {
    if (prefs.value.loadingFilter) {
      prefs.value.loadingFilter.enabled = val;
    }
  }
});

const updateLevel = debounce(1000, (val) => {
  prefs.value.loadingFilter.blurLevel = val;
});

const blurLevel = computed({
  get: () => _blurLevel.value ?? 10,
  set: val => {
    _blurLevel.value = val;
    updateLevel(val);
  }
})

watch(prefs.value.loadingFilter, () => {
  dbg(`round-tripping persisted value to blur level`);
  _blurLevel.value = prefs.value.loadingFilter.blurLevel;
});

onBeforeMount(() => {
  _blurLevel.value = prefs.value.loadingFilter.blurLevel;
})


const updatePrefs = inject(updateUserPrefs, undefined);

const loaded = computed(() => prefs.value !== undefined);

watch(prefs, watchForChanges(false, updatePrefs), { deep: true });

</script>

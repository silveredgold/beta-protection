<template>
    <n-card title="Placeholder Preferences" size="small">
        <div>
            <n-thing
                content-indented
                title="No placeholders loaded"
                description="Load placeholders into the store to choose what categories to use here." v-if="!placeholders || placeholders.length == 0" >
                <template #avatar >
                    <n-button strong secondary circle @click="refreshPlaceholders"><template #icon><n-icon :component="Refresh" /></template></n-button>
                </template>
                </n-thing>
             <n-list bordered v-if="placeholders">
                 <!-- <n-checkbox-group v-model:value="enabled"> -->
                    <n-list-item v-for="category in placeholders" v-bind:key="category">
                    <template #prefix>
                        <!-- <n-checkbox :value="category" :disabled="true" /> -->
                        <n-icon-wrapper :size="24" :border-radius="10" v-if="enabled!.includes(category)">
                          <n-icon :size="20" :component="Checkmark" />
                        </n-icon-wrapper>
                        <!-- <n-icon-wrapper :size="24" :border-radius="10" v-if="!enabled!.includes(category)"> -->
                          <n-icon :size="24" :component="CloseCircleOutline" v-if="!enabled!.includes(category)" />
                        <!-- </n-icon-wrapper> -->
                    </template>
                    <n-thing :title="category" :description="getCount(category).toString() + ' assets'" />
                    <template #suffix>
                        <n-button v-if="!enabled!.includes(category)" secondary @click="() => enableCategory(category)">Enable</n-button>
                        <n-button v-if="enabled!.includes(category)" secondary @click="() => disableCategory(category)">Disable</n-button>
                    </template>
                    </n-list-item>
                <!-- </n-checkbox-group> -->
            </n-list>
        </div>
        <template #footer>
            While censoring takes place, images will be replaced by a placeholder randomly selected from the above categories.
        </template>
    </n-card>
</template>
<script setup lang="ts">
import { Ref, ref, watch, computed, toRefs, inject, onBeforeMount } from 'vue';
import { NCard, useNotification, NList, NListItem, NThing, NCheckbox, NCheckboxGroup, NButton, NIcon, NIconWrapper } from "naive-ui";
import { getAvailablePlaceholders, IExtensionPreferences } from '@/preferences';
import { Refresh, CloseCircleOutline, Checkmark } from "@vicons/ionicons5";
import { updateUserPrefs, watchForChanges } from '@silveredgold/beta-shared-components';
import { LocalPlaceholder } from '@/placeholders';
import { eventEmitter } from "@/messaging";
import { dbg } from '@/util';
import { debounce } from 'throttle-debounce';
import { loadPreferencesStore } from '@/stores';

const props = defineProps<{
    preferences: IExtensionPreferences
}>();

const notif = useNotification();
const { preferences } = toRefs(props);
const prefs = preferences;
const updatePrefs = inject(updateUserPrefs);
const availablePlaceholders: Ref<{categories: string[], allImages: LocalPlaceholder[]}> = ref({allImages: [], categories: []});
const enabledPlaceholders: Ref<string[]|undefined> = ref(undefined);
const prefsStore = await loadPreferencesStore();

const placeholders = computed(() => availablePlaceholders?.value?.categories?.length ? availablePlaceholders?.value?.categories : []);

const emitter = inject(eventEmitter);
emitter?.on('reload', e => {
    if (e.toLowerCase() == 'placeholders') {
        setTimeout(() => {
            console.log('Reloading placeholders for options view');
            loadPlaceholders().then(ph => {
                availablePlaceholders.value = ph;
            });
        }, 500);
    }
});

// const updatePlaceholders = debounce(1000, (val) => {
//   dbg(`persisting selected placeholders`, val, prefs.value.enabledPlaceholders);
//   prefs.value.enabledPlaceholders = val;
// });


// const enabled = computed({
//     get: () => enabledPlaceholders.value ?? [],
//     set: val => {
//         // console.log(`setting enabled placeholders`, val, prefs?.value?.enabledPlaceholders);
//         // if (prefs?.value?.enabledPlaceholders) {
//         //     console.log(`placeholders ready for setting`, val, prefs?.value?.enabledPlaceholders);
//         //     prefs.value.enabledPlaceholders = val;
//         // }
//         enabledPlaceholders.value = val;
//         updatePlaceholders(val);
//     }
// });
const enabled = computed(() => prefsStore?.currentPreferences?.enabledPlaceholders ?? []);

const getCount = (category: string): number => {
    let currentCount = 0;
    const matchingItems = (availablePlaceholders?.value?.allImages ?? []);
    const matchingAssets = matchingItems.filter(img => {
        return img?.category === category
    });
    if (matchingAssets && matchingAssets.length > 0) {
        currentCount = matchingAssets.length;
    }
    return currentCount;
}

watch(prefs, watchForChanges(true, updatePrefs), {deep: true});
// watch(prefs.value.enabledPlaceholders, () => {
//   dbg(`round-tripping persisted value to enabled holders`);
//   enabledPlaceholders.value = prefs.value.enabledPlaceholders;
// });


const disableCategory = (value: string) => {
  if (preferences.value) {
    prefsStore.setPlaceholderCategoryState(value, false);
  }
}

const enableCategory = (value: string) => {
  if (preferences.value) {
    prefsStore.setPlaceholderCategoryState(value, true);
  }
}

onBeforeMount(() => {
    refreshPlaceholders();
});

const refreshPlaceholders = () => {
    loadPlaceholders().then(ph => {
        availablePlaceholders.value = ph;
        enabledPlaceholders.value = prefs.value.enabledPlaceholders;
    });
}

const loadPlaceholders = async () => {
    const holders = await getAvailablePlaceholders();
    dbg('got placeholder DB', holders);
    return holders;
}

</script>

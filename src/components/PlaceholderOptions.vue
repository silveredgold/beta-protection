<template>
<n-card title="Placeholder Preferences" size="small">
        <!-- <template #header-extra>Backend Host</template> -->
        <div>
             <n-list bordered v-if="placeholders">
                 <n-checkbox-group v-model:value="enabled">
                <!-- <template #header> hhh </template>
                <template #footer> fff </template> -->
                    <n-list-item v-for="category in placeholders" v-bind:key="category">
                    <template #prefix>
                        <n-checkbox :value="category" />
                    </template>
                    <n-thing :title="category" :description="getCount(category).toString() + ' assets'" />
                    </n-list-item>
                </n-checkbox-group>
            </n-list>
        </div>
        <template #footer>
            <!-- <p>{{mode}}</p> -->
            While censoring takes place, images will be replaced by a placeholder randomly selected from the above categories.
        </template>
    </n-card>
</template>
<script setup lang="ts">
import { ComponentOptions, defineComponent, onMounted, reactive, Ref, ref, watch, computed, toRefs, inject, onBeforeMount } from 'vue';
import { NCard, useNotification, NList, NListItem, NThing, NCheckbox, NCheckboxGroup } from "naive-ui";
import { loadPreferencesFromStorage, IPreferences, OperationMode, getAvailablePlaceholders } from '../preferences';
import { updateUserPrefs } from '../options/services';
import { PlaceholderService } from '@/services/placeholder-service';

const props = defineProps<{
    preferences: Ref<IPreferences>
}>();

const notif = useNotification();
let { preferences } = toRefs(props);
const prefs = preferences;
const updatePrefs = inject(updateUserPrefs);
const availablePlaceholders: Ref<{categories: string[], allImages: string[]}> = ref({allImages: [], categories: []});

const placeholders = computed(() => availablePlaceholders?.value?.categories?.length ? availablePlaceholders?.value?.categories : []);

const enabled = computed({
    get: () => prefs?.value?.enabledPlaceholders ?? [],
    set: val => {
        if (prefs?.value?.enabledPlaceholders) {
            prefs.value.enabledPlaceholders = val;
        }
    }
});

const getCount = (category: string): number => {
    let currentCount = 0;
    let matchingAssets = availablePlaceholders.value.allImages.filter(img => img.startsWith("images/placeholders/" + category));
    if (matchingAssets && matchingAssets.length > 0) {
        // console.log('matching assets', matchingAssets);
        currentCount = matchingAssets.length;
    }
    return currentCount;
}

watch(prefs, async (newMode, prevMode) => {
    updatePrefs!();
}, {deep: true});

onBeforeMount(() => {
    loadPlaceholders().then(ph => {
        availablePlaceholders.value = ph;
    })
})

const loadPlaceholders = async () => {
    let holders = await getAvailablePlaceholders();
    return holders;
}


</script>
<style>
</style>
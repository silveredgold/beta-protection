<template>
<n-card title="Placeholder Preferences" size="small">
        <!-- <template #header-extra>Backend Host</template> -->
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
                 <n-checkbox-group v-model:value="enabled">
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
import { ComponentOptions, defineComponent, onMounted, reactive, Ref, ref, watch, computed, toRefs, inject, onBeforeMount, defineEmits } from 'vue';
import { NCard, useNotification, NList, NListItem, NThing, NCheckbox, NCheckboxGroup, NButton, NIcon } from "naive-ui";
import { loadPreferencesFromStorage, IPreferences, OperationMode, getAvailablePlaceholders } from '@/preferences';
import { Refresh } from "@vicons/ionicons5";
import { updateUserPrefs } from '@/options/services';
import { PlaceholderService } from '@/services/placeholder-service';
import { LocalPlaceholder } from '@/placeholders';
import { eventEmitter, ActionEvents } from "@/messaging";

const props = defineProps<{
    preferences: Ref<IPreferences>
}>();

const notif = useNotification();
const { preferences } = toRefs(props);
const prefs = preferences;
const updatePrefs = inject(updateUserPrefs);
const availablePlaceholders: Ref<{categories: string[], allImages: LocalPlaceholder[]}> = ref({allImages: [], categories: []});

const placeholders = computed(() => availablePlaceholders?.value?.categories?.length ? availablePlaceholders?.value?.categories : []);

const emitter = inject(eventEmitter);
emitter?.on('reload', e => {
    if (e.toLowerCase() == 'placeholders') {
        setTimeout(() => {
            console.log('reloading placeholders for options view');
            loadPlaceholders().then(ph => {
                availablePlaceholders.value = ph;
            });
        }, 500);
    }
});

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
    const matchingItems = (availablePlaceholders?.value?.allImages ?? []);
    const matchingAssets = matchingItems.filter(img => {
        return img?.category === category
    });
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
    refreshPlaceholders();
});

const refreshPlaceholders = () => {
    loadPlaceholders().then(ph => {
        availablePlaceholders.value = ph;
    });
}

const loadPlaceholders = async () => {
    const holders = await getAvailablePlaceholders();
    console.log('got placeholder DB', holders);
    return holders;
}


</script>
<style>
</style>
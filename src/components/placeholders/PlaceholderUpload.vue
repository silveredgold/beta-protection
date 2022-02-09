<template>
    <n-card title="Placeholder Management" size="small">
        <div>
            <n-tooltip trigger="hover">
                <template #trigger>
                    <n-button @click="openDir">Import Folder...</n-button>
                </template>
                Choose a folder with placeholders for a single category.
            </n-tooltip>
            <n-tooltip trigger="hover">
                <template #trigger>
                    <n-button @click="openFile">Import Single File...</n-button>
                </template>
                Choose a single image to use for any category.
            </n-tooltip>
        </div>
        <n-card
            v-if="newFiles && newFiles.length > 0"
            title="Importing Files"
            size="small"
            :style="{ maxHeight: '200px' }"
        >
            <n-grid x-gap="12" :cols="2">
                <n-gi>
                    <n-thing title="Category:">
                        <n-auto-complete
                            :input-props="{
                                autocomplete: 'disabled'
                            }"
                            :options="categoryOptions"
                            v-model:value="categoryName"
                            placeholder="Category Name"
                        />
                        <template #footer>
                            <n-button
                                @click="importCurrent"
                                :disabled="!categoryName"
                                primary
                            >Import</n-button>
                            <n-button @click="cancelImport" ghost>Cancel</n-button>
                        </template>
                    </n-thing>
                </n-gi>
                <n-gi>
                    <!-- CSS is hard so the list can wait -->
                    <!-- <n-list bordered> 
                <n-list-item v-for="file in newFiles" v-bind:key="file.handle.name">
                    <n-thing :title="file.handle.name" :description="humanFileSize(file.file.size)" />
                </n-list-item>
                    </n-list>-->
                    <n-thing :title="importMsg" :description="humanFileSize(allFileSize)">
                        <template
                            #footer
                        >These files will be imported to the '{{ categoryName }}' category.</template>
                    </n-thing>
                </n-gi>
            </n-grid>
        </n-card>
        <template #footer>
            <!-- <p>{{mode}}</p> -->
            While censoring takes place, images will be replaced by a placeholder randomly selected from the above categories.
        </template>
    </n-card>
</template>
<script setup lang="ts">
import { ComponentOptions, defineComponent, onMounted, reactive, Ref, ref, watch, computed, toRefs, inject, onBeforeMount } from 'vue';
import { NCard, useNotification, NButton, NAutoComplete, NList, NListItem, NTooltip, NThing, NGrid, NGridItem, NGi } from "naive-ui";
import { loadPreferencesFromStorage, IPreferences, OperationMode, getAvailablePlaceholders } from '../../preferences';
import { updateUserPrefs } from '../../options/services';
import { PlaceholderService } from '@/services/placeholder-service';
import { LocalPlaceholder } from '@/services/db-client';
import { FileSystemClient, LoadedFileHandle } from "@/services/fs-client";
import { humanFileSize } from "@/util";

const props = defineProps<{
    preferences: Ref<IPreferences>
}>();

const notif = useNotification();
const { preferences } = toRefs(props);
const prefs = preferences;
const updatePrefs = inject(updateUserPrefs);

const placeholders: Ref<LocalPlaceholder[]> = ref([]);
const newFiles: Ref<LoadedFileHandle[]> = ref([]);
const categoryName = ref('');

// const placeholders = computed(() => availablePlaceholders?.value?.categories?.length ? availablePlaceholders?.value?.categories : []);

const categories = computed(() => [...new Set(placeholders.value.map(pl => pl.category))]);
const categoryOptions = computed(() => categories.value.filter(cat => cat.toLowerCase().includes(categoryName.value.toLowerCase())).map(cat => {
    return {
        label: cat,
        value: cat
    }
}));
const allFileSize = computed(() => newFiles.value.reduce((a, b) => a = a + b.file.size, 0));
const importMsg = computed(() => `Importing ${newFiles.value.length} files...`)


const enabled = computed({
    get: () => prefs?.value?.enabledPlaceholders ?? [],
    set: val => {
        if (prefs?.value?.enabledPlaceholders) {
            prefs.value.enabledPlaceholders = val;
        }
    }
});

// const getCount = (category: string): number => {
//     let currentCount = 0;
//     let matchingAssets = placeholders.value.filter(pl => pl.category == category);
//     if (matchingAssets && matchingAssets.length > 0) {
//         // console.log('matching assets', matchingAssets);
//         currentCount = matchingAssets.length;
//     }
//     return currentCount;
// }

const openDir = async () => {
    const fs = new FileSystemClient();
    const  result = await fs.getFiles((file) => file.type.startsWith("image/"));
    console.log('loaded files', result);
    newFiles.value = result.files;
    categoryName.value = result.dir;

}

const openFile = async () => {
    const fs = new FileSystemClient();
    let result = await fs.getFile(fs.imageTypes)
    console.log('loaded files', result);
    newFiles.value = [result];
}

const importCurrent = async () => {
    await PlaceholderService.loadLocalPlaceholders({ categoryName: categoryName.value, files: newFiles.value }, "data");
    const n = notif.create({
        title: 'Imported!',
        duration: 4000,
        closable: true
    });
    categoryName.value = '';
    newFiles.value = [];
    chrome.runtime.sendMessage({ msg: 'reloadPlaceholders' });
    loadPlaceholders().then(ph => {
        placeholders.value = ph;
    });
}

const cancelImport = () => {
    categoryName.value = '';
    newFiles.value = [];
}



watch(prefs, async (newMode, prevMode) => {
    updatePrefs!();
}, { deep: true });

onBeforeMount(() => {
    loadPlaceholders().then(ph => {
        placeholders.value = ph;
    })
})

const loadPlaceholders = async () => {
    let holders = await PlaceholderService.getLocalPlaceholders();
    return holders;
}


</script>
<style>
</style>
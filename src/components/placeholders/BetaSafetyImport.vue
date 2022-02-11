<template>
    <n-card title="Placeholder Import" size="small">
        <div>
            <n-tooltip trigger="hover">
                <template #trigger>
                    <n-button @click="openDir">Import from Beta Safety...</n-button>
                </template>
                Locate and choose the <code>placeholders</code> directory in your Beta Safety folder.
            </n-tooltip>
        </div>
        <n-card
            v-if="newFiles && newFiles.length > 0"
            title="Importing Beta Safety Files:"
            size="small"
            :style="{ height: '500px' }"
        >
            <n-tree
                block-line
                :data="importData"
                default-expand-all
                virtual-scroll
                style="height: 250px"
            />
            <template #action>
                <n-thing :title="importMsg" :description="humanFileSize(allFileSize)">
                    These files will be imported to the local placeholder store.
                    <template #footer>
                        <n-button primary @click="importCurrent">Import</n-button>
                        <n-button @click="cancelImport" ghost>Cancel</n-button>
                    </template>
                </n-thing>
            </template>
        </n-card>
        <template #footer>
            <!-- <p>{{mode}}</p> -->
            Make sure you select the <code>placeholders</code> directory from your unpacked Beta Safety installation. We will then import all the
            available placeholders from Beta Safety to your browser so Beta Protection can use them.
        </template>
    </n-card>
</template>
<script setup lang="ts">
import { ComponentOptions, defineComponent, onMounted, reactive, Ref, ref, watch, computed, toRefs, inject, onBeforeMount } from 'vue';
import { NCard, useNotification, NButton, NAutoComplete, NList, NListItem, NTooltip, NThing, NGrid, NGridItem, NGi, NTree, TreeOption } from "naive-ui";
import { loadPreferencesFromStorage, IPreferences, OperationMode, getAvailablePlaceholders } from '../../preferences';
import { updateUserPrefs } from '../../options/services';
import { PlaceholderService } from '@/services/placeholder-service';
import { LocalPlaceholder } from '@/placeholders';
import { FileSystemClient, LoadedFileHandle } from "@/services/fs-client";
import { humanFileSize } from "@/util";
import { eventEmitter, ActionEvents } from "@/messaging";
import mitt from 'mitt';

const props = defineProps<{
    preferences: Ref<IPreferences>
}>();

const emitter = inject(eventEmitter);
const notif = useNotification();
const { preferences } = toRefs(props);
const prefs = preferences;
const updatePrefs = inject(updateUserPrefs);

// const placeholders: Ref<LocalPlaceholder[]> = ref([]);
const newFiles: Ref<{ name: string, files: LoadedFileHandle[] }[]> = ref([]);
const categoryName = ref('');



const importData = computed((): TreeOption[] => {
    return newFiles.value.map(nfv => {
        return {
            label: nfv.name,
            key: nfv.name,
            children: nfv.files.map(f => {
                return {
                    label: f.handle.name,
                    key: `${nfv.name}/${f.handle.name}`
                }
            })
        }
    });
});
const allFileSize = computed(() => newFiles.value.reduce((a, b) => a = a + b.files.reduce((c, d) => c + d.file.size, 0), 0));
const importMsg = computed(() => `Importing ${newFiles.value.flatMap(h => h.files).length} files into ${uniqueCategories.value.length} categories...`)
const uniqueCategories = computed(() => [...new Set(newFiles.value.map(f => f.name))]);

const openDir = async () => {
    const fs = new FileSystemClient();
    const result = await fs.getDirectoriesandFiles((file) => file.type.startsWith("image/"));
    console.log('loaded files', result);
    const results = Object.keys(result).map(k => {
        return {
            name: k,
            files: result[k]
        }
    });
    newFiles.value = results;

}

const importCurrent = async () => {
    for (const newEntry of newFiles.value) {
        await PlaceholderService.loadLocalPlaceholders({ categoryName: newEntry.name, files: newEntry.files }, "data");
    }

    const n = notif.create({
        title: 'Imported!',
        duration: 4000,
        closable: true
    });
    emitter?.emit('reload', 'placeholders');
    categoryName.value = '';
    newFiles.value = [];
    // loadPlaceholders().then(ph => {
    //     placeholders.value = ph;
    // });
}

const cancelImport = () => {
    categoryName.value = '';
    newFiles.value = [];
}



watch(prefs, async (newMode, prevMode) => {
    updatePrefs!();
}, { deep: true });


</script>
<style>
</style>
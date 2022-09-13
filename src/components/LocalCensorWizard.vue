<template>
    <n-card
        :segmented="{
            content: 'soft',
            footer: 'soft'
        }">
    <n-space vertical>
        <n-alert closable type="warning" v-if="connection.name == 'Beta Safety'" title="Beta Safety Warning!">
            Due to a bug in Beta Safety, censoring local files is dramatically slower when using Beta Safety. Each file will be censored one-by-one (or Beta Safety will just return one image for any similar images).
        </n-alert>
        <n-alert closable title="Censoring Local Files">
            <n-text tag="p">Follow the wizard below to censor locally saved files using your current censoring backend. Use this to censor your saved images just like images you view, using the same settings or different ones.</n-text>
            <n-text tag="p">Note that for security reasons, your browser may prompt you a few times for permissions to access and modify your files. This is expected behaviour..</n-text>
        </n-alert>
        <n-steps :current="currentStep" :status="currentStepStatus">
            <n-step title="Import your files" description="Import your images to be censored">
                <n-text>Import a folder of images to censor. This will include any subdirectories with images in them.</n-text>
            </n-step>
            <n-step title="Censoring Preferences" description="Set the censoring options for the files">
                <n-text>Choose the censoring options to be applied to these files. These will be used for all the files being censored.</n-text>
                <n-space item-style="display: flex;" justify="end" v-if="currentStep == 2">
                    <n-button @click="() => currentStep++">Next</n-button>
                </n-space>
            </n-step>
            <n-step
                title="Begin Censoring"
                description="Queue your images to be censored on the backend">
                <n-text>Your images are ready to be censored.</n-text>
                <n-space item-style="display: flex;" justify="end" v-if="currentStep == 3">
                    <n-text>{{resultsQueue.size}}/{{jobQueue.size}} images processed.</n-text>
                    <n-button type="info" :disabled="(!readyToRun) || jobQueue.size > 0" @click="startCensoring">Start</n-button>
                </n-space>
            </n-step>
        </n-steps>
    </n-space>
    <template #footer>
        <div v-if="currentStep == 1">
            <FileImportList action-help-text="Select a directory of images to censor" @files-loaded="onFilesLoaded" />
        </div>
        <div v-if="currentStep == 2">
            <censoring-preferences :preferences="(batchPreferences as IPreferences)" />
        </div>
        <div v-if="currentStep == 3">
        <n-grid :cols="3">
        <n-grid-item :span="3" v-if="resultsQueue.size > 0">
            <n-alert type="success" :title="`${resultsQueue.size} images successfully censored!`">
                Use the options below to save the censored images. You can either:
                <ul>
                    <n-text tag="li">Save them into a separate directory: this will create a <n-text code>censored/</n-text> folder inside the imported folder with the censored images.</n-text>
                    <n-text tag="li">Overwrite: this will overwrite the original images with the censored versions.</n-text>
                </ul>
                In either case, you will be prompted for permission to save files to the target folder.
            </n-alert>
        </n-grid-item>
        <n-grid-item :span="1" v-if="jobQueue.size > 0 || resultsQueue.size > 0 || savedQueue.size > 0">
            <RequestQueue :requests="currentRequests">
            <template #action>
                <div v-if="resultsQueue && resultsQueue.size > 0 && jobQueue.size == 0 && inputClean">
                        <n-popconfirm
                            @positive-click="deleteSourceFiles"
                        >
                            <template #trigger>
                                <n-button>Delete Source Files</n-button>
                            </template>
                            Are you sure you want to delete the source files? This is irreversible!
                        </n-popconfirm>
                    </div>
            </template>
            </RequestQueue>
        </n-grid-item>
        <n-grid-item :span="savedQueue.size > 0 ? 1 : 2" v-if="resultsQueue.size > 0">
            <FileList :files="listFiles" title="Censored Files">
            <template #action>
            <n-dropdown 
                trigger="click" 
                :options="saveOptions" 
                @select="onSelectSave" 
                placement="bottom-end" 
                :disabled="jobQueue.size != 0"
                :show-arrow="true">
                <n-button :disabled="jobQueue.size != 0" type="success" size="large" >Save...</n-button>
            </n-dropdown>
            </template>
            </FileList>
        </n-grid-item>
        <n-grid-item :span="savedQueue.size > 0 ? resultsQueue.size > 0 ? 1 : 2 : 0" v-if="savedQueue.size > 0">
            <FileList :files="savedFiles" title="Saved Files" />
        </n-grid-item>
        <n-grid-item :span="3">
        </n-grid-item>
            </n-grid>
        </div>
    </template>
    </n-card>
    <!-- <pre>{{JSON.stringify(overridePreferences, null, 2)}}</pre> -->
</template>

<script setup lang="ts">

import type { IPreferences } from '@/preferences';
import { NList, NListItem, NCard, NGrid, NGridItem, NSpace, NButton, NDropdown, NSteps, NStep, NThing, NPopconfirm, NAlert, NText, NSpin, NIcon, NIconWrapper, NDataTable, DataTableColumns } from "naive-ui"; 
import { computed, ComputedRef, h, reactive, Ref, ref, toRefs, onBeforeMount } from 'vue';
import { CensoringPreferences, FileImportList, services, useBackendTransport, FileList, RequestQueue } from "@silveredgold/beta-shared-components";
import { useUserOptionsStore } from '@/stores'
import type { DirectoryFile, DirectoryFileList } from '@silveredgold/beta-shared-components/lib/services';
import type { IFileEntry } from '@silveredgold/beta-shared-components/lib/components';
import { ICensorBackend, ImageCensorResponse } from '@silveredgold/beta-shared/transport';
import { DropdownMixedOption } from 'naive-ui/lib/dropdown/src/interface';
import clone from 'just-clone';
import { dbgLog } from '@/util';
import { storeToRefs } from 'pinia';
const { BatchCensorService } = services;

const props = defineProps<{
    preferences: IPreferences
}>();

const store = useUserOptionsStore();

const {preferences} = toRefs(props);
const { allowUnsafeLocal } = storeToRefs(store);


// const batchPreferences = clone(preferences);
const workingFiles: Ref<DirectoryFileList[]>  = ref([])

const currentStep = ref(1);
const currentStepStatus: Ref<"wait" | "error" | "finish" | "process"> = ref('process');

const readyToRun = computed(() => !!batchPreferences.value && workingFiles.value.length > 0 && resultsQueue.value.size == 0);
const backend = await useBackendTransport();
const connection = await backend.check();
const inputHandle: Ref<FileSystemDirectoryHandle|undefined> = ref(undefined);
const inputClean = ref(true);

const currentRequests = computed(() => [...jobQueue.value.entries()].map(v => {return {name: v[1].handle.name, id: v[0], loading: true}}));
const currentComplete = computed(() => [...resultsQueue.value.values()].map(v => v.handle.name));
// const savedFiles = computed(() => [...savedQueue.value.values()].map(v => v.path));
const listFiles: ComputedRef<IFileEntry[]> = computed(() => [...resultsQueue.value.values()].map((v): IFileEntry => {return {key: v.handle.name, imageSrc: v.url, completed: true}}));
const savedFiles = computed(() => [...savedQueue.value.values()].map((v): IFileEntry => {return {key: v.path, completed: true}}))

const saveOptions = computed(() => {
    const base: DropdownMixedOption[] = [
    {
        label: 'Overwrite input images',
        key: 'overwrite',
    }, {
        label: 'Save to directory',
        key: 'save',
        disabled: !allowUnsafeLocal.value
    }];
    return base;
});

const handleCensored = async (sender: ICensorBackend, response: ImageCensorResponse) => {
    dbgLog('got censoring response', response, jobQueue.value);
    if (response.id && jobQueue.value.has(response.id)) {
        const handle = jobQueue.value.get(response.id);
        // console.log('found matching handle for response', handle);
        jobQueue.value.delete(response.id);
        if (response.error) {
            console.log('got error',response);
        } else {
            if (handle) {
                resultsQueue.value.set(response.id, {handle: handle!.handle, url: response.url });
            }
        }
    }
}
backend.onImageCensored.subscribe(handleCensored);

const jobQueue: Ref<Map<string, DirectoryFile>> = ref(new Map());
const resultsQueue: Ref<Map<string, {handle: FileSystemFileHandle, url: string }>> = ref(new Map());
const savedQueue: Ref<Map<string, {path: string}>> = ref(new Map());

const batchService = new BatchCensorService(backend, jobQueue.value);

const startCensoring = async () => {
    const queue = await batchService.startCensoringFiles(workingFiles.value, {...clone(preferences.value), ...batchPreferences.value as IPreferences}, connection.name === 'Beta Safety');
    workingFiles.value = [];
}



const batchPreferences: Ref<Partial<IPreferences>> = ref({
    covered: preferences.value.covered,
    exposed: preferences.value.exposed,
    otherCensoring: preferences.value.otherCensoring,
    obfuscateImages: false,
    enabledStickers: preferences.value.enabledStickers
});

const onFilesLoaded = async (dirHandle: FileSystemDirectoryHandle, files:DirectoryFileList[]) => {
    workingFiles.value = files;
    inputHandle.value = dirHandle;
    currentStep.value++;
}



const saveCensored = async (replaceOriginal: boolean) => {
    batchService.onImageSaved.subscribe(savedImage => {
        resultsQueue.value.delete(savedImage.id);
        savedQueue.value.set(savedImage.id, {path: savedImage.path});
    });
    const results = [...resultsQueue.value.entries()].map(input=> {
        const [id, value] = input;
        return {id, file: {handle: value.handle, url: value.url}}});
    inputClean.value = !replaceOriginal;
    await batchService.saveCensored(results, inputHandle.value!, replaceOriginal ? undefined : 'censored', replaceOriginal ? '' : 'beta_');
}

const deleteSourceFiles = async () => {
    const srcFiles = jobQueue.value.entries();
    for (const [id, file] of srcFiles) {
        let fileOutDir = inputHandle.value!;
        const resolved = await inputHandle.value!.resolve(file.handle);
        if (resolved !== null && resolved.length > 1) {
            const segments = resolved?.slice(0, -1)
            for (let i = 0; i < segments.length; i++) {
                const element = segments[i];
                fileOutDir = await fileOutDir.getDirectoryHandle(element, {create: true});
            }
        }
        try {
            await fileOutDir.removeEntry(file.handle.name)
            jobQueue.value.delete(id);
        } catch {
            console.warn('error removing file');
        }
    }
}

const onSelectSave = (key: string) => {
    saveCensored(key == 'overwrite');
};

onBeforeMount(async () => {
  await store.load();
});
</script>

<template>
<n-card title="Sticker Preferences" size="small">
        <!-- <template #header-extra>Backend Host</template> -->
        <div>
            <n-thing 
                content-indented 
                title="No stickers loaded" 
                description="Ensure your current censoring backend has stickers available and loaded for use!" v-if="!stickers || stickers.length == 0" >
                <template #avatar >
                    <n-button strong secondary circle @click="refreshStickers"><template #icon><n-icon :component="Refresh" /></template></n-button>
                </template>
                </n-thing>
             <n-list bordered v-if="stickers">
                 <n-checkbox-group v-model:value="enabled">
                    <n-list-item v-for="category in stickers" v-bind:key="category">
                    <template #prefix>
                        <n-checkbox :value="category" />
                    </template>
                    <n-thing :title="category" />
                    </n-list-item>
                </n-checkbox-group>
            </n-list>
        </div>
        <template #footer>
            <!-- <p>{{mode}}</p> -->
            Stickers will only be used if the censoring method is set to Sticker!
        </template>
    </n-card>
</template>
<script setup lang="ts">
import { Ref, ref, watch, computed, toRefs, inject, onBeforeMount } from 'vue';
import { NCard, useNotification, NList, NListItem, NThing, NCheckbox, NCheckboxGroup, NButton, NIcon } from "naive-ui";
import { Refresh } from "@vicons/ionicons5";
import { IPreferences } from '@/preferences';
import { censorBackend, updateUserPrefs, useBackendTransport } from '@silveredgold/beta-shared-components';
import { StickerService } from '@/services/sticker-service';

const props = defineProps<{
    preferences: IPreferences
}>();

const notif = useNotification();
const { preferences } = toRefs(props);
const prefs = preferences;
const updatePrefs = inject(updateUserPrefs);
const availableStickers: Ref<string[]> = ref([]);
const asyncBackend = inject(censorBackend, undefined);

const stickers = computed(() => availableStickers?.value?.length ? availableStickers?.value : []);

const enabled = computed({
    get: () => prefs?.value?.enabledStickers ?? [],
    set: val => {
        if (prefs?.value?.enabledStickers) {
            prefs.value.enabledStickers = val;
        }
    }
});

watch(prefs, async (newMode, prevMode) => {
    if (newMode.enabledStickers && newMode.enabledStickers.length > 0) {
        updatePrefs!();
    } else {
        notif.create({
          content: 'You need to select at least one sticker set!',
          duration: 5000,
          closable: true
        });
    }
}, {deep: true});

onBeforeMount(() => {
    loadStickers().then(ph => {
        availableStickers.value = ph;
    })
})

const loadStickers = async () => {
    const holders = await StickerService.getAvailable();
    return holders;
}

const refreshStickers = async () => {
    if (asyncBackend !== undefined) {
        const backend = await asyncBackend();
        const stickers = await StickerService.tryRefreshAvailable(backend);
        availableStickers.value = stickers;
    }
}


</script>
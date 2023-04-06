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
             <!-- <n-list bordered v-if="stickers">
                 <n-checkbox-group v-model:value="enabled" @update:value="handleCategoryEnable">
                    <n-list-item v-for="category in stickers" v-bind:key="category">
                    <template #prefix>
                        <n-checkbox :value="category" />
                    </template>
                    <n-thing :title="category" />
                    </n-list-item>
                </n-checkbox-group>
            </n-list> -->
            <n-list bordered v-if="stickers">

                    <n-list-item v-for="category in stickers" v-bind:key="category">
                    <template #suffix>
                        <n-button v-if="!enabled!.includes(category)" secondary @click="() => enableCategory(category)">Enable</n-button>
                        <n-button v-if="enabled!.includes(category)" secondary @click="() => disableCategory(category)">Disable</n-button>
                    </template>
                    <n-thing :title="category" />
                    </n-list-item>
                <!-- <template #footer >
                    <n-button strong secondary circle @click="refreshStickers"><template #icon><n-icon :component="Refresh" /></template></n-button>

                </template> -->
            </n-list>
            <n-thing>{{ enabled?.join(',') }}</n-thing>
            <n-thing
                content-indented
                description="Note that stickers will only be used if the censoring method is set to Sticker!"
                title="Sticker Loading" v-if="stickers" >
                <template #header-extra>
                    <n-icon :component="Images" />
                </template>
                <template #action >
                    <n-button strong secondary @click="refreshStickers"><template #icon><n-icon :component="Refresh" /></template>Refresh</n-button>
                </template>
                Available stickers are controlled by your backend: ensure stickers are loaded in your backend first for the categories to appear here.
                </n-thing>
        </div>
        <!-- <template #footer>

        </template> -->
    </n-card>
</template>
<script setup lang="ts">
import { Ref, ref, watch, computed, toRefs, inject, onBeforeMount } from 'vue';
import { NCard, useNotification, NList, NListItem, NThing, NCheckbox, NCheckboxGroup, NButton, NIcon } from "naive-ui";
import { Refresh, Images } from "@vicons/ionicons5";
import { IPreferences } from '@/preferences';
import { censorBackend, updateUserPrefs, useBackendTransport } from '@silveredgold/beta-shared-components';
import { StickerService } from '@/services/sticker-service';
import { loadStickerStore } from '@/stores/stickers';
import { dbg } from '@/util';
import { loadPreferencesStore, usePreferencesStore } from '@/stores';

const props = defineProps<{
    preferences: IPreferences
}>();

const notif = useNotification();
const { preferences } = toRefs(props);
const prefs = preferences;
const updatePrefs = inject(updateUserPrefs);
const asyncBackend = inject(censorBackend, undefined);
const store = await loadStickerStore();
const prefsStore = await loadPreferencesStore();

const stickers = computed(() => store?.available?.length ? store.available : []);

const enabled = computed({
    get: () => prefs?.value?.enabledStickers ?? [],
    set: val => {
        dbg('enabled stickers setter', prefs?.value);
        if (prefs?.value?.enabledStickers) {
            prefs.value.enabledStickers = val;
        }
    }
});

watch(prefs, async (newMode, prevMode) => {
    if (!!prevMode && newMode.enabledStickers && newMode.enabledStickers.length > 0) {
        updatePrefs!();
    } else {
        notif.create({
          content: 'You need to select at least one sticker set!',
          duration: 5000,
          closable: true
        });
    }
}, {deep: true});

const refreshStickers = async () => {
    if (asyncBackend !== undefined) {
        const backend = await asyncBackend();
        const stickers = await store.tryRefreshAvailable(backend);
    }
}

const disableCategory = (value: string) => {
  if (preferences.value) {
    // dbg('disabling from enabledStickers', preferences.value.enabledStickers, value);
    // prefs.value.enabledStickers = prefs.value.enabledStickers.splice(prefs.value.enabledStickers.indexOf(value), 1);
    // store.setCategory(value, false);
    prefsStore.setStickerCategoryState(value, false);
  }
}

const enableCategory = (value: string) => {
  if (preferences.value) {
    // store.setCategory(value, true);
    prefsStore.setStickerCategoryState(value, true);
  }
}


</script>

<template>
<div style="position:relative; height: 100%">
    <n-layout has-sider position="absolute" embedded bordered>
        <n-layout-sider bordered content-style="padding: 12px;" class="side-scroll">
            <category-list
                :preferences="preferences"
                :placeholders="placeholders"
                @category-selected="(cat) => selectedCategory = cat"
            />
            <!-- At the moment, this is a separate action in the header -->
            <!-- <placeholder-upload :preferences="preferences" /> -->
        </n-layout-sider>
        <n-layout bordered :native-scrollbar="false">
            <n-layout-header style="display: flex; justify-content: flex-end;" content-style="padding: 6px;" bordered v-if="selectedPlaceholders && selectedPlaceholders.length > 0">
                <n-space style="margin: 6px 1.5em;">
                <n-checkbox v-model:checked="showInline">Inline Previews</n-checkbox>
                <n-tooltip trigger="hover">
                    <template #trigger>
                        <n-button strong secondary type="error" @click="deleteCategory(selectedCategory)">
                            Delete all
                        </n-button>
                    </template>
                    Delete all placeholders in the '{{selectedCategory}}' category! Cannot be undone!
                </n-tooltip>
                </n-space>
            </n-layout-header>
            <n-layout-content content-style="padding: 12px;" bordered>
                <placeholder-list :placeholders="selectedPlaceholders" v-if="selectedPlaceholders" @removed="onRemoved" :inline-previews="showInline" />
                <n-empty size="large" description="No placeholders loaded" v-if="!selectedPlaceholders || selectedPlaceholders.length === 0">
                    <template #extra>
                        Select a category on the left to get started.
                    </template>
                </n-empty>
            </n-layout-content>
            
        </n-layout>
    </n-layout>
</div>
</template>
<script setup lang="ts">
import { NTooltip, NButton, NSpace, NLayout, useNotification, NEmpty, NLayoutContent, NLayoutSider, NLayoutFooter, NLayoutHeader, NCheckbox } from "naive-ui";
import { computed, inject, ref, toRefs } from "vue";
import { IPreferences } from "@/preferences";
import { PlaceholderSet } from "@/placeholders";
import { CategoryList, PlaceholderList } from "@/components/placeholders"
import browser from 'webextension-polyfill';
import { eventEmitter } from "@/messaging";
import { PlaceholderService } from "@/services/placeholder-service";

const props = defineProps<{
    preferences: IPreferences,
    placeholders: PlaceholderSet
}>();

const emitter = inject(eventEmitter);
const notif = useNotification();
const { preferences, placeholders } = toRefs(props);

const selectedCategory = ref('');
const showInline = ref(false);

const selectedPlaceholders = computed(() => placeholders.value.allImages.filter(i => i.category == selectedCategory.value));

const onRemoved = () => {
    emitter?.emit('reload', 'placeholders');
}

const deleteCategory = (category: string) => {
    PlaceholderService.deleteCategory(category).then(() => {
        emitter?.emit('reload', 'placeholders');
    });
    selectedCategory.value = '';
}
</script>
<style>
.side-scroll {
    max-height: calc(100vh - 9rem);
    overflow-y: auto;
}
</style>
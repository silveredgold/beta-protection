<template>
    <n-list bordered v-if="placeholders">
        <!-- <template #header>
                            These sites will <strong>not</strong> be censored, regardless of mode!<br />
                            A site only needs to <em>partially</em> match any of the values below to be allowed.
        </template>-->
        <n-list-item v-for="category in placeholders.categories" v-bind:key="category">
            <template #prefix>
                <n-icon :component="CheckmarkCircleOutline" v-if="enabled.includes(category)" />
                <n-icon :component="RemoveCircleOutline" v-if="!enabled.includes(category)" />
            </template>
            <n-thing :title="category" :description="getCount(category).toString() + ' images'" />
            <template #suffix>
                <n-button
                    strong
                    secondary
                    circle
                    type="primary"
                    @click="$emit('categorySelected', category)"
                >
                    <template #icon>
                        <n-icon :component="ChevronForwardCircleOutline" />
                    </template>
                </n-button>
            </template>
        </n-list-item>
    </n-list>
</template>
<script setup lang="ts">
import { IPreferences } from "@/preferences";
import { NList, NListItem, NButton, NSpace, NCheckbox, NIcon, NThing } from "naive-ui";
import { CheckmarkCircleOutline, RemoveCircleOutline, ChevronForwardCircleOutline } from "@vicons/ionicons5";
import { computed, toRefs } from "vue";
import { PlaceholderSet } from "../types";

interface Props {
    preferences: IPreferences,
    placeholders: PlaceholderSet,
}

const props = defineProps<Props>();


const emit = defineEmits<{
    (e: 'categorySelected', category: string): void
}>();

const { preferences, placeholders } = toRefs(props);

const enabled = computed(() => preferences?.value?.enabledPlaceholders ?? []);

const getCount = (category: string): number => {
    let currentCount = 0;
    const matchingItems = (placeholders?.value?.allImages ?? []);
    const matchingAssets = matchingItems.filter(img => {
        return img?.category === category
    });
    if (matchingAssets && matchingAssets.length > 0) {
        currentCount = matchingAssets.length;
    }
    return currentCount;
}
</script>
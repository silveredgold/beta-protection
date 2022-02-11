<template>
    <n-list bordered v-if="placeholders && placeholders.length > 0">
        <n-list-item v-for="placeholder in placeholders" v-bind:key="placeholder.id">
            <template #prefix>{{ placeholder.id }}</template>
            <n-thing :title="placeholder.name" :description="placeholder.type" />
            <template #suffix>
                <n-space :vertical="!inlinePreviews" :wrap="false">
                    <n-image
                        v-if="inlinePreviews"
                        width="150"
                        height="150"
                        :src="PlaceholderService.toSrc(placeholder)"
                    />
                    <n-popover trigger="click" placement="left" v-if="!inlinePreviews">
                        <template #trigger>
                            <n-popover trigger="hover" placement="left">
                                <template #trigger>
                                    <n-button strong circle type="primary">
                                        <template #icon>
                                            <n-icon :component="Images" />
                                        </template>
                                    </n-button>
                                </template>
                                Preview
                            </n-popover>
                        </template>
                        <n-image
                            width="200"
                            height="200"
                            :src="PlaceholderService.toSrc(placeholder)"
                        />
                    </n-popover>
                    <n-popover trigger="hover" placement="left">
                        <template #trigger>
                            <n-button strong circle type="error" @click="deletePlaceholder(placeholder)">
                                <template #icon>
                                    <n-icon :component="TrashBin" />
                                </template>
                            </n-button>
                        </template>
                        Delete Placeholder
                    </n-popover>
                    
                </n-space>
            </template>
        </n-list-item>
    </n-list>
</template>
<script setup lang="ts">
import { IPreferences } from "@/preferences";
import { NList, NListItem, NButton, NSpace, NPopover, NIcon, NThing, NImage } from "naive-ui";
import { CheckmarkCircleOutline, Images, TrashBin } from "@vicons/ionicons5";
import { computed, ref, toRefs } from "vue";
import { LocalPlaceholder, PlaceholderSet } from "../types";
import { PlaceholderService } from "@/services/placeholder-service";

interface Props {
    placeholders?: LocalPlaceholder[],
    inlinePreviews?: boolean
}

const props = defineProps<Props>();


const emit = defineEmits<{
    (e: 'removed', id: string): void
}>();

const deletePlaceholder = (placeholder: LocalPlaceholder) => {
    PlaceholderService.deletePlaceholder(placeholder).then(() => {
        emit('removed', placeholder.id?.toString()!);
    });
}

const { placeholders, inlinePreviews } = toRefs(props);
</script>
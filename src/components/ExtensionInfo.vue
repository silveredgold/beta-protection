<template>
<div class="medium-text">Version: v{{extensionVersion}}</div>
<div class="medium-text">Install ID: {{extensionId}}</div>
<div class="medium-text" v-if="storageUsage">Storage Usage: {{ storageUsage.toFixed(2) }}%</div>

</template>
<script setup lang="ts">

import { getExtensionId, getExtensionVersion, getStorageUsage } from '@/util';
import { onBeforeMount, Ref, ref } from 'vue';


const extensionVersion = getExtensionVersion();

const extensionId: Ref<string> = ref('');

const storageUsage: Ref<number|undefined> = ref(undefined);

onBeforeMount(() => {
    getExtensionId().then(id => {
        extensionId.value = id;
    });
    getStorageUsage().then(usage => {
        if (usage?.quota) {
            storageUsage.value = (usage.usage/usage.quota)*100;
        }
    })
});


</script>
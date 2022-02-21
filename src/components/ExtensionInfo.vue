<template>
<div class="medium-text">Version: v{{extensionVersion}}</div>
<div class="medium-text">Install ID: {{extensionId}}</div>

</template>
<script setup lang="ts">

import { getExtensionId, getExtensionVersion } from '@/util';
import { onBeforeMount, Ref, ref } from 'vue';


const extensionVersion = getExtensionVersion();

const extensionId: Ref<string> = ref('');

onBeforeMount(() => {
    getExtensionId().then(id => {
        extensionId.value = id;
    });
})
</script>
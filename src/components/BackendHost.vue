<template>
    <n-card title="Configure Beta Safety Host" size="small">
        <template #header-extra>Backend Host</template>
        <div>
            <p>If your Beta Safety backend is running on another PC, you can update the address below.</p>
            <!-- <input v-model="host" placeholder="edit me" /> -->
            <n-input type="text" placeholder="Backend Host" v-model:value="currentHost" />
        </div>
        <template #action>
            <n-button @click="saveHost" size="large">Save and Reconnect</n-button>
        </template>
    </n-card>
</template>
<script setup lang="ts">
import { onBeforeMount, ref } from 'vue';
import { NCard, NButton, NInput } from "naive-ui";
import { debounce } from "throttle-debounce";
import browser from 'webextension-polyfill';
import { dbg } from '@/util';

const updateFunc = debounce(1000, async (host: string) => {
  dbg(`persisting host`, JSON.stringify(host));
  await browser.storage.local.set({'backendHost': host});
  browser.runtime.sendMessage({msg: 'reloadSocket'});
})

const currentHost = ref("");
const getCurrentHost = async () => {
    var storeResponse = await browser.storage.local.get({'backendHost': ''});
    const currentStoredHost = storeResponse['backendHost'] ?? "";
    return currentStoredHost;
}

const saveHost = async () => {
    dbg(`queuing host ${currentHost.value}`);
    updateFunc(currentHost.value);
}

onBeforeMount(() => {
    getCurrentHost().then(host => {
        currentHost.value = host;
    })
});

</script>
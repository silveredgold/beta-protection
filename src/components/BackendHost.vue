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
import { ComponentOptions, computed, defineComponent, onBeforeMount, onMounted, ref } from 'vue';
import { NCard, NButton, NInput } from "naive-ui";
import { debounce } from "throttle-debounce";

const updateFunc = debounce(1000, async (host: string) => {
  console.log(`persisting host`, JSON.stringify(host));
  var storeResponse = await chrome.storage.local.set({'backendHost': host});
  chrome.runtime.sendMessage({msg: 'reloadSocket'});
//   await savePreferencesToStorage(prefs);
})

const currentHost = ref("");
const getCurrentHost = async () => {
    var storeResponse = await chrome.storage.local.get({'backendHost': ''});
    const currentStoredHost = storeResponse['backendHost'] ?? "";
    console.log('setting ref value', currentStoredHost);
    return currentStoredHost;
}

const host = computed({
    get: () => currentHost?.value ?? '',
    set: val => {
        console.log(`queuing host ${val}`);
        updateFunc(val);
    }
})

const saveHost = async () => {
    console.log(`queuing host ${currentHost.value}`);
    updateFunc(currentHost.value);
    // var storeResponse = await chrome.storage.local.set({'backendHost': host.value});
}

onBeforeMount(() => {
    getCurrentHost().then(host => {
        currentHost.value = host;
    })
});

// return {
//     host,
//     getCurrentHost,
//     saveHost
// }

</script>
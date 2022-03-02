<template>
    <n-card size="small">
        <template v-if="!compact" #header>Backend Connection Status</template>
        <n-result
            :status="connected ? 'success' : 'warning'"
            :title="connected ? 'Connected' : 'Error'"
            :description="description"
            size="small"
        >
            <template #footer>
                <n-button @click="checkConnection">Recheck</n-button>
            </template>
        </n-result>
    </n-card>
</template>
<script setup lang="ts">
import { computed, inject, onBeforeMount, ref } from 'vue';
import { NCard, NButton, NResult } from "naive-ui";
import browser from 'webextension-polyfill';
import { backendProvider, censorBackend, IBackendProvider, ICensorBackend } from '@/transport';

const props = defineProps<{
    compact?: boolean
}>()

// const response = ref<{ status?: number }>({});
const connected = ref(false);
// const validResponse = computed(() => response?.value?.status === 200);
const backend: Promise<ICensorBackend>|undefined = inject(censorBackend, undefined);
const provider: IBackendProvider<ICensorBackend>|undefined = inject(backendProvider, undefined);
// const buildSocket = async () => {
//     const configHost = await browser.storage.local.get('backendHost');
//     const host = configHost['backendHost'];
//     try {
//         const webSocket = new WebSocket(host ?? WebSocketClient.defaultHost);
//         webSocket.onopen = () => {
//             connected.value = true;
//             webSocket.close();
//         };
//         webSocket.onclose = (e) => {
//             if (e.code !== 1000) {
//                 console.log('Socket is closed unexpectedly', e);
//             }
//         };

//         webSocket.onerror = function (err) {
//             //console.error('Socket encountered error: ', err.message, 'Closing socket');
//             webSocket.close(1000, err.toString());
//         };
//         return webSocket;
//     } catch (e: any) {
//         console.log("Websocket is complaining; server is likely rebooting or offline. - " + e.toString());
//         connected.value = false;
//     }
// }
const backendName = ref('unknown');
const description = computed(() => connected.value ? "Successfully connected to " + backendName.value + " backend!" : "Could not connect to backend!");

const checkConnection = async () => {
    connected.value = false;
    if (provider) {
        backendName.value = provider.name;
    }
    if (backend) {
        const configHost = await browser.storage.local.get('backendHost');
        const host = configHost['backendHost'];
        var client = await backend;
        var status = await client.check(host);
        connected.value = status.available;
    }
}

onBeforeMount(checkConnection);



</script>
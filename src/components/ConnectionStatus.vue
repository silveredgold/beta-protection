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
import { computed, onBeforeMount, ref } from 'vue';
import { NCard, NButton, NResult } from "naive-ui";
import browser from 'webextension-polyfill';
import { WebSocketClient } from '@/transport/webSocketClient';

const props = defineProps<{
    compact?: boolean
}>()

const response = ref<{ status?: number }>({});
const connected = ref(false);
const validResponse = computed(() => response?.value?.status === 200);
const buildSocket = async () => {
    const configHost = await browser.storage.local.get('backendHost');
    const host = configHost['backendHost'];
    try {
        const webSocket = new WebSocket(host ?? WebSocketClient.defaultHost);
        webSocket.onopen = () => {
            connected.value = true;
            webSocket.close();
        };
        webSocket.onclose = (e) => {
            if (e.code !== 1000) {
                console.log('Socket is closed unexpectedly', e);
            }
        };

        webSocket.onerror = function (err) {
            //console.error('Socket encountered error: ', err.message, 'Closing socket');
            webSocket.close(1000, err.toString());
        };
        return webSocket;
    } catch (e: any) {
        console.log("Websocket is complaining; server is likely rebooting or offline. - " + e.toString());
        connected.value = false;
    }
}

const description = computed(() => connected.value ? "Successfully connected to Beta Safety backend!" : "Could not connect to backend!");

const checkConnection = () => {
    buildSocket().then(ready => {
        //close the socket here instead maybe?
    })
}

onBeforeMount(checkConnection);



</script>
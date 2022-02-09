<template>
    <n-card title="Backend Connection Status" size="small">
        <template #header-extra></template>
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
import { ComponentOptions, computed, defineComponent, onBeforeMount, onBeforeUnmount, onMounted, ref } from 'vue';
import { NCard, NButton, NResult } from "naive-ui";
import { debounce } from "throttle-debounce";
import { WebSocketClient } from '@/transport/webSocketClient';

const response = ref<{ status?: number }>({});
const connected = ref(false);
const validResponse = computed(() => response?.value?.status === 200);
const buildSocket = async () => {
    const configHost = await chrome.storage.local.get('backendHost');
    // console.log(`pulled host config: ${JSON.stringify(configHost)}`);
    const host = configHost['backendHost'];
    try {
        const webSocket = new WebSocket(host);
        webSocket.onopen = () => {
            connected.value = true;
            webSocket.close();
        };
        webSocket.onclose = (e) => {
            if (e.code !== 4999) {
                console.log('Socket is closed unexpectedly', e);
            }
        };

        webSocket.onerror = function (err) {
            //console.error('Socket encountered error: ', err.message, 'Closing socket');
            webSocket.close(4998, err.toString());
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
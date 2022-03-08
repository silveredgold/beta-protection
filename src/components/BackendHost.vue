<template>
    <n-card title="Configure Censoring Backend" size="small" :segmented="{ content: 'soft', footer: 'soft' }">
        <template #header-extra>Backend Host</template>
        <div>
            <p>If your censoring backend is running on another PC, you can update the address below.</p>
            <!-- <input v-model="host" placeholder="edit me" /> -->
            <n-input type="text" placeholder="Backend Host" v-model:value="currentHost" />
        </div>
        <template #footer>
            <n-text tag="p">Choose what censoring backend you are using from the supported options below. If an option is disabled, it means the host/URL you have entered above is not valid for that backend.</n-text>
            <n-radio-group v-model:value="currentBackendId" name="radiobuttongroup1">
                <n-radio-button
                    v-for="backend in allBackends"
                    :key="backend"
                    :value="backend"
                    :disabled="!supportedBackends.includes(backend)"
                >
                    {{ titleCase(backend) }}
                </n-radio-button>
            </n-radio-group>
            </template>
        <template #action>
            <n-button @click="saveHost" :disabled="!valid" size="large">Save and Reconnect</n-button>
        </template>
    </n-card>
</template>
<script setup lang="ts">
import { computed, inject, onBeforeMount, Ref, ref, watch } from 'vue';
import { NCard, NButton, NInput, NRadioGroup, NRadioButton, NText } from "naive-ui";
import { debounce } from "throttle-debounce";
import browser from 'webextension-polyfill';
import { dbg } from '@/util';
import { backendService } from '@/transport';

const serviceProvider = inject(backendService);
let service = await serviceProvider!();

const updateFunc = debounce(1000, async (host: string) => {
  dbg(`persisting host`, JSON.stringify(host));
  await browser.storage.local.set({'backendHost': host});
  await browser.storage.local.set({'backendId': currentBackendId.value});
  browser.runtime.sendMessage({msg: 'reloadSocket'});
  service = await serviceProvider!();
})

const supportedBackends: Ref<string[]> = ref([]);
const allBackends: Ref<string[]> = ref(service.getSupported());
const currentBackendId = ref('');
const currentHost = ref("");
const getCurrentHost = async () => {
    var storeResponse = await browser.storage.local.get({'backendHost': ''});
    const currentStoredHost = storeResponse['backendHost'] ?? "";
    return currentStoredHost;
}

const valid = computed(() => !!currentHost.value && !!currentBackendId.value);

const saveHost = async () => {
    dbg(`queuing host ${currentHost.value}`);
    updateFunc(currentHost.value);
}

watch(currentHost, (newHost) => {
    currentBackendId.value = '';
    supportedBackends.value = service?.getSupported(newHost) ?? [];
    if (supportedBackends.value.length == 1) {
        currentBackendId.value = supportedBackends.value[0];
    }
});

onBeforeMount(() => {
    getCurrentHost().then(host => {
        currentHost.value = host;
    })
});

const titleCase = (s: string) =>
  s.replace (/^[-_]*(.)/, (_, c) => c.toUpperCase())       // Initial char (after -/_)
   .replace (/[-_]+(.)/g, (_, c) => ' ' + c.toUpperCase()) // First char after each -/_

</script>
<template>
    <div v-if="active">
        <n-grid :cols="3" :x-gap="12" :y-gap="12">
            <n-grid-item :offset="1" :span="1">
                <n-card title="Override Active!" :segmented="{ content: 'soft', footer: 'soft' }">
                    <n-text tag="p">You have an override currently active! This will lock some Beta Protection preferences until you disable it</n-text>
                    <template #footer>
                        <n-text>You will need to provide the correct unlock key for the current override to disable it.</n-text>
                    </template>
                    <template #action>
                        <n-space item-style="display: flex;" justify="space-between">
                            <n-popover trigger="hover" placement="bottom">
                                <template #trigger>
                                    <n-icon style="margin-top: auto; margin-bottom: auto;" :component="HelpCircleOutline" :size="30" />
                                </template>
                                <n-thing title="Override Details">
                                    Current Override ID: {{store.currentId}}
                                    <template #footer>
                                          <n-text v-if="store?.activatedTime">Activated <n-time :time="store.activatedTime" :to="currentTime" type="relative" /></n-text>
                                    </template>
                                </n-thing>
                            </n-popover>
                            <n-input-group style="margin-right: 0px;" v-if="timeRemaining == 0">
                                <n-input-group-label><n-icon :component="LockClosedSharp" /></n-input-group-label>
                                <n-input :style="{ width: '66%' }" v-model:value="unlockKey" placeholder="Unlock Key" />
                                <n-button type="primary" ghost @click="disableCurrent" :disabled="!unlockKey">
                                    Disable
                                </n-button>
                            </n-input-group>
                            <n-input-group v-if="timeRemaining > 0">
                                <n-input-group-label><n-icon :component="LockClosedSharp" /></n-input-group-label>
                                <n-input-group-label :style="{ width: '66%' }" ><n-time :time="currentTime + timeRemaining" :to="currentTime" type="relative" /></n-input-group-label>
                                <n-button type="primary" ghost :disabled="true">
                                    Disable
                                </n-button>
                            </n-input-group>
                        </n-space>
                    </template>
                </n-card>
            </n-grid-item>
        </n-grid>
        <!-- {{ ready }} -->
    </div>
    <div v-if="!active">
        <n-grid :cols="3" :x-gap="12" :y-gap="12">
            <n-grid-item>
                <n-alert type="success" title="No Override Active!">
                    <n-space vertical>
                        <n-text>You don't have any override currently active! You can change any preferences from the Options page.</n-text>
                        <n-space item-style="display: flex;" justify="end">
                            <n-button type="info" ghost size="large"  @click="webExtensionNavigation.openSettings">
                                <template #icon>
                                    <n-icon :component="Open" />
                                </template>
                                Options
                            </n-button>
                        </n-space>
                    </n-space>
                </n-alert>
            </n-grid-item>
            <n-grid-item :span="2">
                <n-card title="Import Override File">
                    <n-text tag="p">You can import a new override file here. After its imported, the override file will replace your current preferences and you will not be able to disable it without the unlock key.</n-text>
                    <template #action>
                        <n-button @click="importOverride">Import Override File</n-button>
                    </template>
                </n-card>
            </n-grid-item>
        </n-grid>
    </div>
</template>
<script setup lang="ts">
import { IExtensionPreferences, IOverride } from '@/preferences';
import { OverrideService } from '@/services/override-service';
import { LockClosedSharp, Open, HelpCircleOutline } from "@vicons/ionicons5";
import { useNotification, NCard, NGrid, NGridItem, NSpace, NButton, NText, NInput, NInputGroup, NInputGroupLabel, NIcon, NAlert, NPopover, NThing, NTime } from "naive-ui";
import { computed, inject, reactive, ref, Ref, toRefs, watch } from 'vue';
import { webExtensionNavigation } from "@/components/util";
import { eventEmitter } from "@/messaging";
import { dbg } from '@/util';
import { useOverrideStore } from '@/stores/overrides';

// const props = defineProps<{
//     // override: IOverride<IExtensionPreferences> | undefined
// }>();

// const svc = await OverrideService.create();
// const service = reactive(await OverrideService.create());
const store = useOverrideStore();
const notif = useNotification();

const emitter = inject(eventEmitter);

// const { override } = toRefs(props);
const currentTime = computed(() => new Date().getTime());

const timeRemaining: Ref<number> = computed(() => store.timeRemaining);

// const svc = inject(overrideService)
// watch(service, async (newMode, prevMode) => {
//     active.value = newMode.active;
// }, { deep: true });

const serviceReady = computed(() => store.$state !== undefined);

const active = computed(() => !!store.$state.id);

const unlockKey: Ref<string> = ref('');

emitter?.on('reload', (evt) => {
    dbg('reloading override details from event');
    if (evt == 'override') {
      //the store should do this for us
        // active.value = service.active;
        // timeRemaining.value = service.getTimeRemaining();
    }
});

const onUpdate = async () => {
    // active.value = service.active;
    // emitter?.emit('reload', 'overrides');
    // emitter?.emit('reload', 'preferences');
    // timeRemaining.value = service.getTimeRemaining();
}

const importOverride = async () => {
    const result = await store?.importOverride();
    dbg('import result', result);
    if (notif) {
        notif.create({
            type: result?.code == 200 ? 'success' : 'error',
            title: result?.code == 200 ? 'Successfully Imported!' : 'Failed to Import!',
            content: result?.message ?? '',
            duration: 6000
        });
    }
    onUpdate();
}

const disableCurrent = async () => {
    const result = await store.tryDisable(unlockKey.value);
    if (notif) {
        notif.create({
            type: result?.code == 200 ? 'success' : 'error',
            title: result?.code == 200 ? 'Successfully Disabled!' : 'Failed to Disable!',
            content: result?.message ?? '',
            duration: 6000
        });
    }
    unlockKey.value = '';
    onUpdate();
}

</script>

<template>
    <n-card
        :segmented="{
            content: 'soft',
            footer: 'soft'
        }">
    <n-space vertical>
        <n-alert closable title="Creating Override Files">
            <n-text tag="p">You can create an override file for a given set of Beta Protection preferences. This will export your preferences into a special override file.</n-text>
            <n-text tag="p">That file can then be imported by another user and Beta Protection will <n-text strong underline>enforce</n-text> those preferences until the override is disabled.</n-text>
            <n-text tag="p">To do this, you will need to set an unlock key. Anyone who imports your override will need to provide the unlock key before they can disable the override.</n-text>
        </n-alert>
        <n-steps :current="currentStep" :status="currentStepStatus">
            <n-step title="Creating Override Files" description="Exporting an override file">
                <n-text>To create your override, follow these steps to configure the file, then save and export it ready to share.</n-text>
                <n-space item-style="display: flex;" justify="end" v-if="currentStep == 1">
                    <n-button @click="handleButtonClick">Next</n-button>
                </n-space>
            </n-step>
            <n-step title="Censoring Preferences" description="Set the censoring options for the override">
                <n-text>Choose the censoring options for anyone using your override file. These will (no surprise) override any previously chosen censoring options.</n-text>
                <n-space item-style="display: flex;" justify="end" v-if="currentStep == 2">
                    <n-button @click="handleButtonClick">Next</n-button>
                </n-space>
            </n-step>
            <n-step title="Other Preferences">
                <n-text v-if="currentStep != 3">Set any other options to include in the override. Any options not included will still be configurable when the override is active.</n-text>
                <n-text v-if="currentStep == 3">You don't have to include every preference in an override! Choose which ones you want to include below.</n-text>
                
                    
                    <n-checkbox-group v-model:value="includedOptions" style="margin-bottom: 12px;" @update:value="onUpdateIncludedOptions" v-if="currentStep == 3">
                        <n-checkbox value="video">Video Options</n-checkbox>
                        <n-checkbox value="domainLists">Domain Lists</n-checkbox>
                        <n-checkbox value="errorMode">Error Mode</n-checkbox>
                    </n-checkbox-group>
                <n-space item-style="display: flex;" justify="end" v-if="currentStep == 3">
                    <n-button @click="handleButtonClick">Next</n-button>
                </n-space>
            </n-step>
            <n-step
                title="Operation Modes"
                description="Choose the allowed censoring modes when the override is active">
                <n-text>Choose which modes will be allowed when using this override. Anyone using your override can pick from any of the modes enabled here.</n-text>
                <n-checkbox-group v-model:value="allowedModes" style="margin-bottom: 12px;" v-if="currentStep == 4">
                    <n-checkbox value="enabled">Enabled</n-checkbox>
                    <n-checkbox value="onDemand">On Demand</n-checkbox>
                    <n-checkbox value="disabled">Disabled</n-checkbox>
                </n-checkbox-group>
                <n-space item-style="display: flex;" justify="end" v-if="currentStep == 4">
                    <n-button @click="handleButtonClick" :disabled="allowedModes.length == 0">Next</n-button>
                </n-space>
            </n-step>
            <n-step
                title="Set Unlock Key"
                description="Set the key used to disable the override">
                <n-text>Enter an unlock key below. The unlock key can be anything: a number, a word, a phrase, or some combination.</n-text>
                <n-space item-style="display: flex;" v-if="currentStep == 5" justify="end" vertical>
                    <n-input v-model:value="unlockKey" placeholder="Unlock Key" v-if="currentStep == 5">
                        <template #prefix>
                            <n-icon :component="LockClosedSharp" />
                        </template>
                    </n-input>
                    <n-space item-style="display: flex;" justify="end" v-if="currentStep == 5">
                        <n-text type="info">Make sure you don't lose it as anyone using your override will need the key to disable it.</n-text>
                        <n-button @click="handleButtonClick" :disabled="!unlockKey">Next</n-button>
                    </n-space>
                </n-space>
                
                
            </n-step>
            <n-step
                title="Build your override"
                description="Build and export your override file">
                <n-text>Your override is now ready to be built and exported to a file.</n-text>
                <n-space item-style="display: flex;" justify="end" v-if="currentStep == 6">
                    <n-button type="info" :disabled="!readyToBuild" v-if="!currentOverride"  @click="buildOverride">Build</n-button>
                    <n-button type="success" ghost v-if="currentOverride"  @click="exportOverride">Export</n-button>
                </n-space>
            </n-step>
        </n-steps>
    </n-space>
    <template #footer>
        <div v-if="currentStep == 1"></div>
        <div v-if="currentStep == 2">
            <censoring-preferences :preferences="(overridePreferences as IPreferences)" />
        </div>
        <div v-if="currentStep == 3">
            <video-options :preferences="(overridePreferences as IPreferences)" :compact="false" v-if="includedOptions.includes('video')" />
            <domain-list-options :allow-list="allowList" :force-list="forceList" v-if="includedOptions.includes('domainLists')" class="control-group" />
            <error-options :preferences="(overridePreferences as IPreferences)" v-if="includedOptions.includes('errorMode')" class="control-group" />
        </div>
        <div v-if="currentStep == 6 && !!currentOverride">
            <n-alert type="success" title="Override Successfully Built!">
                <n-space vertical>
                    <n-text>Your override has successfully been built! This file contains the preferences you configured above, ready to be imported. The key for the file (<n-text code>{{unlockKey}}</n-text>) is <strong>not</strong> included in the file so you will need to give it to anyone using your file for them to disable it.</n-text>
                    <n-space item-style="display: flex;" justify="end" align="end">
                        <n-thing title="Override ID" v-if="!!currentOverride">
                            <template #description>
                                <n-text code>{{currentOverride.id}}</n-text>
                            </template> 
                        </n-thing>
                        <n-button type="success" size="large"  @click="exportOverride">
                            <template #icon>
                                <n-icon :component="SaveOutline" />
                            </template>
                            Export
                        </n-button>
                    </n-space>
                </n-space>
            </n-alert>
        </div>
        <div v-if="currentStep == 5">
            <n-card title="Set Minimum Time">
                <template #header-extra>This is entirely optional!</template>
                <n-text>You can also set an (optional) minimum time. With this on, you won't be able to disable this override until the set time has passed, even if you have the key.</n-text>
                <template #footer>
                    <n-checkbox size="large" v-model:checked="enableMinTime">Enable Minimum Time</n-checkbox>
                </template>
                <template #action v-if="enableMinTime">
                        <n-input-group >
                                <n-input-group-label><n-icon :component="Time" style="margin-top: auto; margin-bottom: auto;" /></n-input-group-label>
                                <n-input-number :style="{ maxWidth: '20%' }" v-model:value="minTime.days" placeholder="Days"><template #suffix>days</template></n-input-number>
                                <n-input-number :style="{ maxWidth: '20%' }" v-model:value="minTime.hours"><template #suffix>hours</template></n-input-number>
                                <n-input-number :style="{ maxWidth: '20%' }" v-model:value="minTime.minutes"><template #suffix>minutes</template></n-input-number>
                            </n-input-group>
                    </template>
            </n-card>
        </div>
    </template>
    </n-card>
    <!-- <pre>{{JSON.stringify(overridePreferences, null, 2)}}</pre> -->
</template>

<script setup lang="ts">
import { defaultPrefs, IOverride, OperationMode } from '@/preferences';
import type { IPreferences } from '@/preferences';
import { OverrideService } from '@/services/override-service';
import { useNotification, NCard, NGrid, NGridItem, NSpace, NButton, NText, NCheckbox, NCheckboxGroup, NSteps, NStep, NInputNumber, NThing, NInput, NInputGroup, NInputGroupLabel, NIcon, NAlert } from "naive-ui"; 
import { LockClosedSharp, SaveOutline, Time, InformationCircleOutline } from "@vicons/ionicons5";
import { computed, inject, Ref, ref, toRefs } from 'vue';
import { CensoringPreferences, VideoOptions, ErrorOptions } from "@silveredgold/beta-shared-components";
import DomainListOptions from '@/components/DomainListOptions.vue';
import { Duration } from "luxon";

const currentStep = ref(1);
const currentStepStatus: Ref<"wait" | "error" | "finish" | "process"> = ref('process');
const allowedModes: Ref<string[]> = ref([]);
const includedOptions: Ref<string[]> = ref([]);
const readyToBuild = computed(() => !!unlockKey.value && allowedModes.value?.length > 0);

const allowList: Ref<string[]> = ref([]);
const forceList: Ref<string[]> = ref([]);

const unlockKey: Ref<string> = ref('');
const currentOverride: Ref<IOverride|undefined> = ref(undefined);
const enableMinTime: Ref<boolean> = ref(false);
const minTime: Ref<{days: number, hours: number, minutes: number}> = ref({days: 0, hours: 0, minutes: 0});

const handleButtonClick = () => {
    currentStep.value = currentStep.value + 1
};

const onUpdateIncludedOptions = (value: (string | number)[]) => {
    if (!value.includes('video')) {
        overridePreferences.value.videoCensorLevel = undefined;
        overridePreferences.value.videoCensorMode = undefined;
    }
    if (!value.includes('errorMode')) {
        overridePreferences.value.errorMode = undefined;
    }
}

const buildOverride = async () => {
    if (includedOptions.value.includes('domainLists')) {
        overridePreferences.value.allowList = allowList?.value;
        overridePreferences.value.forceList = forceList?.value;
    }
    
    overridePreferences.value.autoAnimate = false;
    const override = OverrideService.createOverride(unlockKey.value, allowedModes.value as OperationMode[], overridePreferences.value);
    if (enableMinTime.value) {
        const dur = Duration.fromObject(minTime.value);
        if (dur && dur.minutes > 0) {
            override.minimumTime = dur.minutes;
        }
    }
    currentOverride.value = override;
}

const exportOverride = async () => {
    OverrideService.exportOverride(currentOverride.value!);
}

const overridePreferences: Ref<Partial<IPreferences>> = ref({
    covered: defaultPrefs.covered,
    exposed: defaultPrefs.exposed,
    otherCensoring: defaultPrefs.otherCensoring,
    obfuscateImages: false
});

</script>

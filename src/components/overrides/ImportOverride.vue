<template>
  <n-space vertical>
    <n-card :segmented="{
      content: 'soft',
      footer: 'soft'
    }"
    v-if="!loadedOverride">
      <n-space vertical>
        <n-thing title="Import Override File">
          <n-text tag="p">You can import an existing override here to create a new override based on it. If it's valid, you can create a new override based on the preferences specified in the imported override. The new override will have a new key and you can customise the settings or requirements of the new override without affecting the original.</n-text>
          <template #action>
            <n-button @click="importOverride">Import Override File</n-button>
          </template>
        </n-thing>
      </n-space>
    </n-card>
    <Suspense>
      <template #fallback>
        Loading...
      </template>
      <create-override v-if="loadedOverride" :override="loadedOverride" :skip-intro="true" />
    </Suspense>
  </n-space>
</template>
<script setup lang="ts">
import { IExtensionPreferences, IOverride } from '@/preferences';
import { useNotification, NCard, NSpace, NButton, NText, NThing} from "naive-ui";
import { Ref, ref, Suspense } from 'vue';
import CreateOverride from "./CreateOverride.vue";
import { overrideFileType, useOverrideStore } from '@/stores';
import { dbg } from '@/util';
import { services } from "@silveredgold/beta-shared-components";
const { FileSystemClient } = services;

const store = useOverrideStore();
const notif = useNotification();

const loadedOverride: Ref<IOverride<IExtensionPreferences> | undefined> = ref(undefined);

const importOverride = async () => {
  const fs = new FileSystemClient();
  const file = await fs.getFile(overrideFileType);
  dbg('got file import result from override');
  const text = await file.file.text();
  const override = JSON.parse(text) as IOverride<IExtensionPreferences>;
  const valid = store.validateOverride(override);
  if (valid) {
    notif?.success({
      content: 'Successfully loaded preferences',
      meta: 'Loaded preferences from override into new override. Follow the wizard to create your new override',
      duration: 5000,
      closable: true
    });
    loadedOverride.value = override;
  } else {
    notif?.warning({
      content: 'Could not load override',
      meta: 'The override file is invalid and cannot be used. Create a new override, or load another override file.',
      duration: 5000,
      closable: true
    });
  }
}


</script>

<template>
  <locked-option v-if="!enabled" :title="title" />
  <template v-if="enabled">
    <Suspense>
      <slot></slot>
    </Suspense>
  </template>
</template>
<script setup lang="ts">import { computed, toRefs } from 'vue';
import LockedOption from './LockedOption.vue';


interface Props {
  locked?: boolean|undefined,
  option?: any,
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  locked: undefined,
  option: undefined
});

const { locked, option, title } = toRefs(props);

const enabled = computed(() => locked?.value === undefined ? option?.value === undefined : !locked.value);
</script>
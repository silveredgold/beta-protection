<template>
  <Suspense>
    <template #fallback>
      Loading...
    </template>
    <component :is="targetComponent"></component>
  </Suspense>
</template>

<script setup lang="ts">
import { Component, toRefs } from 'vue';

const props = defineProps<{
  component: Component
}>();

const { component: targetComponent } = toRefs(props);

</script>
<style>
html {
  max-width: 800px;
  height: 800px;
  padding: 1.5rem;
  margin-left: auto;
  margin-right: auto;
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
}
</style>

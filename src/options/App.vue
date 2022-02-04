<template>
  <hello-world />
</template>

<script>
import HelloWorld from '@/components/HelloWorld.vue';

export default {
  name: 'App',
  components: { HelloWorld },
};
</script>

<style>
html {
  width: 400px;
  height: 400px;
}

/* purgecss start ignore */
@tailwind base;
@tailwind components;
/* purgecss end ignore */

@tailwind utilities;
</style>

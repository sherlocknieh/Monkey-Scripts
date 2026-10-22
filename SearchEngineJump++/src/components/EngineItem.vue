<script setup>
defineProps({
  engine: { type: Object, required: true },
  showIcon: { type: Boolean, default: true },
});

const emit = defineEmits(['jump']);
</script>

<template>
  <a class="sej-engine" @click.prevent.stop="emit('jump', engine)">
    <img
      v-if="showIcon && engine.favicon"
      class="sej-engine-icon"
      :src="engine.favicon"
      alt=""
    />
    <span>{{ engine.name }}</span>
  </a>
</template>

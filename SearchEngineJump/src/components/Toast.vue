<script setup>
import { ui } from '../stores/ui.js';
</script>

<template>
  <div
    id="iqixn-global-tip"
    :style="{ opacity: ui.toastVisible ? 1 : 0 }"
  >
    {{ ui.toastText }}
  </div>
</template>

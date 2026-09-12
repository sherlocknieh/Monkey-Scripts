<script setup>
import { computed, ref } from 'vue';
import { SETTING } from '../data/icons.js';
import { useSettings } from '../stores/settings.js';
import { openSettingPanel } from '../stores/ui.js';

const settings = useSettings();
const hovering = ref(false);
const opacity = computed(() => Number(settings.settingData.setBtnOpacity));
</script>

<template>
  <span
    v-if="opacity >= 0"
    id="setBtn"
    title="设置菜单"
    :style="{ opacity: hovering ? 1 : opacity }"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
    @click="openSettingPanel"
    v-html="SETTING"
  ></span>
</template>

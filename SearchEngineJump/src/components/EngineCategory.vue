<script setup>
import { nextTick, ref } from 'vue';
import { getDropRoot } from '../core/shadow.js';
import EngineItem from './EngineItem.vue';

const props = defineProps({
  name: { type: String, required: true },
  engines: { type: Array, required: true },
  iconMode: { type: Number, default: 1 },
  allOpen: { type: Boolean, default: false },
});

const emit = defineEmits(['jump', 'jumpAll']);

const dropRoot = getDropRoot();
const triggerEl = ref(null);
const listEl = ref(null);
const shown = ref(false);
const active = ref(false);
const top = ref('0px');
const left = ref('0px');

const SHOW_DELAY = 233;
const HIDE_DELAY = 233;
let showTimer = null;
let hideTimer = null;

function position() {
  if (!triggerEl.value || !listEl.value) return;
  const rect = triggerEl.value.getBoundingClientRect();
  const listWidth = listEl.value.getBoundingClientRect().width;
  top.value = rect.bottom + 'px';
  left.value = rect.left - (listWidth - rect.width) / 2 + 'px';
}

function show() {
  clearTimeout(hideTimer);
  if (shown.value) {
    active.value = true;
    return;
  }
  showTimer = setTimeout(async () => {
    shown.value = true;
    await nextTick();
    if (!triggerEl.value || !listEl.value) return;
    const rect = triggerEl.value.getBoundingClientRect();
    top.value = rect.bottom + 6 + 'px';
    const listWidth = listEl.value.getBoundingClientRect().width;
    left.value = rect.left - (listWidth - rect.width) / 2 + 'px';
    requestAnimationFrame(() => {
      active.value = true;
      position();
    });
  }, SHOW_DELAY);
}

function hide() {
  clearTimeout(showTimer);
  if (!shown.value) return;
  active.value = false;
  hideTimer = setTimeout(() => {
    shown.value = false;
  }, HIDE_DELAY);
}
</script>

<template>
  <span class="sej-category" @mouseenter="show" @mouseleave="hide">
    <a
      ref="triggerEl"
      class="sej-engine sej-drop-list-trigger"
      :class="{ 'sej-drop-list-trigger-shown': active }"
      @click.prevent.stop="allOpen ? $emit('jumpAll') : $emit('jump', engines[0])"
    >
      <img
        v-if="iconMode && engines[0].favicon"
        class="sej-engine-icon"
        :src="engines[0].favicon"
        alt=""
      />
      <span>{{ name }}</span>
    </a>

    <Teleport :to="dropRoot">
      <div
        ref="listEl"
        class="sej-drop-list"
        :style="{
          display: shown ? 'block' : 'none',
          top,
          left,
          opacity: active ? 1 : 0.2,
          pointerEvents: active ? 'auto' : 'none',
        }"
        @mouseenter="show"
        @mouseleave="hide"
      >
        <EngineItem
          v-for="engine in engines"
          :key="engine.name + engine.url"
          :engine="engine"
          @jump="$emit('jump', $event)"
        />
      </div>
    </Teleport>
  </span>
</template>

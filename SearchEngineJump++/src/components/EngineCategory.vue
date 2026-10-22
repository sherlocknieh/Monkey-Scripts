<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
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

const SHOW_DELAY = 60;
const HIDE_DELAY = 0;
let showTimer = null;
let hideTimer = null;

const pointer = { x: -1, y: -1 };

function hitTest(el) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    pointer.x >= rect.left &&
    pointer.x <= rect.right &&
    pointer.y >= rect.top &&
    pointer.y <= rect.bottom
  );
}

function measureAndPosition() {
  if (!triggerEl.value || !listEl.value) return;
  const rect = triggerEl.value.getBoundingClientRect();
  const listRect = listEl.value.getBoundingClientRect();
  const listWidth = listRect.width;
  const listHeight = listRect.height;

  let posLeft = rect.left - (listWidth - rect.width) / 2;
  posLeft = Math.max(8, Math.min(posLeft, window.innerWidth - listWidth - 8));

  let posTop = rect.bottom;
  if (posTop + listHeight > window.innerHeight - 8 && rect.top - listHeight > 8) {
    posTop = rect.top - listHeight;
  }

  top.value = posTop + 'px';
  left.value = posLeft + 'px';
}

function show() {
  clearTimeout(hideTimer);
  if (shown.value) {
    active.value = true;
    return;
  }
  clearTimeout(showTimer);
  showTimer = setTimeout(async () => {
    if (!triggerEl.value) return;
    shown.value = true;
    await nextTick();
    measureAndPosition();
    active.value = true;
  }, SHOW_DELAY);
}

function scheduleHide() {
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    if (hitTest(triggerEl.value) || hitTest(listEl.value)) return;
    active.value = false;
    shown.value = false;
  }, HIDE_DELAY);
}

// 用指针坐标统一判定是否仍在触发器/子菜单范围内，
// 不依赖 enter/leave 事件顺序，避免间隙、裁剪或事件丢失导致误关闭
function onDocMouseMove(e) {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  if (!shown.value) return;

  if (hitTest(triggerEl.value) || hitTest(listEl.value)) {
    clearTimeout(hideTimer);
    active.value = true;
  } else {
    scheduleHide();
  }
}

onMounted(() => {
  document.addEventListener('mousemove', onDocMouseMove);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onDocMouseMove);
  clearTimeout(showTimer);
  clearTimeout(hideTimer);
});
</script>

<template>
  <span class="sej-category" @mouseenter="show" @mouseleave="scheduleHide">
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
          pointerEvents: shown ? 'auto' : 'none',
          transition: 'opacity 0.1s ease-out',
          zIndex: 100000000,
        }"
        @mouseenter="show"
        @mouseleave="scheduleHide"
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

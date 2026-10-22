<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { getFaviconSrc } from '../core/favicon.js';
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
const pinned = ref(false);
const top = ref('-10000px');
const left = ref('0px');

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

// 指针落在触发项与菜单之间的空隙时也保持展开，避免穿缝时闪断
function hitTestBridge() {
  const trigger = triggerEl.value;
  const list = listEl.value;
  if (!trigger || !list) return false;
  const t = trigger.getBoundingClientRect();
  const l = list.getBoundingClientRect();
  if (!l.width || !l.height) return false;
  const gapTop = Math.min(t.bottom, l.top);
  const gapBottom = Math.max(t.bottom, l.top);
  return (
    pointer.x >= Math.min(t.left, l.left) &&
    pointer.x <= Math.max(t.right, l.right) &&
    pointer.y >= gapTop &&
    pointer.y <= gapBottom
  );
}

function isPointerInside() {
  return hitTest(triggerEl.value) || hitTest(listEl.value) || hitTestBridge();
}

function measureAndPosition() {
  if (!triggerEl.value || !listEl.value) return;
  const rect = triggerEl.value.getBoundingClientRect();
  const listRect = listEl.value.getBoundingClientRect();
  const listWidth = listRect.width;
  const listHeight = listRect.height;
  const GAP = 6;

  let posLeft = rect.left - (listWidth - rect.width) / 2;
  posLeft = Math.max(8, Math.min(posLeft, window.innerWidth - listWidth - 8));

  let posTop = rect.bottom + GAP;
  if (
    posTop + listHeight > window.innerHeight - 8 &&
    rect.top - listHeight - GAP > 8
  ) {
    posTop = rect.top - listHeight - GAP;
  }

  top.value = posTop + 'px';
  left.value = posLeft + 'px';
}

async function show() {
  if (shown.value) {
    active.value = true;
    return;
  }
  if (!triggerEl.value) return;
  shown.value = true;
  await nextTick();
  if (!shown.value) return;
  measureAndPosition();
  active.value = true;
}

function scheduleHide() {
  if (pinned.value || isPointerInside()) return;
  active.value = false;
  shown.value = false;
}

function hide() {
  active.value = false;
  shown.value = false;
}

// 点击类别固定下拉面板，再次点击收起；固定后不再响应指针离开
function onTriggerClick() {
  if (pinned.value) {
    pinned.value = false;
    hide();
    return;
  }
  pinned.value = true;
  show();
  if (props.allOpen) emit('jumpAll');
}

function onEngineJump(engine) {
  pinned.value = false;
  hide();
  emit('jump', engine);
}

// 用指针坐标统一判定是否仍在触发器/子菜单范围内，
// 不依赖 enter/leave 事件顺序，避免间隙、裁剪或事件丢失导致误关闭
function onDocMouseMove(e) {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  if (!shown.value) return;

  if (pinned.value || isPointerInside()) {
    active.value = true;
  } else {
    scheduleHide();
  }
}

function onDocPointerDown(e) {
  if (!pinned.value) return;
  const path = e.composedPath ? e.composedPath() : [];
  if (path.includes(triggerEl.value) || path.includes(listEl.value)) return;
  pinned.value = false;
  hide();
}

onMounted(() => {
  document.addEventListener('mousemove', onDocMouseMove);
  document.addEventListener('pointerdown', onDocPointerDown);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onDocMouseMove);
  document.removeEventListener('pointerdown', onDocPointerDown);
});
</script>

<template>
  <span class="sej-category" @mouseenter="show" @mouseleave="scheduleHide">
    <a
      ref="triggerEl"
      class="sej-engine sej-drop-list-trigger"
      :class="{ 'sej-drop-list-trigger-shown': active }"
      aria-haspopup="true"
      :aria-expanded="shown"
      @click.prevent.stop="onTriggerClick"
    >
      <img
        v-if="iconMode && getFaviconSrc(engines[0])"
        class="sej-engine-icon"
        :src="getFaviconSrc(engines[0])"
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
          transition: 'opacity 0.06s ease-out',
          zIndex: 100000000,
        }"
        @mouseenter="show"
        @mouseleave="scheduleHide"
      >
        <EngineItem
          v-for="engine in engines"
          :key="engine.name + engine.url"
          :engine="engine"
          @jump="onEngineJump"
        />
      </div>
    </Teleport>
  </span>
</template>

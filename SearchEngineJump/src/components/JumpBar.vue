<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useSettings } from '../stores/settings.js';
import { isInlineStyleBlocked } from '../core/csp.js';
import { addStyle, getHost, insertHost } from '../core/shadow.js';
import {
  getInputTarget,
  getInsertTarget,
  getInsertPositionLabel,
  resolveRuleStyle,
  applyStylish,
} from '../core/rule.js';
import {
  extractKeyword,
  encodeKeyword,
  performJump,
  openAllEngines,
} from '../core/jump.js';
import EngineItem from './EngineItem.vue';
import EngineCategory from './EngineCategory.vue';
import SettingButton from './SettingButton.vue';

const settings = useSettings();
const data = settings.settingData;
const matchedRule = settings.getMatchedRule();
const inlineStyleBlocked = isInlineStyleBlocked();

const ready = ref(false);
const isSelectSearch = ref(false);
const selectionText = ref('');
const barVisible = ref(false);
const containerEl = ref(null);
const containerClass = ref('rwl-exempt');

let inputTarget = null;
let insertTarget = null;
let insertPosition = 'beforeend';
let resolvedStyle = '';
let originalContainerDistanceTop = 0;

const categories = computed(() =>
  data.engineDetails
    .filter(([, , enabled]) => enabled)
    .map(([name, key]) => ({
      name,
      key,
      engines: (data.engineList[key] || []).filter((engine) => {
        if (engine.disable) return false;
        if (data.HideTheSameLink && matchedRule?.url?.test(engine.url)) {
          return false;
        }
        return true;
      }),
    }))
    .filter((category) => category.engines.length),
);

function isFlatCategory(category) {
  return (
    !data.foldlist &&
    category.key === matchedRule?.engineList &&
    Array.isArray(category.engines)
  );
}

function getCurrentKeyword() {
  if (isSelectSearch.value) return selectionText.value;
  return extractKeyword(inputTarget);
}

function onJump(engine) {
  performJump(engine, getCurrentKeyword(), data, isSelectSearch.value);
}

function onJumpAll(engines) {
  const encoded = encodeKeyword(getCurrentKeyword(), engines[0]?.gbk);
  openAllEngines(engines, encoded, matchedRule);
}

function initTargets() {
  if (matchedRule?.enabled) {
    inputTarget = getInputTarget(matchedRule);
    insertTarget = getInsertTarget(matchedRule);
    insertPosition = getInsertPositionLabel(matchedRule) || 'beforeend';
    if (!inputTarget || !insertTarget) {
      console.warn(
        `[SEJ] 未找到输入框或插入位置，跳过初始化：\n输入框：${inputTarget}\n插入位置：${insertTarget}`,
      );
      return false;
    }
    return true;
  }

  if (data.selectSearch) {
    if (inlineStyleBlocked) {
      console.warn('[SEJ] 检测到 CSP 阻止内联样式，已禁用划词搜索模式');
      return false;
    }
    isSelectSearch.value = true;
    inputTarget = () => selectionText.value;
    insertTarget = document.body;
    insertPosition = 'beforeend';
    return true;
  }

  console.info('[SEJ] 未启用搜索跳转，跳过初始化');
  return false;
}

function injectHost() {
  if (isSelectSearch.value) {
    insertHost(document.body, 'beforeend');
    return;
  }

  insertHost(insertTarget, insertPosition);

  const needsWrapper =
    !resolvedStyle.includes('sticky') && !resolvedStyle.includes('fixed');
  if (needsWrapper && matchedRule?.wrapperClass) {
    getHost().className += ` ${matchedRule.wrapperClass}`;
  }
}

function fixedToTop(fixedTopValue, color) {
  if (!containerEl.value || inlineStyleBlocked) return;
  if (resolvedStyle.includes('sticky') || resolvedStyle.includes('fixed')) {
    return;
  }

  const fixedTop = fixedTopValue ? fixedTopValue : 0;
  const host = getHost();
  const container = containerEl.value;

  if (originalContainerDistanceTop - window.scrollY <= fixedTop) {
    if (host.style.position !== 'fixed') {
      host.dataset.originalLeft = container.getBoundingClientRect().left;
    }
    host.style.position = 'fixed';
    host.style.top = `${fixedTop}px`;
    host.style.left = `${host.dataset.originalLeft}px`;
    host.style.zIndex = '998';

    container.style.position = 'static';
    container.style.left = '0';
    container.style.top = '0';
    container.style.gridColumn = 'auto';
    container.style.padding = '0';
    container.style.margin = '0';
    container.style.backgroundColor = color;
  } else {
    host.style.position = '';
    host.style.top = '';
    host.style.left = '';
    host.style.zIndex = '';
    delete host.dataset.originalLeft;

    container.style.position = '';
    container.style.left = '';
    container.style.top = '';
    container.style.gridColumn = '';
    container.style.padding = '';
    container.style.margin = '';
    container.style.backgroundColor = '';
  }
}

function onScroll() {
  fixedToTop(matchedRule?.fixedTop, matchedRule?.fixedTopColor);
}

function onWheel(e) {
  if (e.wheelDelta > 0) {
    fixedToTop(matchedRule?.fixedTop, matchedRule?.fixedTopColor);
  }
}

function onSelectionChange() {
  if (inlineStyleBlocked) return;
  const selection = getSelection();
  if (selection.isCollapsed) {
    barVisible.value = false;
  } else {
    selectionText.value = selection.toString();
    barVisible.value = true;
  }
}

onMounted(async () => {
  if (!initTargets()) return;
  ready.value = true;

  if (matchedRule) {
    applyStylish(matchedRule);
    resolvedStyle = resolveRuleStyle(matchedRule, data) || '';
    if (matchedRule.class) {
      containerClass.value = `rwl-exempt ${matchedRule.class}`;
    }
  }

  await nextTick();
  injectHost();

  if (isSelectSearch.value) {
    document.addEventListener('selectionchange', onSelectionChange);
  }

  if (
    data.fixedTop &&
    matchedRule &&
    !inlineStyleBlocked &&
    !isSelectSearch.value
  ) {
    originalContainerDistanceTop =
      containerEl.value.getBoundingClientRect().top + window.scrollY;
    if (data.fixedTopUpward) {
      window.addEventListener('wheel', onWheel);
    } else {
      window.addEventListener('scroll', onScroll);
    }
  }

  if (
    !inlineStyleBlocked &&
    containerEl.value &&
    getComputedStyle(containerEl.value).position !== 'sticky' &&
    !isSelectSearch.value &&
    !resolvedStyle.includes('sticky') &&
    !resolvedStyle.includes('fixed')
  ) {
    const style = getComputedStyle(containerEl.value);
    const height =
      containerEl.value.offsetHeight +
      parseFloat(style.marginTop) +
      parseFloat(style.marginBottom) +
      'px';
    getHost().style.height = height;
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', onSelectionChange);
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('wheel', onWheel);
});
</script>

<template>
  <div
    v-if="ready"
    ref="containerEl"
    id="sej-container"
    :class="[containerClass, { selectSearch: isSelectSearch }]"
    :style="
      isSelectSearch ? { top: barVisible ? '2px' : '-50px' } : undefined
    "
  >
    <template v-for="category in categories" :key="category.key">
      <template v-if="isFlatCategory(category) || inlineStyleBlocked">
        <span v-if="inlineStyleBlocked" class="sej-category-title">
          {{ category.name }}
        </span>
        <EngineItem
          v-for="engine in category.engines"
          :key="engine.url + engine.name"
          :engine="engine"
          @jump="onJump"
        />
      </template>
      <EngineCategory
        v-else
        :name="category.name"
        :engines="category.engines"
        :icon-mode="data.icon"
        :all-open="data.allOpen"
        @jump="onJump"
        @jump-all="onJumpAll(category.engines)"
      />
    </template>

    <SettingButton />
  </div>
</template>

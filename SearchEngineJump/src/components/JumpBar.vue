<script setup>
import { computed } from 'vue';
import { useSettings } from '../stores/settings.js';

const settings = useSettings();
const data = settings.settingData;

const categories = computed(() =>
  data.engineDetails
    .filter(([, , enabled]) => enabled)
    .map(([name, key]) => ({
      name,
      key,
      engines: data.engineList[key] || [],
    })),
);

const matchedRule = settings.getMatchedRule();
</script>

<template>
  <div id="sej-container-wrapper">
    <div id="sej-container">
      <span class="sej-category-title" title="Vue 骨架占位，后续替换为正式跳转条">
        SEJ 骨架
      </span>
      <span
        v-for="category in categories"
        :key="category.key"
        class="sej-engine sej-category"
      >
        {{ category.name }} ({{ category.engines.length }})
      </span>
    </div>
  </div>
  <p v-if="matchedRule" class="sej-matched-rule">
    匹配规则：{{ matchedRule.name }}
  </p>
</template>

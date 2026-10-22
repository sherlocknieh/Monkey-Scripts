<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue';
import { embedFavicon } from '../core/favicon.js';

const props = defineProps({
  mode: { type: String, default: 'add' },
  initial: { type: Object, default: () => ({}) },
  resolveIcon: { type: Function, required: true },
  busy: { type: Boolean, default: false },
});

const emit = defineEmits(['submit', 'cancel']);

const form = reactive({
  name: props.initial.name || '',
  url: props.initial.url || '',
  favicon: props.initial.favicon || '',
  blank: Boolean(props.initial.blank),
  gbk: Boolean(props.initial.gbk),
});

const titleInput = ref(null);
const initialFavicon = (props.initial.favicon || '').trim();

const previewData = ref('');
const previewLoading = ref(false);
const previewFailed = ref(false);
const previewCache = new Map();
let previewToken = 0;

const dataIconLink = computed(() => previewData.value);
const canPreview = computed(() => /^(https?:\/\/|data:)/i.test(form.favicon.trim()));

// 输入变化时清空旧预览，避免 data 链接与当前地址不对应
watch(
  () => form.favicon,
  (value) => {
    previewToken++;
    const url = value.trim();
    previewLoading.value = false;
    previewFailed.value = false;
    if (/^data:/i.test(url)) {
      previewData.value = url;
      return;
    }
    if (url === initialFavicon && props.initial.faviconData) {
      previewData.value = props.initial.faviconData;
      return;
    }
    previewData.value = '';
  },
  { immediate: true },
);

async function previewIcon() {
  if (props.busy || previewLoading.value) return;
  const url = form.favicon.trim();
  if (/^data:/i.test(url)) {
    previewData.value = url;
    previewFailed.value = false;
    return;
  }
  if (!/^https?:\/\//i.test(url)) return;
  if (url === initialFavicon && props.initial.faviconData) {
    previewData.value = props.initial.faviconData;
    return;
  }
  if (previewCache.has(url)) {
    previewData.value = previewCache.get(url);
    previewFailed.value = false;
    return;
  }

  const token = ++previewToken;
  previewData.value = '';
  previewFailed.value = false;
  previewLoading.value = true;
  const result = await embedFavicon(url);
  if (token !== previewToken) return;
  previewLoading.value = false;
  if (result !== url) {
    previewData.value = result;
    previewCache.set(url, result);
  } else {
    previewFailed.value = true;
  }
}

onMounted(() => titleInput.value?.focus());

onBeforeUnmount(() => {
  previewToken++;
});

function submit() {
  if (props.busy) return;
  emit('submit', {
    name: form.name,
    url: form.url.indexOf('://') === -1 ? 'https://' + form.url : form.url,
    favicon: form.favicon || props.resolveIcon(form.url),
    // 转换中的旧结果不能用于新链接，交给保存流程重新抓取
    faviconData: previewLoading.value ? '' : previewData.value,
    blank: form.blank,
    gbk: form.gbk,
  });
}
</script>

<template>
  <div id="newSearchBox">
    <div class="sej-dialog-title">
      {{ mode === 'edit' ? '编辑搜索引擎' : '添加搜索引擎' }}
    </div>
    <label class="sej-field">
      <span>标题</span>
      <input ref="titleInput" v-model="form.name" placeholder="必填" :disabled="busy" />
    </label>
    <label class="sej-field">
      <span>链接</span>
      <input v-model="form.url" placeholder="必填" :disabled="busy" />
    </label>
    <div class="sej-field">
      <span>图标</span>
      <div class="sej-field-row">
        <input v-model="form.favicon" placeholder="选填，原始链接，保存时自动内嵌" :disabled="busy" />
        <button type="button" class="sej-icon-preview-btn"
          :disabled="busy || previewLoading || !canPreview" @click="previewIcon">
          {{ previewLoading ? '转换中…' : '预览' }}
        </button>
      </div>
    </div>
    <div class="sej-field">
      <span>data 链接</span>
      <div class="sej-data-line">
        <img v-if="previewData" class="sej-icon-preview" :src="previewData" alt="" />
        <span v-if="dataIconLink" class="sej-field-data" :title="dataIconLink">{{ dataIconLink }}</span>
        <span v-else-if="previewLoading" class="sej-field-value">转换中…</span>
        <span v-else-if="previewFailed" class="sej-field-value">转换失败（保存时会重试）</span>
        <span v-else class="sej-field-value">无（点击“预览”后转换）</span>
      </div>
    </div>
    <label class="sej-field">
      <span>打开方式</span>
      <select id="iqxin-newTarget" v-model="form.blank" :disabled="busy">
        <option :value="true">新标签页打开</option>
        <option :value="false">当前页打开</option>
      </select>
    </label>
    <label v-if="mode === 'edit'" class="sej-field-inline">
      <input v-model="form.gbk" type="checkbox" :disabled="busy" />
      <span>GBK 编码</span>
    </label>
    <div class="sej-dialog-actions">
      <button class="addItemBoxBtn iqxin-closeBtn" :disabled="busy" @click="$emit('cancel')">
        取消
      </button>
      <button class="addItemBoxBtn iqxin-enterBtn" :disabled="busy" @click="submit">
        {{ busy ? '获取图标中…' : '确定' }}
      </button>
    </div>
  </div>
</template>

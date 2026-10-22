<script setup>
import { reactive, onMounted, ref } from 'vue';

const props = defineProps({
  mode: { type: String, default: 'add' },
  initial: { type: Object, default: () => ({}) },
  resolveIcon: { type: Function, required: true },
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

onMounted(() => titleInput.value?.focus());

function submit() {
  emit('submit', {
    name: form.name,
    url: form.url.indexOf('://') === -1 ? 'https://' + form.url : form.url,
    favicon: form.favicon || props.resolveIcon(form.url),
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
      <input ref="titleInput" v-model="form.name" placeholder="必填" />
    </label>
    <label class="sej-field">
      <span>链接</span>
      <input v-model="form.url" placeholder="必填" />
    </label>
    <label class="sej-field">
      <span>图标</span>
      <input v-model="form.favicon" placeholder="选填，留空则自动获取" />
    </label>
    <label class="sej-field">
      <span>打开方式</span>
      <select id="iqxin-newTarget" v-model="form.blank">
        <option :value="true">新标签页打开</option>
        <option :value="false">当前页打开</option>
      </select>
    </label>
    <label v-if="mode === 'edit'" class="sej-field-inline">
      <input v-model="form.gbk" type="checkbox" />
      <span>GBK 编码</span>
    </label>
    <div class="sej-dialog-actions">
      <button class="addItemBoxBtn iqxin-closeBtn" @click="$emit('cancel')">
        取消
      </button>
      <button class="addItemBoxBtn iqxin-enterBtn" @click="submit">
        确定
      </button>
    </div>
  </div>
</template>

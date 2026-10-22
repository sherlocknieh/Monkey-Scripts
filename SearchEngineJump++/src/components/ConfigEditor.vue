<script setup>
import { ref } from 'vue';
import { GM_setClipboard } from '$';

const props = defineProps({
  initialText: { type: String, default: '' },
});

const emit = defineEmits(['save', 'reset', 'close', 'copy']);

const text = ref(props.initialText);

function copy() {
  GM_setClipboard(text.value);
  emit('copy');
}
</script>

<template>
  <div id="iqxin-editCodeBox">
    <p>
      <span class="iqxin-warning">! ! !</span><br />
      此处有更多的设置选项,自由度更高,<br />
      但设置错误会导致脚本无法运行
    </p>
    <textarea v-model="text" wrap="off" cols="45" rows="20"></textarea>
    <div class="sej-dialog-actions">
      <button @click="$emit('reset')">恢复默认</button>
      <button @click="copy">复制</button>
      <button class="iqxin-closeBtn" @click="$emit('close')">关闭</button>
      <button class="iqxin-enterBtn" @click="$emit('save', text)">保存</button>
    </div>
  </div>
</template>

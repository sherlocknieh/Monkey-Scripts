<script setup>
import { onMounted, ref } from 'vue';

const emit = defineEmits(['submit', 'cancel']);

const name = ref('');
const innerName = ref('user' + new Date().getTime());
const nameInput = ref(null);

onMounted(() => nameInput.value?.focus());

function submit() {
  if (!innerName.value) {
    alert('内部名称不能为空');
    return;
  }
  emit('submit', {
    name: name.value || innerName.value,
    innerName: innerName.value,
  });
}
</script>

<template>
  <div id="newSearchListBox">
    <span>列表名称: </span>
    <input ref="nameInput" v-model="name" />
    <br /><br />
    <span>内部名称: </span>
    <input v-model="innerName" />
    <br /><br />
    <button class="addItemBoxBtn iqxin-enterBtn" @click="submit">确定</button>
    &nbsp;&nbsp;&nbsp;
    <button class="addItemBoxBtn iqxin-closeBtn" @click="$emit('cancel')">
      取消
    </button>
  </div>
</template>

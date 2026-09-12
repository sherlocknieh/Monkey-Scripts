<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
} from 'vue';
import { GM_deleteValue } from '$';
import { useSettings, STORAGE_KEY } from '../stores/settings.js';
import { getValue, setValue } from '../core/storage.js';
import { closeSettingPanel, showToast } from '../stores/ui.js';
import { EDIT, DEL } from '../data/icons.js';
import EngineEditDialog from './EngineEditDialog.vue';
import CategoryEditDialog from './CategoryEditDialog.vue';
import ConfigEditor from './ConfigEditor.vue';

const settings = useSettings();
const source = settings.settingData;

const OPTION_KEYS = [
  'status',
  'message',
  'version',
  'addSearchItems',
  'modifySearchItems',
  'closeBtn',
  'newtab',
  'foldlist',
  'setBtnOpacity',
  'debug',
  'fixedTop',
  'fixedTopUpward',
  'baiduOffset',
  'getIcon',
  'allOpen',
  'HideTheSameLink',
  'center',
  'icon',
  'transtion',
  'selectSearch',
];

let uid = 1;
const nextId = () => uid++;

function makeDraft() {
  const raw = JSON.parse(JSON.stringify(source));
  const d = {};
  for (const key of OPTION_KEYS) d[key] = raw[key];
  d.setBtnOpacity = Number(raw.setBtnOpacity);
  d.categories = raw.engineDetails.map(([name, key, enabled]) => ({
    _id: nextId(),
    name,
    key,
    enabled: Boolean(enabled),
    engines: (raw.engineList[key] || []).map((engine) => ({
      ...engine,
      _id: nextId(),
    })),
  }));
  return d;
}

const draft = reactive(makeDraft());
const layerEl = ref(null);
const maskVisible = ref(false);
const layerStyle = ref({});
const addDelMode = ref(false);
const moreOpen = ref(false);
const editingCategory = ref(-1);
const engineDialog = ref(null);
const categoryDialog = ref(false);
const configOpen = ref(false);
const online = ref(false);

const editIcon = EDIT;
const delIcon = DEL;

const opacityValue = computed(() => Math.abs(Number(draft.setBtnOpacity)));
const opacityLabel = computed(() => {
  if (Number(draft.setBtnOpacity) < 0) return '禁用';
  return opacityValue.value.toFixed(2);
});
const configText = computed(() => {
  const clean = JSON.parse(JSON.stringify(source));
  if (clean.engineList) delete clean.engineList.engineCategories;
  return JSON.stringify(clean, null, 4);
});

function onOpacityInput(e) {
  const value = Number(e.target.value);
  draft.setBtnOpacity = Number(draft.setBtnOpacity) < 0 ? -value : value;
}

function toggleBtnDisabled() {
  draft.setBtnOpacity = -Number(draft.setBtnOpacity);
}

function buildResult() {
  const result = {};
  for (const key of OPTION_KEYS) result[key] = draft[key];
  result.engineDetails = draft.categories.map((cat) => [
    cat.name,
    cat.key,
    cat.enabled,
  ]);
  result.engineList = {};
  for (const cat of draft.categories) {
    result.engineList[cat.key] = cat.engines.map((engine) => {
      const item = {
        name: engine.name,
        url: engine.url,
        favicon: engine.favicon,
      };
      if (engine.blank) item.blank = '_blank';
      if (engine.disable) item.disable = true;
      if (engine.gbk) item.gbk = true;
      return item;
    });
  }
  return result;
}

function save() {
  const stored = getValue(STORAGE_KEY, {}) || {};
  const merged = Object.assign({}, stored, buildResult());
  setValue(STORAGE_KEY, merged);
  showToast('保存成功');
  setTimeout(() => location.reload(), 300);
}

function reset() {
  if (confirm('将会删除用户设置！')) {
    GM_deleteValue(STORAGE_KEY);
    location.reload();
  }
}

function close() {
  maskVisible.value = false;
  setTimeout(closeSettingPanel, 300);
}

function toggleAddDel() {
  addDelMode.value = !addDelMode.value;
}

function toggleCategory(index) {
  const category = draft.categories[index];
  category.enabled = !category.enabled;
  showToast(category.enabled ? '启用' : '禁用');
}

function toggleEngine(ci, ei) {
  const engine = draft.categories[ci].engines[ei];
  engine.disable = !engine.disable;
  showToast(engine.disable ? '禁用' : '启用');
}

function deleteCategory(index) {
  draft.categories.splice(index, 1);
}

function deleteEngine(ci, ei) {
  draft.categories[ci].engines.splice(ei, 1);
}

function startRenameCategory(index) {
  editingCategory.value = index;
}

function finishRenameCategory(index, e) {
  if (editingCategory.value !== index) return;
  const value = e.target.value.trim();
  draft.categories[index].name = value || '空';
  editingCategory.value = -1;
}

function cancelRenameCategory() {
  editingCategory.value = -1;
}

const dragCtx = ref(null);

function moveArray(arr, from, to) {
  const [item] = arr.splice(from, 1);
  arr.splice(to, 0, item);
}

function onDragStart(e, type, ci, ei) {
  dragCtx.value = { type, ci, ei };
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', '');
}

function onDrop(e, type, ci, ei) {
  e.preventDefault();
  const ctx = dragCtx.value;
  dragCtx.value = null;
  if (!ctx || ctx.type !== type) return;

  if (type === 'category') {
    if (ctx.ci === ci) return;
    moveArray(draft.categories, ctx.ci, ci);
  } else {
    if (ctx.ci !== ci || ctx.ei === ei) return;
    moveArray(draft.categories[ci].engines, ctx.ei, ei);
  }
}

function addEngine(ci) {
  engineDialog.value = { mode: 'add', ci, initial: {} };
}

function editEngine(ci, ei) {
  engineDialog.value = {
    mode: 'edit',
    ci,
    ei,
    initial: { ...draft.categories[ci].engines[ei] },
  };
}

function submitEngine(engine) {
  const ctx = engineDialog.value;
  if (!ctx) return;
  if (!engine.name || !engine.url) {
    alert('标题和链接必填');
    return;
  }
  const list = draft.categories[ctx.ci].engines;
  if (ctx.mode === 'add') {
    list.push({ ...engine, _id: nextId() });
  } else {
    list[ctx.ei] = { ...list[ctx.ei], ...engine };
  }
  engineDialog.value = null;
}

function openCategoryDialog() {
  categoryDialog.value = true;
}

function submitCategory({ name, innerName }) {
  draft.categories.push({
    _id: nextId(),
    name,
    key: innerName,
    enabled: true,
    engines: [],
  });
  categoryDialog.value = false;
}

function isOnline() {
  if (online.value) return;
  const img = new Image();
  img.src =
    'https://www.google.com/s2/favicons?domain=www.baidu.com&' + Math.random();
  setTimeout(() => {
    if (img.width) online.value = true;
    else img.src = undefined;
  }, 2000);
}

function getICON(olink) {
  const link = olink || '';
  let protocol;
  let host;
  if (link.indexOf('://') !== -1) {
    protocol = link.split('://')[0] || 'https';
    host = link.split('://')[1].split('/')[0];
  } else {
    protocol = 'https';
    host = link.split('/')[0];
  }
  const siteURL = protocol + '://' + host;
  const iconSetting = settings.settingData.getIcon;
  let ourl;

  if (isNaN(iconSetting)) {
    ourl = iconSetting;
  } else {
    const mark = parseInt(iconSetting);
    if (mark === 1) ourl = siteURL + '/favicon.ico';
    else if (mark === 2) {
      ourl = 'https://www.google.com/s2/favicons?domain=' + siteURL;
    } else if (mark === 3) {
      ourl = 'https://statics.dnspod.cn/proxy_favicon/_/favicon?domain=' + host;
    }
  }

  if (ourl) return ourl.replace('%s', siteURL);
  if (online.value) return 'https://www.google.com/s2/favicons?domain=' + host;
  return protocol + '://' + host + '/favicon.ico';
}

function openConfig() {
  configOpen.value = true;
}

function saveConfig(text) {
  if (text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      alert('JSON 解析失败');
      return;
    }
    setValue(STORAGE_KEY, parsed);
    location.reload();
  } else {
    reset();
  }
}

const dragging = ref(false);
let dragOffset = { x: 0, y: 0 };

function onDragMove(e) {
  layerStyle.value = {
    left: e.clientX - dragOffset.x + 'px',
    top: e.clientY - dragOffset.y + 'px',
    margin: 0,
  };
}

function stopDrag() {
  dragging.value = false;
  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', stopDrag);
}

function startDrag(e) {
  const el = layerEl.value;
  dragOffset = { x: e.clientX - el.offsetLeft, y: e.clientY - el.offsetTop };
  dragging.value = true;
  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', stopDrag);
}

onMounted(() => {
  document.body.style.overflow = 'hidden';
  isOnline();
  nextTick(() => {
    maskVisible.value = true;
  });
});

onBeforeUnmount(() => {
  document.body.style.overflow = 'auto';
  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', stopDrag);
});
</script>

<template>
  <div
    id="settingLayerMask"
    :style="{ display: 'flex', opacity: maskVisible ? 1 : 0 }"
    @click.self="close"
  >
    <div
      id="settingLayer"
      ref="layerEl"
      :style="[
        { transform: maskVisible ? 'none' : 'translateY(-20%)' },
        layerStyle,
      ]"
      @click.stop
    >
      <div
        id="dragDom"
        style="
          height: 16px;
          width: 97%;
          position: absolute;
          top: 0;
          cursor: move;
        "
        @mousedown="startDrag"
      ></div>

      <div id="sej-settings-body">
        <div
        v-for="(category, ci) in draft.categories"
        :id="category.key"
        :key="category._id"
        class="iqxin-items"
      >
        <div
          class="sejtitle drag"
          draggable="true"
          :data-xin="category.enabled ? 1 : -1"
          :data-iqxintitle="category.key"
          @dragstart="onDragStart($event, 'category', ci)"
          @dragover.prevent
          @drop="onDrop($event, 'category', ci)"
          @click="toggleCategory(ci)"
        >
          <input
            v-if="editingCategory === ci"
            id="titleEdit"
            type="text"
            :value="category.name"
            @click.stop
            @keydown.enter="finishRenameCategory(ci, $event)"
            @keydown.esc="cancelRenameCategory"
            @blur="finishRenameCategory(ci, $event)"
          />
          <span v-else class="iqxin-pointer-events">{{ category.name }}</span>
          <span
            class="iqxin-title-edit"
            title="编辑 Edit"
            @click.stop="startRenameCategory(ci)"
          >
            <img class="sej-engine-icon" :src="editIcon" alt="" />
          </span>
          <span
            class="iqxin-set-title-del"
            :class="{ 'iqxin-set-active': addDelMode }"
            title="删除 Delete"
            @click.stop="deleteCategory(ci)"
          >
            <img class="sej-engine-icon" :src="delIcon" alt="" />
          </span>
        </div>

        <div class="sejcon">
          <span
            v-for="(engine, ei) in category.engines"
            :key="engine._id"
            class="drag"
            draggable="true"
            @dragstart="onDragStart($event, 'engine', ci, ei)"
            @dragover.prevent
            @drop="onDrop($event, 'engine', ci, ei)"
          >
            <span
              class="sej-engine"
              :data-iqxintitle="engine.name"
              :data-iqxinimg="engine.favicon"
              :data-iqxinlink="engine.url"
              :data-iqxintarget="engine.blank ? '_blank' : null"
              :data-iqxindisabled="engine.disable ? 'true' : null"
              :data-iqxingbk="engine.gbk ? 'true' : null"
              @click="toggleEngine(ci, ei)"
            >
              <img class="sej-engine-icon" :src="engine.favicon" alt="" />
              <span>{{ engine.name }}</span>
            </span>
            <span
              class="iqxin-set-edit"
              title="编辑 Edit"
              @click.stop="editEngine(ci, ei)"
            >
              <img class="sej-engine-icon" :src="editIcon" alt="" />
            </span>
            <span
              class="iqxin-set-del"
              :class="{ 'iqxin-set-active': addDelMode }"
              title="删除 Delete"
              @click.stop="deleteEngine(ci, ei)"
            >
              <img class="sej-engine-icon" :src="delIcon" alt="" />
            </span>
          </span>
          <span
            class="iqxin-additem"
            :class="{ 'iqxin-set-active': addDelMode }"
            @click.stop="addEngine(ci)"
            >+</span
          >
        </div>
      </div>
      </div>

      <div id="btnEle2" :class="{ btnEle2active: moreOpen }">
        <div>
          <span id="xin-reset" title="慎点,出厂重置" @click="reset">
            清空设置
          </span>
          <span id="xin-modification" title="配置文件" @click="openConfig">
            配置文件
          </span>
          <span id="xin-selectSearch" title="划词搜索">
            <label
              >划词搜索<input type="checkbox" v-model="draft.selectSearch"
            /></label>
          </span>
          <span id="xin-transtion" title="动画">
            <label>动画<input type="checkbox" v-model="draft.transtion" /></label>
          </span>
          <span id="xin-foldlists" title="折叠当前搜索分类">
            <label
              >折叠当前搜索分类<input
                type="checkbox"
                v-model="draft.foldlist"
            /></label>
          </span>
          <span id="iqxin-fixedTopS" title="固定到顶端">
            <label
              >固定到顶端<input type="checkbox" v-model="draft.fixedTop"
            /></label>
          </span>
          <span id="iqxin-fixedTopUpward" title="仅上拉显示">
            <label
              >仅上拉显示<input
                type="checkbox"
                v-model="draft.fixedTopUpward"
            /></label>
          </span>
          <span id="xin-HideTheSameLink" title="隐藏同站链接">
            <label
              >隐藏同站链接<input
                type="checkbox"
                v-model="draft.HideTheSameLink"
            /></label>
          </span>
          <span id="xin-setBtnOpacity" title="设置按钮透明度">
            设置按钮透明度
            <input
              id="setBtnOpacityRange"
              type="range"
              step="0.05"
              min="0"
              max="1"
              :value="opacityValue"
              @input="onOpacityInput"
            />
            <i class="iqxin-setBtnOpacityRangeValue" @click="toggleBtnDisabled">
              {{ opacityLabel }}
            </i>
          </span>
        </div>
      </div>

      <div id="btnEle">
        <div class="btnEleLayer">
          <span class="feedback" title="在 GreasyFork 进行反馈">
            <a
              target="_blank"
              href="https://greasyfork.org/en/scripts/454280-searchenginejumpplus"
              >Greasy Fork</a
            >
          </span>
          <span class="feedback" title="在 Github 进行反馈">
            <a
              target="_blank"
              href="https://github.com/MUTED64/SearchEngineJumpPlus"
              >GitHub</a
            >
          </span>
          <span id="xin-allOpen" title="后台打开该搜索分类的所有网站">
            <label>一键搜索<input type="checkbox" v-model="draft.allOpen" /></label>
          </span>
          <span id="xin-centerDisplay" title="居中显示">
            居中：
            <select v-model.number="draft.center">
              <option :value="0">默认</option>
              <option :value="1">强制</option>
              <option :value="2">自动</option>
            </select>
          </span>
          <span id="xin-newtab" title="是否采用新标签页打开">
            打开方式：
            <select v-model.number="draft.newtab">
              <option :value="0">默认页面</option>
              <option :value="1">新标签页</option>
            </select>
          </span>
          <span
            id="xin-addDel"
            title="增加新的或者删除现有的搜索"
            :class="{ 'iqxin-btn-active': addDelMode }"
            @click="toggleAddDel"
            >增加 / 删除</span
          >
          <span
            id="moreSet"
            title="more set"
            :class="{ 'iqxin-btn-active': moreOpen }"
            @click="moreOpen = !moreOpen"
            >更多设置</span
          >
          <span id="xin-save" title="save & close" @click="save">保存并关闭</span>
        </div>
      </div>

      <span
        id="nSearchList"
        :class="{ 'iqxin-set-active': addDelMode }"
        style="
          position: absolute;
          bottom: 10%;
          right: 5%;
          padding: 5px 10px;
          border-radius: 4px;
          border: 1px solid #ec6d51;
          color: #ec6d51;
          cursor: pointer;
          background: #fff;
          visibility: hidden;
          opacity: 0;
          transition: 0.3s;
        "
        @click="openCategoryDialog"
        >增加新的搜索列表</span
      >

      <span v-if="draft.closeBtn" id="xin-close" title="close 关闭" @click="close"></span>

      <EngineEditDialog
        v-if="engineDialog"
        :mode="engineDialog.mode"
        :initial="engineDialog.initial"
        :resolve-icon="getICON"
        @submit="submitEngine"
        @cancel="engineDialog = null"
      />

      <CategoryEditDialog
        v-if="categoryDialog"
        @submit="submitCategory"
        @cancel="categoryDialog = false"
      />

      <ConfigEditor
        v-if="configOpen"
        :initial-text="configText"
        @save="saveConfig"
        @reset="reset"
        @close="configOpen = false"
        @copy="showToast('复制成功')"
      />
    </div>
  </div>
</template>

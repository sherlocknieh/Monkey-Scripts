import { createApp } from 'vue';
import App from './App.vue';
import globalCss from './assets/global.css?raw';
import { initialize, getRoot, getHost, addStyle } from './core/shadow.js';
import { applyDarkModeIfNeeded, watchDarkModeChanges } from './core/darkMode.js';

// Shadow DOM 隔离宿主页面的样式
initialize();

// 全局样式 + 严格 CSP 页面的兼容样式
addStyle(globalCss);
addStyle(`
  .sej-engine-icon { width: 16px; height: 16px; object-fit: cover; display: inline-block; }
  .sej-engine-icon:not([src]) { display: none; }
  .sej-category-title { font-weight: 600; padding: 0 8px; opacity: 0.8; }
  .iqxin-setBtnOpacityRangeValue { display: inline-block; width: 3em; text-align: center; }
  #newSearchBox #iqxin-newTarget { border-radius: 4px; border: none; padding: 2px 0 2px 2px; }
  .iqxin-help-link { color: #999; }
  #iqxin-editCodeBox textarea { overflow: auto; border-radius: 4px; }
  .iqxin-warning { color: red; font-size: 1.2em; }
  #sej-drop-lists { display: contents; }
`);

applyDarkModeIfNeeded();
watchDarkModeChanges();

// 未匹配到规则时，宿主默认挂到 body 末尾（划词搜索等场景会在后续按需移动）
document.body.appendChild(getHost());

createApp(App).mount(getRoot());

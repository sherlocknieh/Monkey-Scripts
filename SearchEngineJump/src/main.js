import { createApp } from 'vue';
import { GM_info, GM_registerMenuCommand } from '$';
import App from './App.vue';
import globalCss from './assets/global.css?raw';
import { initialize, getRoot, getHost, addStyle, reset } from './core/shadow.js';
import { applyDarkModeIfNeeded, watchDarkModeChanges } from './core/darkMode.js';
import { useSettings } from './stores/settings.js';
import { openSettingPanel } from './stores/ui.js';

// 严格 CSP 页面的兼容样式
const CSP_COMPAT_STYLE = `
  .sej-engine-icon { width: 16px; height: 16px; object-fit: cover; display: inline-block; }
  .sej-engine-icon:not([src]) { display: none; }
  .sej-category-title { font-weight: 600; padding: 0 8px; opacity: 0.8; }
  .iqxin-setBtnOpacityRangeValue { display: inline-block; width: 3em; text-align: center; }
  #newSearchBox #iqxin-newTarget { border-radius: 4px; border: none; padding: 2px 0 2px 2px; }
  .iqxin-help-link { color: #999; }
  #iqxin-editCodeBox textarea { overflow: auto; border-radius: 4px; }
  .iqxin-warning { color: red; font-size: 1.2em; }
  #sej-drop-lists { display: contents; }
`;

// 关闭跳转条动画（transtion: false）
const NON_TRANSITION_STYLE = `
  .sej-engine, .sej-drop-list-trigger, .sej-drop-list { transition: none !important; }
  #sej-container { animation: none !important; }
  .sej-drop-list { backdrop-filter: none !important; }
`;

// 关闭设置面板动画（transtion: false）
const SETTINGS_NON_TRANSITION_STYLE = `
  #settingLayer, #btnEle span, #btnEle2, .iqxin-set-del,
  span.iqxin-additem, #newSearchBox, .addItemBoxBtn, #xin-close, #settingLayerMask {
    transition: none;
  }
  #settingLayerMask { backdrop-filter: none; }
`;

// 这些站点需要等待页面内容渲染后再初始化
const DELAY_LIST = [
  /^https?:\/\/google\.infinitynewtab\.com\/\?q/,
  /^https?:\/\/www\.zhihu\.com\/search\?/,
  /^https?:\/\/www\.iciba\.com\/word\?/,
  /^https?:\/\/neeva\.com\/search\?/i,
  /^https?:\/\/s\.taobao\.com\/search/,
  /^https?:\/\/y\.qq\.com\/n\/ryqq\/search/i,
  /^https?:\/\/www\.quora\.com\/search\?/i,
  /^https?:\/\/search\.bilibili\.com\/*/,
  /^https?:\/\/github\.com/i,
  /^https?:\/\/(www\.)?baidu\.com/i,
];

let app = null;
let menuRegistered = false;

function isRunning() {
  return Boolean(document.querySelector('#sej-shadow-host'));
}

function printBanner() {
  try {
    const name = GM_info?.script?.name;
    const version = GM_info?.script?.version;
    if (!name) return;
    console.info(
      `\n%c ${name} v${version} \n%c 问题反馈(GitHub):\t\thttps://github.com/MUTED64/SearchEngineJumpPlus/issues/new\t\t\t\t\t\t\t\n%c 问题反馈(GreasyFork):\thttps://greasyfork.org/scripts/454280-searchenginejumpplus-搜索引擎快捷跳转/feedback\t\n`,
      'color:#eee;background:#444;padding:6px 0;border-radius:6px 6px 0 0;',
      'color:#444;background:#eee;padding:6px 0;border-radius:0 6px 0 0',
      'color:#444;background:#eee;padding:6px 0;border-radius:0 0 6px 6px;',
    );
  } catch (e) {
    // ignore
  }
}

function boot() {
  if (isRunning()) return;

  if (app) {
    try {
      app.unmount();
    } catch (e) {
      // ignore
    }
    app = null;
  }

  reset();

  initialize();
  addStyle(globalCss);
  addStyle(CSP_COMPAT_STYLE);

  const { settingData } = useSettings();
  if (!settingData.transtion) {
    addStyle(NON_TRANSITION_STYLE);
    addStyle(SETTINGS_NON_TRANSITION_STYLE);
  }

  applyDarkModeIfNeeded();
  watchDarkModeChanges();

  // 未匹配到规则时，宿主默认挂到 body 末尾（划词搜索等场景会在后续按需移动）
  document.body.appendChild(getHost());

  app = createApp(App);
  app.mount(getRoot());

  if (!menuRegistered) {
    GM_registerMenuCommand('设置菜单', openSettingPanel);
    menuRegistered = true;
  }
}

function startScript() {
  if (window.self != window.top) return;

  printBanner();

  const needDelay = DELAY_LIST.some((re) => location.href.search(re) !== -1);
  if (needDelay) {
    setTimeout(() => {
      if (!isRunning()) boot();
    }, 1000);
  } else {
    boot();
  }
}

function normalizeURL(urlString) {
  try {
    const url = new URL(urlString);
    // Bilibili: 移除 vt 参数（时间戳）防止错误更新
    if (url.hostname.includes('bilibili.com')) {
      url.searchParams.delete('vt');
    }
    return url.toString();
  } catch (e) {
    return urlString;
  }
}

// 单页应用路由变化后重建跳转条
function listenUrlChange() {
  if (window.onurlchange !== null) return;

  let lastURL = normalizeURL(decodeURI(location.href).replaceAll(' ', '+'));
  window.addEventListener('urlchange', (e) => {
    const newURL = normalizeURL(decodeURI(e.url).replaceAll(' ', '+'));
    if (lastURL === newURL) return;
    lastURL = newURL;

    if (app) {
      try {
        app.unmount();
      } catch (err) {
        // ignore
      }
      app = null;
    }
    reset();
    startScript();
  });
}

startScript();
listenUrlChange();

// ==UserScript==
// @name         DeepSeek KaTeX 复制修正
// @match        https://chat.deepseek.com/*
// @grant        none
// @icon          https://www.deepseek.com/favicon.ico
// ==/UserScript==

(function() {
    'use strict';

    // 1. 引入 KaTeX 官方 Copy-Tex 的 CSS 和 JS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/copy-tex.min.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/copy-tex.min.js';
    // 确保脚本异步加载并执行
    script.defer = true;
    document.head.appendChild(script);

    // 2. 优化：针对 DeepSeek 动态加载的内容，有时需要手动触发或处理
    // 该插件通常会自动拦截 copy 事件，无需额外代码。
})();
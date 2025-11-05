// ==UserScript==
// @name        调试脚本
// @namespace   Violentmonkey Scripts
// @match       https://**/*
// @grant       none
// @version     1.0
// @author      -
// @description 2025/11/5 14:00:22
// ==/UserScript==

(function () {

    console.warn("调试脚本正在运行")
    console.warn("重定义 pushState 和 replaceState 函数")

    const rawPush = history.pushState;
    history.pushState = function (...args) {
        console.warn('pushState 被调用 \n新URL: ', args[2]);
        return rawPush.apply(this, args);
    };

    const rawReplace = history.replaceState;
    history.replaceState = function (...args) {
        console.warn('replaceState 被调用 \n新URL: ', args[2]);
        return rawReplace.apply(this, args);
    };
    

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.warn('静态页面加载完成 \n事件: document.DOMContentLoaded \n状态: document.readyState == ', document.readyState);
        });
    } else {
        console.warn('静态页面加载完成 \n事件: document.DOMContentLoaded \n状态: document.readyState == ', document.readyState);
    }

    document.addEventListener('readystatechange', () => {
        console.warn('页面状态发生变化 \n事件: document.readystatechange \n状态: document.readyState == ', document.readyState);
    });

    window.addEventListener('load', () => {
        console.warn('所有资源加载完成 \n事件: window.load \n状态: document.readyState == ', document.readyState);
    });

    window.addEventListener('pageshow', e => {
        console.warn(e.persisted ? '页面从缓存中恢复' : '页面全新加载完成', ' \n事件: window.pageshow');
    });


    window.addEventListener('popstate', (event) => {
        console.warn('用户手动前进/后退 \n事件: popstate \n目标: ', window.location.href);
    });

    window.addEventListener('hashchange', (event) => {
        console.log('#Hash路由', '\n从:', event.oldURL, '\n到:', event.newURL);
    });

    document.addEventListener('visibilitychange', () => {
        console.warn('页面可见性改变 \n事件: document.visibilitychange \n状态: document.hidden == ', document.hidden);
    });

})();
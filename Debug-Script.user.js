// ==UserScript==
// @namespace   Violentmonkey Scripts
// @name        调试脚本
// @version     1.1.4
// @grant       none
// @match       https://**/*
// @description 通用调试和代码参考
// ==/UserScript==

(function main() {

    console.warn("调试脚本正在运行")

    console.warn("重定义 pushState 和 replaceState 函数")
    const rawPush = history.pushState;
    history.pushState = function (...args) {
        console.warn('发生路由跳转 \n新URL: ', args[2], ' \n保留历史记录');
        return rawPush.apply(this, args);
    };
    const rawReplace = history.replaceState;
    history.replaceState = function (...args) {
        console.warn('发生路由跳转 \n新URL: ', args[2], '\n覆盖历史记录');
        return rawReplace.apply(this, args);
    };

    // 动态新增元素监听器
    new MutationObserver((mutationsList) => {
        // 遍历所有变更记录
        for (const mutation of mutationsList) {
            // 遍历所有新增节点
            for (const node of mutation.addedNodes) {
                // 排除非 HTMLElement 节点
                if (node.nodeType === 1) {
                    newNodeHandler(node);
                }
            }
        }
    }).observe(document.body, { childList: true, subtree: true });

    function newNodeHandler(node) {
        node.matches('video') && console.warn('发现新增 video 元素', node);
        node.querySelectorAll('video').forEach(elem => console.warn('发现新增 video 元素', elem));
    }
    

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
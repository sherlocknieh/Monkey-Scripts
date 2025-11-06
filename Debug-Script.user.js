// ==UserScript==
// @namespace   Violentmonkey Scripts
// @name        调试脚本
// @version     1.1.6.1
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
    const selectorMap = new Map();    // 选择器-回调映射
    const seen = new WeakSet();    // 元素去重集合
    // 监听注册函数
    function trackElement(selector, callback) {
        selectorMap.set(selector, callback);
        // 初始扫描
        document.querySelectorAll(selector).forEach(el => {
            if (!seen.has(el)) {
                seen.add(el);
                callback(el);
            }
        });
    }
    // 全局 observer
    new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1) {
                    selectorMap.forEach((callback, selector) => {
                        // 自身匹配
                        if (node.matches && node.matches(selector) && !seen.has(node)) {
                            seen.add(node);
                            callback(node);
                        }
                        // 后代匹配
                        if (node.querySelectorAll) {
                            node.querySelectorAll(selector).forEach(elem => {
                                if (!seen.has(elem)) {
                                    seen.add(elem);
                                    callback(elem);
                                }
                            });
                        }
                    });
                }
            }
        }
    }).observe(document.body, { childList: true, subtree: true });

    // 用法示例
    trackElement('video', elem => {
        console.warn('发现 video 元素', elem);
        elem.volume = 0.5; // 设置音量为50%
        elem.muted = false; // 取消静音
    });

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
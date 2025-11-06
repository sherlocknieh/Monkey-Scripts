// ==UserScript==
// @namespace   Violentmonkey Scripts
// @name        调试脚本
// @version     2025.11.07.0340
// @grant       none
// @match       https://**/*
// @description 通用调试和代码参考
// ==/UserScript==

(function main() {

    console.warn("[Debug]调试脚本正在运行")

    // 重定义 pushState 和 replaceState 函数
    const rawPush = history.pushState;
    history.pushState = function (...args) {
        console.warn('[Debug]发生路由跳转 \n新URL: ', args[2], ' \n保留历史记录');
        return rawPush.apply(this, args);
    };
    const rawReplace = history.replaceState;
    history.replaceState = function (...args) {
        console.warn('[Debug]发生路由跳转 \n新URL: ', args[2], '\n覆盖历史记录');
        return rawReplace.apply(this, args);
    };

    // 元素追踪器
    class ElementTracker {
        constructor(root = document.body) {
            if (ElementTracker.instance) {
                return ElementTracker.instance;
            }
            this.selectorMap = new Map();
            this.seen = new WeakSet();
            this.root = root;
            this.observer = new MutationObserver(this._handleMutations.bind(this));
            this.observer.observe(this.root, { childList: true, subtree: true });
            ElementTracker.instance = this;
        }
    
        track(selector, callback) {
            this.selectorMap.set(selector, callback);
            this.root.querySelectorAll(selector).forEach(el => {
                if (!this.seen.has(el)) {
                    this.seen.add(el);
                    callback(el);
                }
            });
            return this;
        }
    
        _handleMutations(mutationsList) {
            for (const mutation of mutationsList) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) {
                        this.selectorMap.forEach((callback, selector) => {
                            if (node.matches?.(selector) && !this.seen.has(node)) {
                                this.seen.add(node);
                                callback(node);
                            }
                            node.querySelectorAll?.(selector)?.forEach(elem => {
                                if (!this.seen.has(elem)) {
                                    this.seen.add(elem);
                                    callback(elem);
                                }
                            });
                        });
                    }
                }
            }
        }
    
        disconnect() {
            this.observer.disconnect();
        }
    }
    // 用法
    const tracker = new ElementTracker();
    tracker.track('video', elem => {
        console.warn('[Debug]发现 video 元素', elem);
    });
    const tracker1 = new ElementTracker();
    const tracker2 = new ElementTracker();
    console.warn('[Debug] tracker1 === tracker2:', tracker1 === tracker2); // true



    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.warn('[Debug]静态页面加载完成 \n事件: document.DOMContentLoaded \n状态: document.readyState == ', document.readyState);
        });
    } else {
        console.warn('[Debug]静态页面加载完成 \n事件: document.DOMContentLoaded \n状态: document.readyState == ', document.readyState);
    }

    document.addEventListener('readystatechange', () => {
        console.warn('[Debug]页面状态发生变化 \n事件: document.readystatechange \n状态: document.readyState == ', document.readyState);
    });

    window.addEventListener('load', () => {
        console.warn('[Debug]所有资源加载完成 \n事件: window.load \n状态: document.readyState == ', document.readyState);
    });

    window.addEventListener('pageshow', e => {
        console.warn('[Debug]', e.persisted ? '页面从缓存中恢复' : '页面全新加载完成', ' \n事件: window.pageshow');
    });


    window.addEventListener('popstate', (event) => {
        console.warn('[Debug]用户手动前进/后退 \n事件: popstate \n目标: ', window.location.href);
    });

    window.addEventListener('hashchange', (event) => {
        console.log('[Debug]#Hash路由', '\n从:', event.oldURL, '\n到:', event.newURL);
    });

    document.addEventListener('visibilitychange', () => {
        console.warn('[Debug]页面可见性改变 \n事件: document.visibilitychange \n状态: document.hidden == ', document.hidden);
    });

})();
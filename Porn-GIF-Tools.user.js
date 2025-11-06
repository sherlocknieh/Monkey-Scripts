// ==UserScript==
// @namespace    Violentmonkey Scripts
// @name         Porn GIF Tools
// @version      2025.11.07.0444
// @grant        none
// @match        https://greasyfork.org/*
// @match        https://sleazyfork.org/*
// @match        https://*.pornhub.com/*
// @match        https://musedam.cc/*
// @match        https://nsfw.xxx/*
// @match        https://anacams.com/post/*
// @match        https://rule34.xxx/*
// @description  视频自动取消静音
// @description  Musedam 视频自动播放
// @description  Pornhub 标签栏图标替换, GIF 搜索页与 Video 搜索页跳转按钮
// @description  Greasyfork 和 Sleazyfork 页面互链
// ==/UserScript==

(function main() {
    'use strict';
    // 元素追踪器--单例模式
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
    }
    
    // 视频追踪与自动操作
    (function handle_video() {
        const tracker = new ElementTracker();
        tracker.track('video', v => {
            console.warn('发现 video 元素', v);
            v.volume = 0.5;
            v.muted = false;
            console.warn('已取消静音');
            // Musedam 视频自动播放
            if ((window.location.href).includes('musedam.cc')) v.play();
        });
    })();

    // Greasyfork 与 Sleazyfork 互链
    (function handle_fork() {
        const url = window.location.href;
        const isGreasy = url.includes('greasyfork.org');
        const target = url.replace(isGreasy ? 'greasyfork' : 'sleazyfork', isGreasy ? 'sleazyfork' : 'greasyfork');
        const nav = document.querySelector('#site-nav > nav');
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = target;
        a.textContent = isGreasy ? 'SleazyFork' : 'GreasyFork';
        li.appendChild(a);
        if (nav.firstChild) nav.insertBefore(li, nav.firstChild);
        else nav.appendChild(li);
    })();

    // Pornhub 专用功能
    (function handle_pornhub() {
        // 切换GIF静音图标
        const t = new ElementTracker();
        t.track('#js-volumeToggle', volBtn => {
            console.warn('发现 GIF 静音按钮');
            volBtn.click();
            volBtn.classList.remove('muted');
        });

        // 替换 pornhub.com 图标
        document.querySelectorAll('link[rel*="icon"]').forEach(link => {
            link.href = 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
                <circle cx="32" cy="32" r="32" fill="black"/>
                <text x="32" y="42" text-anchor="middle" font-size="32" fill="white">PH</text>
            </svg>`);
            link.type = 'image/svg+xml';
        });

        // GIF 搜索页与 video 搜索页互转按钮
        const url = window.location.href;
        if (url.includes('search')) {
            const isVideo = url.includes('video/search');
            const button = document.createElement('button');
            document.body.appendChild(button);
            button.textContent = isVideo ? 'to GIF' : 'to Video';
            Object.assign(button.style, {
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                padding: '10px 15px',
                zIndex: 1,
                backgroundColor: '#ff9900',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
            });
            button.onclick = () => {
                const newUrl = isVideo ? url.replace('video', 'gifs') : url.replace('gifs', 'video');
                window.location.replace(newUrl);
            };
        }
    })();

})();
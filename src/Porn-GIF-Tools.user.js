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
// @match        https://rule34.xxx/*
// @match        https://anacams.com/post/*
// @match        https://www.sex.com/*/gifs/*
// @description  视频自动取消静音
// @description  Musedam 视频自动播放
// @description  Pornhub 标签栏图标替换, GIF 搜索页与 Video 搜索页跳转按钮
// @description  Greasyfork 和 Sleazyfork 页面互链
// ==/UserScript==

(function main() {
    'use strict';
    // 动态元素追踪器
    class ElementTracker {
        constructor() {
            // 单例模式
            if (ElementTracker.instance) {
                return ElementTracker.instance;
            }
            ElementTracker.instance = this; // 创建实例

            this.root = document.body;      // 监听根节点
            this.seen = new WeakSet();      // 去重集合
            this.selectorMap = new Map();   // 追踪列表
            // 创建监听器
            this.observer = new MutationObserver(this._handleMutations.bind(this));
            // 开始监听
            this.observer.observe(this.root, { childList: true, subtree: true });
        }
        // 添加追踪规则
        track(selector, callback) {
            // 添加到追踪列表
            this.selectorMap.set(selector, callback);
            // 初始扫描
            this.root.querySelectorAll(selector).forEach(el => {
                if (!this.seen.has(el)) {
                    this.seen.add(el);
                    callback(el);
                }
            });
            return this;
        }
        // 元素变化时的响应逻辑
        _handleMutations(mutationsList) {
            for (const mutation of mutationsList) {
                // 遍历新增节点
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) { // 过滤掉非元素节点
                        // 遍历追踪列表
                        this.selectorMap.forEach((callback, selector) => {
                            // 检查节点是否匹配选择器
                            if (node.matches?.(selector) && !this.seen.has(node)) {
                                this.seen.add(node);        // 标记为已访问过
                                callback(node);             // 执行目标操作
                            }
                            // 检查子节点是否匹配选择器
                            node.querySelectorAll?.(selector)?.forEach(elem => {
                                if (!this.seen.has(elem)) {
                                    this.seen.add(elem);    // 标记为已访问过
                                    callback(elem);         // 执行目标操作
                                }
                            });
                        });
                    }
                }
            }
        }

    }

    // 视频元素处理
    (function handle_video() {
        const tracker = new ElementTracker();
        tracker.track('video', v => {
            //console.warn('发现 video 元素', v);
            v.volume = 0.5;
            v.muted = false;
            //console.warn('已取消静音');
            if ((window.location.href).includes('musedam.cc'))
                v.play();            // Musedam 视频自动播放
        });
    })();

    // Pornhub 站点处理
    (function handle_pornhub() {
        // URL 检查
        const url = window.location.href;
        if (!url.includes('pornhub.com')) return;
        // 替换 pornhub.com 图标
        document.querySelectorAll('link[rel*="icon"]').forEach(link => {
            link.href = 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
                <circle cx="32" cy="32" r="32" fill="black"/>
                <text x="32" y="42" text-anchor="middle" font-size="32" fill="white">PH</text>
            </svg>`);
            link.type = 'image/svg+xml';
        });

        // 切换GIF静音图标
        const tracker = new ElementTracker();
        tracker.track('#js-volumeToggle', volBtn => {
            volBtn.classList.remove('muted');
        });

        // GIF 搜索页与 Video 搜索页互转按钮
        if (url.includes('search')) {
            const isVideo = url.includes('video/search');
            const button = document.createElement('button');
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
                borderRadius: '999px', // 药丸形状
                cursor: 'pointer',
                fontSize: '16px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
            });
            button.onclick = () => {
                const newUrl = isVideo ? url.replace('video', 'gifs') : url.replace('gifs', 'video');
                window.location.replace(newUrl);
            };
            document.body.appendChild(button);
        }
    })();

    // Greasyfork 处理
    (function handle_fork() {
        const url = window.location.href;
        const isGreasy = url.includes('greasyfork.org');
        const isSleazy = url.includes('sleazyfork.org');
        if (!isGreasy && !isSleazy) return;
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

    // sex.com 站点处理
    (function handle_sexcom() {
        const url = window.location.href;
        if (!url.includes('sex.com')) return;
        const tracker = new ElementTracker();
        // 添加搜图功能h 
        tracker.track('img[data-testid="pin-carousel-image"]', img => {
            // 获取图片URL
            const imgUrl = img.src;
            console.warn('发现 GIF 图片', imgUrl);
            // 创建搜索按钮
            const searchBtn = document.createElement('button');
            searchBtn.textContent = 'NameThatPorn';
            Object.assign(searchBtn.style, {
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                padding: '5px 10px',
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                zIndex: 1000
            });
            // 添加点击事件
            searchBtn.onclick = () => {
                const searchUrl = `https://namethatporn.com/search/images.html?url=${encodeURIComponent(imgUrl)}`;
                window.open(searchUrl, '_blank');
            };
            // 将按钮添加到图片的父元素中
            img.parentElement.style.position = 'relative';
            img.parentElement.appendChild(searchBtn);
            console.warn('已添加 NameThatPorn 搜索按钮');
        });
    })();
})();
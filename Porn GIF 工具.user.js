// ==UserScript==
// @namespace    http://tampermonkey.net/
// @name         Porn GIF Tools
// @grant        none
// @version      1.4.5
// @match        https://*.pornhub.com/*
// @match        https://nsfw.xxx/*
// @match        https://www.sex.com/*
// @match        https://musedam.cc/*
// @match        https://greasyfork.org/*
// @match        https://sleazyfork.org/*
// @description  Porn GIF Tools
// ==/UserScript==

(function () {
    'use strict';

    // -------- 基础工具 --------
    const url = window.location.href; // 当前页面 URL

    const whenReady = (callback, delay = 0) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => setTimeout(callback, delay));
        } else {
            setTimeout(callback, delay);
        }
    };

    whenReady(main);

    // -------- 入口 --------
    function main() {
        if (url.includes('pornhub.com')) {
            // 替换 pornhub.com 图标
            const icon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
            <circle cx="32" cy="32" r="32" fill="black"/>
            <text x="32" y="42" text-anchor="middle" font-size="32" fill="white">!</text>
        </svg>`;

            document.querySelectorAll('link[rel*="icon"]').forEach(link => {
                link.href = 'data:image/svg+xml;base64,' + btoa(icon);
                link.type = 'image/svg+xml';
            });

            // 优先跳转到 GIF 搜索页
            if (url.includes('pornhub.com/video/search')) {
                window.location.replace(url.replace('video', 'gif'));
            }
            // 取消 GIF 静音
            else if (url.includes('pornhub.com/gif/')) {
                pornhub_gif_unmute();
            }
        }
        else if (url.includes('www.sex.com')) {
            sex_com_features();
        }
        else if (url.includes('nsfw.xxx')) {
            nsfw_vid_unmute();
        }
        // 在 GreasyFork 和 SleazyFork 页面添加互链
        else if (url.includes('greasyfork.org') || url.includes('sleazyfork.org')) {
            whenReady(() => {
                const isGreasy = url.includes('greasyfork.org');
                const target = url.replace(isGreasy ? 'greasyfork' : 'sleazyfork', isGreasy ? 'sleazyfork' : 'greasyfork');
                const nav = document.querySelector('#site-nav > nav');
                const li = document.createElement('li');
                li.innerHTML = `<a href="${target}">${isGreasy ? 'SleazyFork' : 'GreasyFork'}</a>`;
                if (nav.firstChild) nav.insertBefore(li, nav.firstChild); else nav.appendChild(li);
            });
        }
        else if (url.includes('musedam.cc')) {
            musedam_autoplay();
        }
    }

    // -------- 功能函数：Pornhub GIF 取消静音 --------
    function pornhub_gif_unmute() {
        const unmute = () => {
            console.log('正在取消GIF静音');
            const volumeToggle = document.getElementById('js-volumeToggle');
            const gifWebmPlayer = document.getElementById('gifWebmPlayer');
            if (volumeToggle && gifWebmPlayer) {
                volumeToggle.classList.remove('muted');
                gifWebmPlayer.muted = false;
                gifWebmPlayer.volume = 1;
            } else {
                console.log('未发现 js-volumeToggle 和 gifWebmPlayer 元素');
            }
        };

        window.addEventListener('load', () => setTimeout(unmute, 100));
        document.addEventListener('visibilitychange', () => !document.hidden && unmute());
    }

    // -------- 功能函数：sex.com 图片格式切换按钮 --------
    function sex_com_features() {
        const addButton = () => {
            console.log('正在添加按钮');
            const img = document.querySelector('img[data-testid="pin-carousel-image"]');
            if (!img) { console.log('未发现目标图片'); return; }
            const parent = img.parentElement;
            if (!parent || parent.querySelector('.switch-button')) return;

            const button = Object.assign(document.createElement('button'), {
                className: 'switch-button',
                textContent: 'WEBP→GIF',
                title: '将当前图片从 WEBP 格式切换为 GIF 格式',
            });
            if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
            Object.assign(button.style, {
                position: 'absolute', top: '5px', right: '5px', padding: '5px 10px',
                background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '5px',
                cursor: 'pointer', fontSize: '12px'
            });
            button.onclick = (e) => {
                e.preventDefault(); e.stopPropagation();
                if (img.src.includes('.webp')) {
                    img.src = img.src.replace('.webp', '.gif');
                    button.textContent = 'GIF→WEBP';
                    button.title = '将当前图片从 GIF 格式切换为 WEBP 格式';
                } else if (img.src.includes('.gif')) {
                    img.src = img.src.replace('.gif', '.webp');
                    button.textContent = 'WEBP→GIF';
                    button.title = '将当前图片从 WEBP 格式切换为 GIF 格式';
                }
            };
            parent.appendChild(button);
        };

        whenReady(addButton, 100);
        const mo = new MutationObserver((mutations) => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node && node.nodeType === 1 && node.querySelector) {
                        const v = node.querySelector('img[data-testid="pin-carousel-image"]');
                        if (v) addButton();
                    }
                }
            }
        });
        mo.observe(document.body, { childList: true, subtree: true });
    }

    // -------- 功能函数：nsfw.xxx 视频取消静音 + 可见即播 --------
    function nsfw_vid_unmute() {
        const handleVideo = (video) => {
            try {
                if (!video) return;
                video.muted = false;
                if (typeof video.volume !== 'undefined') video.volume = 1;
            } catch { }
        };

        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const v = entry.target;
                if (entry.isIntersecting) {
                    try { v.play().catch(() => { }); } catch { }
                } else {
                    try { v.pause(); } catch { }
                }
            });
        }, { threshold: 0.25 });

        const processExisting = () => {
            const videos = Array.from(document.querySelectorAll('video'));
            videos.forEach(v => { handleVideo(v); try { io.observe(v); } catch { } });
        };
        processExisting();

        const mo = new MutationObserver(mutations => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (!node) continue;
                    if (node.nodeType === 1 && node.querySelector) {
                        const v = node.querySelector('video');
                        if (v) { handleVideo(v); try { io.observe(v); } catch { } }
                    }
                }
            }
        });
        mo.observe(document.body, { childList: true, subtree: true });
    }

    // -------- 功能函数：musedam 进入 detail 自动播放 --------
    function musedam_autoplay() {
        // 路由事件统一分发
        const dispatchLocationChange = () => window.dispatchEvent(new Event('locationchange'));

        // 仅补丁一次：拦截 pushState/replaceState，并补齐 popstate/pageshow 触发
        if (!window.__musedam_history_patched__) {
            try {
                const rawPush = history.pushState;
                history.pushState = function () {
                    const ret = rawPush.apply(this, arguments);
                    dispatchLocationChange();
                    return ret;
                };
                const rawReplace = history.replaceState;
                history.replaceState = function () {
                    const ret = rawReplace.apply(this, arguments);
                    dispatchLocationChange();
                    return ret;
                };
                window.addEventListener('popstate', dispatchLocationChange);
                window.addEventListener('pageshow', () => dispatchLocationChange()); // 兼容 bfcache
                window.__musedam_history_patched__ = true;
            } catch { }
        }

        // 业务：进入 detail 时执行
        const isDetail = () => {
            const p = location.pathname || '';
            return p === '/detail' || p.startsWith('/detail/');
        };

        const tryPlayFirstVideo = () => {
            try {
                const v = document.querySelector('video');
                if (!v) return false;
                // 不强制取消静音，避免自动播放策略阻止
                try { v.play().catch(() => { }); } catch { }
                return true;
            } catch { return false; }
        };

        const onEnterDetail = () => {
            console.log('[Porn GIF Tools] musedam: enter /detail');
            if (tryPlayFirstVideo()) return;

            // 等待 DOM 渲染出视频元素
            const mo = new MutationObserver(() => {
                if (tryPlayFirstVideo()) {
                    try { mo.disconnect(); } catch { }
                }
            });
            try { mo.observe(document.body, { childList: true, subtree: true }); } catch { }
            setTimeout(() => { try { mo.disconnect(); } catch { } }, 10000); // 超时兜底
        };

        const tryEnterDetail = () => { if (isDetail()) onEnterDetail(); };

        // 触发时机：多次短延时重试，兼容 DOM 异步渲染与 bfcache 恢复
        const scheduleTry = () => [0, 50, 200, 500, 1000].forEach(d => setTimeout(tryEnterDetail, d));
        window.addEventListener('locationchange', scheduleTry);
        document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleTry(); });
        scheduleTry(); // 首次进入
    }
})();
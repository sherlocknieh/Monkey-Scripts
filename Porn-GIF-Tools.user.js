// ==UserScript==
// @namespace    http://tampermonkey.net/
// @name         Porn GIF Tools
// @version      2025.11.03-18
// @match        https://greasyfork.org/*
// @match        https://sleazyfork.org/*
// @match        https://*.pornhub.com/*
// @match        https://musedam.cc/*
// @match        https://nsfw.xxx/*
// @match        https://anacams.com/post/*
// @grant        none
// @description  Greasyfork 和 Sleazyfork 页面互链
// @description  Pornhub GIF 自动取消静音, GIF 搜索页与 Video 搜索页跳转按钮, Pornhub 标签栏图标替换
// @description  Musedam 视频自动播放
// @description  视频自动取消静音-通用版
// ==/UserScript==

(function main() {

    const url = window.location.href;

    if (url.includes('fork.org')) handle_fork();
    else if (url.includes('pornhub.com')) handle_pornhub();
    else if (url.includes('musedam.cc')) handle_musedam();
    else video_unmute();

    function video_unmute(videoElement) {
        if (!videoElement) {
            videoElement = document.querySelector('video');
            if (url.includes('nsfw.xxx')) {
                videoElement = document.querySelector('.video-preview--source');
            }
        }
        if (videoElement) {
            videoElement.muted = false;
            videoElement.volume = 0.5;
        }
    }

    function handle_fork() {
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
    }

    function handle_pornhub() {
        const unmute = () => {
            console.log('正在取消GIF静音');
            const volumeToggle = document.getElementById('js-volumeToggle');
            const gifWebmPlayer = document.getElementById('gifWebmPlayer');
            if (gifWebmPlayer) {
                gifWebmPlayer.muted = false;
                gifWebmPlayer.volume = 1;
            } else {
                console.log('未发现 gifWebmPlayer 元素');
            }
            if (volumeToggle && volumeToggle.classList.contains('muted')) {
                volumeToggle.click();
                volumeToggle.classList.remove('muted');
            }
        };

        window.addEventListener('load', () => setTimeout(unmute, 500));
        document.addEventListener('visibilitychange', () => !document.hidden && unmute());

        // 替换 pornhub.com 图标
        const icon = `
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
                <circle cx="32" cy="32" r="32" fill="black"/>
                <text x="32" y="42" text-anchor="middle" font-size="32" fill="white">PH</text>
            </svg>`;
        document.querySelectorAll('link[rel*="icon"]').forEach(link => {
            link.href = 'data:image/svg+xml;base64,' + btoa(icon);
            link.type = 'image/svg+xml';
        });

        // GIF 搜索页与 video 搜索页互转按钮
        if (url.includes('pornhub.com/video/search')) {
            const button = document.createElement('button');
            button.textContent = '切换到 GIF 搜索';
            button.onclick = () => {
                window.location.replace(url.replace('video', 'gif'));
            };
            document.body.appendChild(button);
        }
    }

    function handle_musedam() {
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
// ==UserScript==
// @namespace    http://tampermonkey.net/
// @name         Porn GIF Tools
// @version      2025/11/06 01:13
// @match        https://greasyfork.org/*
// @match        https://sleazyfork.org/*
// @match        https://*.pornhub.com/*
// @match        https://musedam.cc/*
// @match        https://nsfw.xxx/*
// @match        https://anacams.com/post/*
// @grant        none
// @run-at       document-end
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
        // 取消GIF静音
        const unmute = () => {
            console.log('正在取消GIF静音');
            const gifWebmPlayer = document.getElementById('gifWebmPlayer');
            if (gifWebmPlayer) {
                video_unmute(gifWebmPlayer);
            } else {
                console.log('未发现 gifWebmPlayer 元素');
            }
            const volumeToggle = document.getElementById('js-volumeToggle');
            if (volumeToggle && volumeToggle.classList.contains('muted')) {
                volumeToggle.click();
                volumeToggle.classList.remove('muted');
            }
        };
        window.addEventListener('load', () => setTimeout(unmute, 500));
        document.addEventListener('visibilitychange', () => !document.hidden && unmute());

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
    }

    function handle_musedam() {

        // 实现单页应用的路由事件监听
        const rawPush = history.pushState;
        history.pushState = function (...args) {
            window.dispatchEvent(new Event('locationchange'));  // 触发自定义事件
            return rawPush.apply(this, args);                   // 调用原始函数
        };

        const rawReplace = history.replaceState;
        history.replaceState = function (...args) {
            window.dispatchEvent(new Event('locationchange'));  // 触发自定义事件
            return rawReplace.apply(this, args);                // 调用原始函数
        };

        // 视频播放逻辑
        const autoPlayVideo = () => {
            setTimeout(() => { // 延时等待新页面加载
                const currentPath = location.pathname;
                if (currentPath.includes('/detail')) {
                    console.warn('已进入视频页面，尝试自动播放视频');
                    const v = document.querySelector('video');
                    if (!v) {
                    console.warn('未捕获到 video 元素');
                    return false;
                }
                v.play();
                console.warn('已触发视频播放');
            }}, 500);
        };

        // 路由发生变化时触发
        window.addEventListener('locationchange', autoPlayVideo);
        // 页面切回前台时触发
        document.addEventListener('visibilitychange', () => { if (!document.hidden) autoPlayVideo(); });
    }
})();
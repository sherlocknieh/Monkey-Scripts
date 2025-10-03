// ==UserScript==
// @namespace    http://tampermonkey.net/
// @name         Porn GIF Tools
// @grant        none
// @version      1.4
// @match        https://*.pornhub.com/*
// @match        https://nsfw.xxx/*
// @match        https://www.sex.com/*
// @description  Porn GIF Tools
// ==/UserScript==

(function() {
    'use strict';

    const url = window.location.href; // 获取当前页面URL

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

    
    // 功能函数
    function pornhub_gif_unmute() {
        // 取消静音函数
        const unmute = () => {
            console.log('尝试取消GIF静音');
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

        // 网页加载完全后执行一次
        window.addEventListener('load', () => setTimeout(unmute, 100));

        // 页面切换到前台时执行一次
        document.addEventListener('visibilitychange', () => !document.hidden && unmute());
    }

    
    function sex_com_features() {
        const img = document.querySelector('img[data-testid="pin-carousel-image"]');
        if (!img) {console.log('未发现目标图片'); return;}

        // 添加按钮函数
        const addButton = (img) => {

            console.log('尝试添加格式切换按钮');

            const parent = img.parentElement;
            if (!parent) return;

            console.log('header parent found:', parent);
            
            // 创建按钮
            const button = Object.assign(document.createElement('button'), {
                className: 'switch-button',
                textContent: 'Webp→GIF',
                title: '将当前图片从 Webp 格式切换为 GIF 格式',
            });
            

            // 样式设置
            if (getComputedStyle(parent).position === 'static') {
                parent.style.position = 'relative';   // 确保父元素定位
            }
            Object.assign(button.style, {
                position: 'absolute',
                top: '5px', right: '5px',
                padding: '5px 10px',
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                border: 'none', borderRadius: '5px',
                cursor: 'pointer', fontSize: '12px'
            });
            
            
            // 注册点击事件
            button.onclick = (e) => {
                e.preventDefault();     // 阻止默认行为
                e.stopPropagation();    // 阻止事件冒泡
                if (img.src.includes('.webp')) {
                    img.src = img.src.replace('.webp', '.gif');
                    button.textContent = 'GIF→Webp';
                    button.title = '将当前图片从 GIF 格式切换为 Webp 格式';
                } else if (img.src.includes('.gif')) {
                    img.src = img.src.replace('.gif', '.webp');
                    button.textContent = 'Webp→GIF';
                    button.title = '将当前图片从 Webp 格式切换为 GIF 格式';
                }
            };
            
            // 添加按钮
            parent.appendChild(button);
        }

        // 网页加载完全后执行一次
        window.addEventListener('load', () => setTimeout(() => addButton(img), 1000));
    }


    function nsfw_vid_unmute() {
        // 处理单个视频元素：取消静音并设置音量
        const handleVideo = (video) => {
            try {
                if (!video) return; // 跳过无效节点
                video.muted = false; // 取消静音
                if (typeof video.volume !== 'undefined') video.volume = 1; // 设置最大音量
            } catch (e) {}
        };

        // 使用 IntersectionObserver 监听视频是否在视口内
        // 当视频进入视口时自动播放，离开视口时自动暂停
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const v = entry.target;
                if (entry.isIntersecting) {
                    // 视频可见时尝试播放
                    try { v.play().catch(()=>{}); } catch (e) {}
                } else {
                    // 视频不可见时尝试暂停
                    try { v.pause(); } catch (e) {}
                }
            });
        }, { threshold: 0.25 }); // 视口重叠比例达到 25% 时触发

        // 处理页面上已存在的所有视频
        const processExisting = () => {
            const videos = Array.from(document.querySelectorAll('video'));
            videos.forEach(v => {
                handleVideo(v); // 取消静音并设置音量
                try { io.observe(v); } catch (e) {} // 监听可见性变化
            });
        };

        // 监听 DOM 变化，自动处理新添加的视频元素
        const mo = new MutationObserver(mutations => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (!node) continue;
                    if (node.nodeType === 1) {
                        if (node.tagName === 'VIDEO') {
                            // 新增 video 元素，立即处理
                            handleVideo(node);
                            try { io.observe(node); } catch (e) {}
                        } else if (node.querySelector) {
                            // 新增的节点下有 video 子元素，也要处理
                            const v = node.querySelector('video');
                            if (v) { handleVideo(v); try { io.observe(v); } catch (e) {} }
                        }
                    }
                }
            }
        });
        // 监听整个页面的子节点变化
        mo.observe(document.body, { childList: true, subtree: true });

        // 首次处理页面上已有的视频
        processExisting();
    }
})();
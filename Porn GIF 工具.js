// ==UserScript==
// @namespace    http://tampermonkey.net/
// @name         Porn GIF Tools
// @grant        none
// @version      1.0
// @match        https://*.pornhub.com/*
// @match        https://www.sex.com/*
// @description  Porn GIF Tools
// ==/UserScript==

(function() {
    'use strict';

    // 主流程
    (function main() {

        const hostname = window.location.hostname;  // 获取当前域名
        const url = window.location.href;           // 获取当前URL

        // Pornhub 视频搜索自动跳转到GIF搜索
        if (url.includes('pornhub.com/video/search')) {
            const newUrl = url.replace('video', 'gif');
            window.location.replace(newUrl);
            return;
        }
        // Pornhub GIF页面取消静音
        if (url.includes('pornhub.com/gif/')) {
            waitForVolumeToggle();
            return;
        }
        // SEX.com GIF页面处理
        if (hostname === 'www.sex.com') {
            // Webp转GIF, 添加搜图按钮
            processMainImage();
            // 监听DOM变化，处理动态加载的图片
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            processMainImage();
                        }
                    });
                });
            });
            observer.observe(document.body, {childList: true, subtree: true});
            return;
        }
    })();


    // 辅助函数

    // 取消静音
    function removeInitialMute() {
        // 移除音量按钮的静音类
        const volumeToggle = document.getElementById('js-volumeToggle');
        if (volumeToggle && volumeToggle.classList.contains('muted')) {
            volumeToggle.classList.remove('muted');
        }
        
        // 移除模态框音量按钮的静音类
        const volumeToggleModal = document.getElementById('js-volumeToggleModal');
        if (volumeToggleModal && volumeToggleModal.classList.contains('muted')) {
            volumeToggleModal.classList.remove('muted');
        }
        
        // 设置视频元素不静音
        const videoPlayer = document.getElementById('gifWebmPlayer');
        if (videoPlayer) {
            videoPlayer.muted = false;
            videoPlayer.volume = 1;
        }
    }
    
    // 等待js-volumeToggle元素出现后执行
    function waitForVolumeToggle() {
        const volumeToggle = document.getElementById('js-volumeToggle');
        if (volumeToggle) {
            removeInitialMute();
        } else {
            // 使用MutationObserver监听DOM变化
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList') {
                        const volumeToggle = document.getElementById('js-volumeToggle');
                        if (volumeToggle) {
                            observer.disconnect();
                            removeInitialMute();
                        }
                    }
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            // 设置超时，避免无限等待
            setTimeout(() => {
                observer.disconnect();
                removeInitialMute(); // 超时后仍然执行一次
            }, 2000); // 2秒超时
        }

        // 页面变为可见时再尝试取消静音
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                removeInitialMute();
            }
        });
    }

    // 主图处理函数
    function processMainImage() {
        const mainImage = document.querySelector('img[data-testid="pin-carousel-image"]');
        if (mainImage) {
            const src = mainImage.src;
            if (src.includes('.webp')) {
                mainImage.src = src.replace('.webp', '.gif');
            }
        }
        addSearchButton(mainImage);
    }

    // 搜图按钮创建函数
    function addSearchButton(img) {
        // 检查是否已经添加过按钮
        if (img.parentElement.querySelector('.search-button')) {
            return;
        }
        
        // 创建搜图按钮
        const searchButton = document.createElement('button');
        searchButton.className = 'search-button';
        searchButton.innerHTML = 'NameThatPorn';
        searchButton.style.cssText = `
            position: absolute;  /* 定位: 相对于父元素 */
            top: 5px;            /* 距离顶部 5px */
            right: 5px;          /* 距离右侧 5px */
            padding: 5px 10px;   /* 内边距 */
            background: rgba(0, 0, 0, 0.7); /* 背景颜色: 半透明黑色 */
            border-radius: 5px;  /* 圆角 */
            cursor: pointer;     /* 鼠标悬停样式 */
            z-index: 1000;       /* 确保按钮在图片上层 */
        `;
        
        // 确保父元素有相对定位
        if (getComputedStyle(img.parentElement).position === 'static') {
            img.parentElement.style.position = 'relative';
        }
        
        // 添加按钮到图片的父元素
        img.parentElement.appendChild(searchButton);

        // 注册按钮点击事件
        searchButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            let searchUrl = img.src;
            // 如果是gif，替换为webp用于搜索
            if (searchUrl.includes('.gif')) {
                searchUrl = searchUrl.replace('.gif', '.webp');
            }
            
            const searchLink = `https://namethatporn.com/search/images.html?url=${encodeURIComponent(searchUrl)}`;
            window.open(searchLink, '_blank');
        });
        
    }

})();
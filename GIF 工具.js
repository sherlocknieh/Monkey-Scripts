// ==UserScript==
// @namespace    http://tampermonkey.net/
// @name         Porn GIF Tools
// @version      1.0
// @grant        none
// @description  Porn GIF Tools
// @match        https://*.pornhub.com/*
// @match        https://www.sex.com/*
// ==/UserScript==

(function() {
    'use strict';
    
    const hostname = window.location.hostname; // 获取当前域名
    const url = window.location.href;          // 获取当前 URL
    
    // PornHub: video/search 跳转到 gif/search
    if (hostname.includes('pornhub.com') && url.includes('/video/search')) {
        const newUrl = url.replace('/video/search', '/gif/search');
        window.location.replace(newUrl);
        return;
    }
    
    // PornHub: 处理主图

    // sex.com: webp → gif 并添加搜图按钮
    if (hostname === 'www.sex.com') {
        // 初次加载时处理主图
        processMainImage();
        
        // 监听动态加载的元素
        const observer = new MutationObserver(mutations => {
            // 遍历 DOM 变化
            mutations.forEach(mutation => {
                // 遍历新增节点
                mutation.addedNodes.forEach(node => {
                    // 如果新增节点为元素节点
                    if (node.nodeType === 1) {
                        processMainImage();
                    };
                });
            });
        }).observe(document.body, {childList: true,subtree: true});
        return;
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
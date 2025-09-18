// ==UserScript==
// @namespace    http://tampermonkey.net/
// @name         Porn GIF Tools
// @grant        none
// @version      1.3
// @match        https://*.pornhub.com/*
// @match        https://www.sex.com/*
// @description  Porn GIF Tools
// ==/UserScript==

(function() {
    'use strict';

    const { hostname, href: url } = window.location;
    
    // 常量定义
    const SELECTORS = {
        volumeButtons: ['js-volumeToggle', 'js-volumeToggleModal'],
        videoPlayer: 'gifWebmPlayer',
        sexComImage: 'img[data-testid="pin-carousel-image"]',
        searchButton: '.search-button'
    };
    
    const DELAYS = { initial: 100, retry: 200, observer: 100, load: 200 };
    const LIMITS = { maxRetries: 10, observerTimeout: 5000 };

    // 工具函数
    const utils = {
        // 延迟执行
        delay: (fn, ms) => setTimeout(fn, ms),
        
        // DOM就绪检查
        whenReady: (callback) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', callback);
            } else {
                utils.delay(callback, DELAYS.initial);
            }
        },
        
        // 创建DOM观察器
        observe: (callback, timeout = LIMITS.observerTimeout) => {
            const observer = new MutationObserver(callback);
            observer.observe(document.body, { childList: true, subtree: true });
            if (timeout > 0) utils.delay(() => observer.disconnect(), timeout);
            return observer;
        },
        
        // 检查元素是否为目标元素
        isTargetElement: (node, targets) => {
            if (node.nodeType !== 1) return false;
            return targets.some(target => 
                node.id === target || node.querySelector(`#${target}`)
            );
        }
    };

    // 主流程
    function main() {
        if (url.includes('pornhub.com/video/search')) {
            window.location.replace(url.replace('video', 'gif'));
        } else if (url.includes('pornhub.com/gif/')) {
            utils.whenReady(initVolumeControl);
        } else if (hostname === 'www.sex.com') {
            initSexComFeatures();
        }
    }

    // Pornhub音量控制
    function initVolumeControl() {
        let retryCount = 0;
        
        const unmute = () => {
            let success = false;
            
            // 处理音量按钮
            SELECTORS.volumeButtons.forEach(id => {
                const element = document.getElementById(id);
                if (element?.classList.contains('muted')) {
                    element.classList.remove('muted');
                    success = true;
                }
            });
            
            // 处理视频元素
            const video = document.getElementById(SELECTORS.videoPlayer);
            if (video) {
                Object.assign(video, { muted: false, volume: 1 });
                success = true;
            }
            
            return success;
        };

        const tryUnmute = () => {
            if (unmute() || retryCount >= LIMITS.maxRetries) return;
            retryCount++;
            utils.delay(tryUnmute, DELAYS.retry * retryCount);
        };

        // 立即尝试
        tryUnmute();
        
        // 监听新元素
        const targetElements = [...SELECTORS.volumeButtons, SELECTORS.videoPlayer];
        utils.observe((mutations) => {
            const hasTargetElement = mutations.some(m => 
                Array.from(m.addedNodes).some(node => 
                    utils.isTargetElement(node, targetElements)
                )
            );
            if (hasTargetElement) utils.delay(unmute, DELAYS.observer);
        });

        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) utils.delay(unmute, DELAYS.observer);
        });
        
        // 页面完全加载
        if (document.readyState !== 'complete') {
            window.addEventListener('load', () => utils.delay(unmute, DELAYS.load));
        }
    }

    // Sex.com功能
    function initSexComFeatures() {
        const processImage = () => {
            const img = document.querySelector(SELECTORS.sexComImage);
            if (!img) return;
            
            // Webp转GIF
            if (img.src.includes('.webp')) {
                img.src = img.src.replace('.webp', '.gif');
            }
            
            addSearchButton(img);
        };

        processImage();
        utils.observe((mutations) => {
            if (mutations.some(m => m.addedNodes.length > 0)) processImage();
        }, 0);
    }

    // 添加搜图按钮
    function addSearchButton(img) {
        const parent = img.parentElement;
        if (!parent || parent.querySelector(SELECTORS.searchButton)) return;
        
        const button = Object.assign(document.createElement('button'), {
            className: 'search-button',
            textContent: 'NameThatPorn'
        });
        
        // 样式设置
        Object.assign(button.style, {
            position: 'absolute', top: '5px', right: '5px',
            padding: '5px 10px', background: 'rgba(0,0,0,0.7)',
            color: 'white', border: 'none', borderRadius: '5px',
            cursor: 'pointer', zIndex: '1000', fontSize: '12px'
        });
        
        // 确保父元素定位
        if (getComputedStyle(parent).position === 'static') {
            parent.style.position = 'relative';
        }
        
        // 点击事件
        button.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const searchUrl = img.src.replace('.gif', '.webp');
            window.open(`https://namethatporn.com/search/images.html?url=${encodeURIComponent(searchUrl)}`, '_blank');
        };
        
        parent.appendChild(button);
    }

    // 启动
    main();
})();
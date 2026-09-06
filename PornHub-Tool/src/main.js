
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

// Pornhub 处理
(function handle_pornhub() {
    // URL 检查
    const url = window.location.href;
    if (!url.includes('pornhub.com')) return;

    const phTracker = new ElementTracker();

    // Pornhub 后台不暂停视频
    (function no_pause_on_background() {
        Object.defineProperty(document, 'hidden', { get: () => false });
        Object.defineProperty(document, 'visibilityState', { get: () => 'visible' });

        const _add = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function (type, fn, opt) {
            if (type === 'visibilitychange') return;
            return _add.call(this, type, fn, opt);
        };

        const _pause = HTMLMediaElement.prototype.pause;
        HTMLMediaElement.prototype.pause = function () {
            if (document.hidden) return;
            return _pause.apply(this, arguments);
        };
    })();

    // 替换 pornhub.com 图标
    document.querySelectorAll('link[rel*="icon"]').forEach(link => {
        link.href = 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
            <circle cx="32" cy="32" r="32" fill="black"/>
            <text x="32" y="42" text-anchor="middle" font-size="32" fill="white">PH</text>
        </svg>`);
        link.type = 'image/svg+xml';
    });

    // 跳过年龄验证弹窗
    phTracker.track('.modalMTubes.ageDisclaimer', (modal) => {
        // 1. 尝试触发原生的进入按钮事件（会自动写入站点的 18+ Cookie）
        const enterBtn = modal.querySelector('.buttonOver18, .js-closeAgeModal');
        if (enterBtn) {
            enterBtn.click();
        }

        // 2. 强行隐藏并移除弹窗节点
        modal.style.display = 'none';
        modal.remove();

        // 3. 恢复页面可能被锁定的滚动条
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
    });

    // 切换GIF静音图标
    phTracker.track('#js-volumeToggle', volBtn => {
        volBtn.classList.remove('muted');
    });

    // 优先显示原始标题
    phTracker.track('.title-container, .headerWrap', (container) => {
        // 适配移动端与桌面端的标题节点选择器
        const titleSpan = container.querySelector('h1 .inlineFree') || container.querySelector('.inlineFree');
        const btn = container.querySelector('.js-originalTranslation');
        const swapTitleText = btn ? btn.querySelector('.swapTitle') : null;

        if (window.VIDEO_SHOW && window.VIDEO_SHOW.videoTitleOriginal && titleSpan) {
            const targetTitle = window.VIDEO_SHOW.videoTitleOriginal.trim();
            const currentTitle = titleSpan.innerHTML.trim();
            // 修改网页标题
            document.title = targetTitle;
            // 核心：当标题内容不等于原标题时强行替换
            if (currentTitle !== targetTitle) {
                // A. 替换 DOM 渲染文本
                titleSpan.innerHTML = targetTitle;

                // B. 关键点：将移动端原生脚本依赖的 titleWrapper 强行重定向为当前节点的父级
                // 防止网页自身后续调用 titleWrapper.innerHTML 时更新错误的位置
                window.titleWrapper = titleSpan;

                // C. 修正按钮样式与状态文字
                if (btn) btn.classList.add('original');
                if (swapTitleText) {
                    swapTitleText.textContent = window.VIDEO_SHOW.seeTranslatedTitle || '查看翻译标题';
                }
            }
        }
    });

    // GIF 小图链接按钮
    // 追踪含有 data-gif 属性的 div 元素
    phTracker.track('div[data-gif]', wrapper => {
        // 避免重复添加按钮
        if (wrapper.querySelector('.custom-gif-link-btn')) return;
        // 获取链接
        const gifUrl = wrapper.getAttribute('data-gif');
        // 创建按钮
        const btn = document.createElement('a');
        btn.href = gifUrl;
        btn.target = '_blank';
        btn.innerText = 'GIF';
        btn.className = 'custom-gif-link-btn';

        // 设置按钮样式
        Object.assign(btn.style, {
            position: 'absolute',
            right: '2px',
            bottom: '2px',
            width: 'auto',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            color: '#fff',
            padding: '2px 4px',
            borderRadius: '3px',
            fontSize: '12px',
            zIndex: '10', // 确保在图片上层但不过高
            pointerEvents: 'auto'
        });

        // 获取父级容器
        const container = wrapper.parentElement;
        // 挂载按钮到父级容器
        container.appendChild(btn);
    });

    // GIF 与 Video 搜索页互转按钮
    if (url.includes('search')) {
        const pageUrl = new URL(url);
        // 修正官方的错误链接（video?search 或 gif?search）
        const pageType = pageUrl.pathname.match(/^\/(video|gif|gifs)$/)?.[1];
        if (pageType) {
            pageUrl.pathname = `/${pageType}/search`;
            window.location.replace(pageUrl.href);
            return;
        }

        const isVideo = pageUrl.pathname.startsWith('/video');
        const targetType = isVideo ? 'gif' : 'video';
        pageUrl.pathname = `/${targetType}/search`;

        // 创建按钮
        const button = document.createElement('a');
        button.textContent = isVideo ? 'ToGIF' : 'ToVideo';
        button.href = pageUrl.href;
        // button.target = '_blank'; // 新标签页打开

        // 设置按钮样式
        Object.assign(button.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '6px 8px',
            zIndex: 10,
            backgroundColor: '#ff9900',
            color: 'white',
            border: 'none',
            borderRadius: '999px', // 药丸形状
            cursor: 'pointer',
            fontSize: '14px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
        });
        // 挂载按钮到 body
        document.body.appendChild(button);
    }

})();

// sex.com 处理
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

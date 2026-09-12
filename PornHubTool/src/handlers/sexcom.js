import ElementTracker from '../core/ElementTracker.js';

export default function initSexcomHandler() {
    const url = window.location.href;
    if (!url.includes('sex.com')) return;
    const tracker = new ElementTracker();
    tracker.track('img[data-testid="pin-carousel-image"]', img => {
        const imgUrl = img.src;
        console.warn('发现 GIF 图片', imgUrl);
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
        searchBtn.onclick = () => {
            const searchUrl = `https://namethatporn.com/search/images.html?url=${encodeURIComponent(imgUrl)}`;
            window.open(searchUrl, '_blank');
        };
        img.parentElement.style.position = 'relative';
        img.parentElement.appendChild(searchBtn);
        console.warn('已添加 NameThatPorn 搜索按钮');
    });
}

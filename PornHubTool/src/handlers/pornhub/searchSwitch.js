function createSwitchButton(pageUrl, isVideo) {
    const button = document.createElement('a');
    button.textContent = isVideo ? 'ToGIF' : 'ToVideo';
    button.href = pageUrl.href;

    Object.assign(button.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '6px 8px',
        zIndex: 10,
        backgroundColor: '#ff9900',
        color: 'white',
        border: 'none',
        borderRadius: '999px',
        cursor: 'pointer',
        fontSize: '14px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
    });

    document.body.appendChild(button);
}

export default function addSearchSwitch(url) {
    if (!url.includes('search')) return;

    const pageUrl = new URL(url);
    const pageType = pageUrl.pathname.match(/^\/(video|gif|gifs)$/)?.[1];
    if (pageType) {
        pageUrl.pathname = `/${pageType}/search`;
        window.location.replace(pageUrl.href);
        return;
    }

    const isVideo = pageUrl.pathname.startsWith('/video');
    pageUrl.pathname = `/${isVideo ? 'gif' : 'video'}/search`;
    createSwitchButton(pageUrl, isVideo);
}

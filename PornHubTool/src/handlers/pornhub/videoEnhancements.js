export function dismissAgeDisclaimer(tracker) {
    tracker.track('.modalMTubes.ageDisclaimer', modal => {
        const enterButton = modal.querySelector('.buttonOver18, .js-closeAgeModal');
        if (enterButton) enterButton.click();
        modal.style.display = 'none';
        modal.remove();
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
    });
}

export function unmuteGif(tracker) {
    tracker.track('#js-volumeToggle', volumeButton => {
        volumeButton.classList.remove('muted');
    });
}

export function showOriginalTitle(tracker) {
    tracker.track('.title-container, .headerWrap', container => {
        const title = container.querySelector('h1 .inlineFree') || container.querySelector('.inlineFree');
        const button = container.querySelector('.js-originalTranslation');
        const translatedTitle = button ? button.querySelector('.swapTitle') : null;

        if (window.VIDEO_SHOW?.videoTitleOriginal && title) {
            const originalTitle = window.VIDEO_SHOW.videoTitleOriginal.trim();
            const currentTitle = title.innerHTML.trim();
            document.title = originalTitle;
            if (currentTitle !== originalTitle) {
                title.innerHTML = originalTitle;
                window.titleWrapper = title;
                if (button) button.classList.add('original');
                if (translatedTitle) {
                    translatedTitle.textContent = window.VIDEO_SHOW.seeTranslatedTitle || '查看翻译标题';
                }
            }
        }
    });
}

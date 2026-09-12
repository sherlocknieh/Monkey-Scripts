export default function addGifLink(tracker) {
    tracker.track('div[data-gif]', wrapper => {
        if (wrapper.querySelector('.custom-gif-link-btn')) return;

        const button = document.createElement('a');
        button.href = wrapper.getAttribute('data-gif');
        button.target = '_blank';
        button.innerText = 'GIF';
        button.className = 'custom-gif-link-btn';

        Object.assign(button.style, {
            position: 'absolute',
            right: '2px',
            bottom: '2px',
            width: 'auto',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            color: '#fff',
            padding: '2px 4px',
            borderRadius: '3px',
            fontSize: '12px',
            zIndex: '10',
            pointerEvents: 'auto'
        });

        wrapper.parentElement.appendChild(button);
    });
}

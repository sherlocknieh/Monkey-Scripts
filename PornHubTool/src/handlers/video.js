import ElementTracker from '../core/ElementTracker.js';

export default function initVideoHandler() {
    const tracker = new ElementTracker();
    tracker.track('video', v => {
        v.volume = 0.5;
        v.muted = false;
        if ((window.location.href).includes('musedam.cc'))
            v.play();
    });
}

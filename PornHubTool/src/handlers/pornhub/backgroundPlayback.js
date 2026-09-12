export default function disableBackgroundPause() {
    Object.defineProperty(document, 'hidden', { get: () => false });
    Object.defineProperty(document, 'visibilityState', { get: () => 'visible' });

    const addEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, listener, options) {
        if (type === 'visibilitychange') return;
        return addEventListener.call(this, type, listener, options);
    };

    const pause = HTMLMediaElement.prototype.pause;
    HTMLMediaElement.prototype.pause = function () {
        if (document.hidden) return;
        return pause.apply(this, arguments);
    };
}

// 动态元素跟踪器
export default class ElementTracker {
    constructor() {
        // 单例模式
        if (ElementTracker.instance) {
            return ElementTracker.instance;
        }
        ElementTracker.instance = this;

        this.root = document.body;
        this.seen = new WeakSet();
        this.selectorMap = new Map();
        this.observer = new MutationObserver(this._handleMutations.bind(this));
        this.observer.observe(this.root, { childList: true, subtree: true });
    }

    track(selector, callback) {
        this.selectorMap.set(selector, callback);
        this.root.querySelectorAll(selector).forEach(el => {
            if (!this.seen.has(el)) {
                this.seen.add(el);
                callback(el);
            }
        });
        return this;
    }

    _handleMutations(mutationsList) {
        for (const mutation of mutationsList) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1) {
                    this.selectorMap.forEach((callback, selector) => {
                        if (node.matches?.(selector) && !this.seen.has(node)) {
                            this.seen.add(node);
                            callback(node);
                        }
                        node.querySelectorAll?.(selector)?.forEach(elem => {
                            if (!this.seen.has(elem)) {
                                this.seen.add(elem);
                                callback(elem);
                            }
                        });
                    });
                }
            }
        }
    }
}

// 使用示例
// const tracker = new ElementTracker();
// tracker.track('img[data-testid="pin-carousel-image"]', img => {
//     // 处理图片元素
// });
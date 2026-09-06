// ==UserScript==
// @name         pornhub-tool
// @namespace    npm/vite-plugin-monkey
// @version      2026.9.7.0244
// @description  视频自动取消静音, Pornhub 标签栏图标替换, GIF 搜索页与 Video 搜索页跳转按钮, Musedam 视频自动播放, Greasyfork 和 Sleazyfork 页面互链
// @icon         https://vitejs.dev/logo.svg
// @match        https://greasyfork.org/*
// @match        https://sleazyfork.org/*
// @match        https://*.pornhub.com/*
// @match        https://musedam.cc/*
// @match        https://nsfw.xxx/*
// @match        https://rule34.xxx/*
// @match        https://anacams.com/post/*
// @match        https://www.sex.com/*/gifs/*
// @grant        none
// ==/UserScript==

(function() {
	"use strict";
	var ElementTracker = class ElementTracker {
		constructor() {
			if (ElementTracker.instance) return ElementTracker.instance;
			ElementTracker.instance = this;
			this.root = document.body;
			this.seen = new WeakSet();
			this.selectorMap = new Map();
			this.observer = new MutationObserver(this._handleMutations.bind(this));
			this.observer.observe(this.root, {
				childList: true,
				subtree: true
			});
		}
		track(selector, callback) {
			this.selectorMap.set(selector, callback);
			this.root.querySelectorAll(selector).forEach((el) => {
				if (!this.seen.has(el)) {
					this.seen.add(el);
					callback(el);
				}
			});
			return this;
		}
		_handleMutations(mutationsList) {
			for (const mutation of mutationsList) for (const node of mutation.addedNodes) if (node.nodeType === 1) this.selectorMap.forEach((callback, selector) => {
				if (node.matches?.(selector) && !this.seen.has(node)) {
					this.seen.add(node);
					callback(node);
				}
				node.querySelectorAll?.(selector)?.forEach((elem) => {
					if (!this.seen.has(elem)) {
						this.seen.add(elem);
						callback(elem);
					}
				});
			});
		}
	};
	(function handle_video() {
		new ElementTracker().track("video", (v) => {
			v.volume = .5;
			v.muted = false;
			if (window.location.href.includes("musedam.cc")) v.play();
		});
	})();
	(function handle_pornhub() {
		const url = window.location.href;
		if (!url.includes("pornhub.com")) return;
		const phTracker = new ElementTracker();
		(function no_pause_on_background() {
			Object.defineProperty(document, "hidden", { get: () => false });
			Object.defineProperty(document, "visibilityState", { get: () => "visible" });
			const _add = EventTarget.prototype.addEventListener;
			EventTarget.prototype.addEventListener = function(type, fn, opt) {
				if (type === "visibilitychange") return;
				return _add.call(this, type, fn, opt);
			};
			const _pause = HTMLMediaElement.prototype.pause;
			HTMLMediaElement.prototype.pause = function() {
				if (document.hidden) return;
				return _pause.apply(this, arguments);
			};
		})();
		document.querySelectorAll("link[rel*=\"icon\"]").forEach((link) => {
			link.href = "data:image/svg+xml;base64," + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
            <circle cx="32" cy="32" r="32" fill="black"/>
            <text x="32" y="42" text-anchor="middle" font-size="32" fill="white">PH</text>
        </svg>`);
			link.type = "image/svg+xml";
		});
		phTracker.track(".modalMTubes.ageDisclaimer", (modal) => {
			const enterBtn = modal.querySelector(".buttonOver18, .js-closeAgeModal");
			if (enterBtn) enterBtn.click();
			modal.style.display = "none";
			modal.remove();
			document.body.style.overflow = "auto";
			document.documentElement.style.overflow = "auto";
		});
		phTracker.track("#js-volumeToggle", (volBtn) => {
			volBtn.classList.remove("muted");
		});
		phTracker.track(".title-container, .headerWrap", (container) => {
			const titleSpan = container.querySelector("h1 .inlineFree") || container.querySelector(".inlineFree");
			const btn = container.querySelector(".js-originalTranslation");
			const swapTitleText = btn ? btn.querySelector(".swapTitle") : null;
			if (window.VIDEO_SHOW && window.VIDEO_SHOW.videoTitleOriginal && titleSpan) {
				const targetTitle = window.VIDEO_SHOW.videoTitleOriginal.trim();
				const currentTitle = titleSpan.innerHTML.trim();
				document.title = targetTitle;
				if (currentTitle !== targetTitle) {
					titleSpan.innerHTML = targetTitle;
					window.titleWrapper = titleSpan;
					if (btn) btn.classList.add("original");
					if (swapTitleText) swapTitleText.textContent = window.VIDEO_SHOW.seeTranslatedTitle || "查看翻译标题";
				}
			}
		});
		phTracker.track("div[data-gif]", (wrapper) => {
			if (wrapper.querySelector(".custom-gif-link-btn")) return;
			const gifUrl = wrapper.getAttribute("data-gif");
			const btn = document.createElement("a");
			btn.href = gifUrl;
			btn.target = "_blank";
			btn.innerText = "GIF";
			btn.className = "custom-gif-link-btn";
			Object.assign(btn.style, {
				position: "absolute",
				right: "2px",
				bottom: "2px",
				width: "auto",
				backgroundColor: "rgba(0, 0, 0, 0.6)",
				color: "#fff",
				padding: "2px 4px",
				borderRadius: "3px",
				fontSize: "12px",
				zIndex: "10",
				pointerEvents: "auto"
			});
			wrapper.parentElement.appendChild(btn);
		});
		if (url.includes("search")) {
			const pageUrl = new URL(url);
			const pageType = pageUrl.pathname.match(/^\/(video|gif|gifs)$/)?.[1];
			if (pageType) {
				pageUrl.pathname = `/${pageType}/search`;
				window.location.replace(pageUrl.href);
				return;
			}
			const isVideo = pageUrl.pathname.startsWith("/video");
			pageUrl.pathname = `/${isVideo ? "gif" : "video"}/search`;
			const button = document.createElement("a");
			button.textContent = isVideo ? "ToGIF" : "ToVideo";
			button.href = pageUrl.href;
			Object.assign(button.style, {
				position: "fixed",
				bottom: "20px",
				right: "20px",
				padding: "6px 8px",
				zIndex: 10,
				backgroundColor: "#ff9900",
				color: "white",
				border: "none",
				borderRadius: "999px",
				cursor: "pointer",
				fontSize: "14px",
				boxShadow: "0 2px 5px rgba(0,0,0,0.3)"
			});
			document.body.appendChild(button);
		}
	})();
	(function handle_sexcom() {
		if (!window.location.href.includes("sex.com")) return;
		new ElementTracker().track("img[data-testid=\"pin-carousel-image\"]", (img) => {
			const imgUrl = img.src;
			console.warn("发现 GIF 图片", imgUrl);
			const searchBtn = document.createElement("button");
			searchBtn.textContent = "NameThatPorn";
			Object.assign(searchBtn.style, {
				position: "absolute",
				bottom: "10px",
				right: "10px",
				padding: "5px 10px",
				backgroundColor: "rgba(0,0,0,0.6)",
				color: "white",
				border: "none",
				borderRadius: "4px",
				cursor: "pointer",
				fontSize: "12px",
				zIndex: 1e3
			});
			searchBtn.onclick = () => {
				const searchUrl = `https://namethatporn.com/search/images.html?url=${encodeURIComponent(imgUrl)}`;
				window.open(searchUrl, "_blank");
			};
			img.parentElement.style.position = "relative";
			img.parentElement.appendChild(searchBtn);
			console.warn("已添加 NameThatPorn 搜索按钮");
		});
	})();
	(function handle_fork() {
		const url = window.location.href;
		const isGreasy = url.includes("greasyfork.org");
		const isSleazy = url.includes("sleazyfork.org");
		if (!isGreasy && !isSleazy) return;
		const target = url.replace(isGreasy ? "greasyfork" : "sleazyfork", isGreasy ? "sleazyfork" : "greasyfork");
		const nav = document.querySelector("#site-nav > nav");
		const li = document.createElement("li");
		const a = document.createElement("a");
		a.href = target;
		a.textContent = isGreasy ? "SleazyFork" : "GreasyFork";
		li.appendChild(a);
		if (nav.firstChild) nav.insertBefore(li, nav.firstChild);
		else nav.appendChild(li);
	})();
})();

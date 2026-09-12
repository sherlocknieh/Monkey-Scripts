// ==UserScript==
// @name         PornHubTool
// @namespace    npm/vite-plugin-monkey
// @version      2026.9.12.0
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
	function initVideoHandler() {
		new ElementTracker().track("video", (v) => {
			v.volume = .5;
			v.muted = false;
			if (window.location.href.includes("musedam.cc")) v.play();
		});
	}
	function disableBackgroundPause() {
		Object.defineProperty(document, "hidden", { get: () => false });
		Object.defineProperty(document, "visibilityState", { get: () => "visible" });
		const addEventListener = EventTarget.prototype.addEventListener;
		EventTarget.prototype.addEventListener = function(type, listener, options) {
			if (type === "visibilitychange") return;
			return addEventListener.call(this, type, listener, options);
		};
		const pause = HTMLMediaElement.prototype.pause;
		HTMLMediaElement.prototype.pause = function() {
			if (document.hidden) return;
			return pause.apply(this, arguments);
		};
	}
	var favicon = "data:image/svg+xml;base64," + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
    <circle cx="32" cy="32" r="32" fill="black"/>
    <text x="32" y="42" text-anchor="middle" font-size="32" fill="white">PH</text>
</svg>`);
	function replaceFavicon() {
		document.querySelectorAll("link[rel*=\"icon\"]").forEach((link) => {
			link.href = favicon;
			link.type = "image/svg+xml";
		});
	}
	function dismissAgeDisclaimer(tracker) {
		tracker.track(".modalMTubes.ageDisclaimer", (modal) => {
			const enterButton = modal.querySelector(".buttonOver18, .js-closeAgeModal");
			if (enterButton) enterButton.click();
			modal.style.display = "none";
			modal.remove();
			document.body.style.overflow = "auto";
			document.documentElement.style.overflow = "auto";
		});
	}
	function unmuteGif(tracker) {
		tracker.track("#js-volumeToggle", (volumeButton) => {
			volumeButton.classList.remove("muted");
		});
	}
	function showOriginalTitle(tracker) {
		tracker.track(".title-container, .headerWrap", (container) => {
			const title = container.querySelector("h1 .inlineFree") || container.querySelector(".inlineFree");
			const button = container.querySelector(".js-originalTranslation");
			const translatedTitle = button ? button.querySelector(".swapTitle") : null;
			if (window.VIDEO_SHOW?.videoTitleOriginal && title) {
				const originalTitle = window.VIDEO_SHOW.videoTitleOriginal.trim();
				const currentTitle = title.innerHTML.trim();
				document.title = originalTitle;
				if (currentTitle !== originalTitle) {
					title.innerHTML = originalTitle;
					window.titleWrapper = title;
					if (button) button.classList.add("original");
					if (translatedTitle) translatedTitle.textContent = window.VIDEO_SHOW.seeTranslatedTitle || "查看翻译标题";
				}
			}
		});
	}
	function addGifLink(tracker) {
		tracker.track("div[data-gif]", (wrapper) => {
			if (wrapper.querySelector(".custom-gif-link-btn")) return;
			const button = document.createElement("a");
			button.href = wrapper.getAttribute("data-gif");
			button.target = "_blank";
			button.innerText = "GIF";
			button.className = "custom-gif-link-btn";
			Object.assign(button.style, {
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
			wrapper.parentElement.appendChild(button);
		});
	}
	function createSwitchButton(pageUrl, isVideo) {
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
	function addSearchSwitch(url) {
		if (!url.includes("search")) return;
		const pageUrl = new URL(url);
		const pageType = pageUrl.pathname.match(/^\/(video|gif|gifs)$/)?.[1];
		if (pageType) {
			pageUrl.pathname = `/${pageType}/search`;
			window.location.replace(pageUrl.href);
			return;
		}
		const isVideo = pageUrl.pathname.startsWith("/video");
		pageUrl.pathname = `/${isVideo ? "gif" : "video"}/search`;
		createSwitchButton(pageUrl, isVideo);
	}
	function initPornhubHandler() {
		const url = window.location.href;
		if (!url.includes("pornhub.com")) return;
		const tracker = new ElementTracker();
		disableBackgroundPause();
		replaceFavicon();
		dismissAgeDisclaimer(tracker);
		unmuteGif(tracker);
		showOriginalTitle(tracker);
		addGifLink(tracker);
		addSearchSwitch(url);
	}
	function initSexcomHandler() {
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
	}
	function initGreasyforkHandler() {
		const url = window.location.href;
		const isGreasy = url.includes("greasyfork.org");
		const isSleazy = url.includes("sleazyfork.org");
		if (!isGreasy && !isSleazy) return;
		const target = url.replace(isGreasy ? "greasyfork" : "sleazyfork", isGreasy ? "sleazyfork" : "greasyfork");
		const nav = document.querySelector("#site-nav > nav");
		const li = document.createElement("li");
		const link = document.createElement("a");
		link.href = target;
		link.textContent = isGreasy ? "SleazyFork" : "GreasyFork";
		li.appendChild(link);
		if (nav.firstChild) nav.insertBefore(li, nav.firstChild);
		else nav.appendChild(li);
	}
	initVideoHandler();
	initPornhubHandler();
	initSexcomHandler();
	initGreasyforkHandler();
})();

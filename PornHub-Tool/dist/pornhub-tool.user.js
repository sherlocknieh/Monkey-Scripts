// ==UserScript==
// @name         pornhub-tool
// @namespace    npm/vite-plugin-monkey
// @version      2026.11.21.2200
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
		document.querySelectorAll("link[rel*=\"icon\"]").forEach((link) => {
			link.href = "data:image/svg+xml;base64," + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
                <circle cx="32" cy="32" r="32" fill="black"/>
                <text x="32" y="42" text-anchor="middle" font-size="32" fill="white">PH</text>
            </svg>`);
			link.type = "image/svg+xml";
		});
		new ElementTracker().track("#js-volumeToggle", (volBtn) => {
			volBtn.classList.remove("muted");
		});
		if (url.includes("search")) {
			const isVideo = url.includes("video/search");
			const button = document.createElement("button");
			button.textContent = isVideo ? "GIF" : "Video";
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
				fontSize: "12px",
				boxShadow: "0 2px 5px rgba(0,0,0,0.3)"
			});
			button.onclick = () => {
				const newUrl = isVideo ? url.replace("video", "gifs") : url.replace("gifs", "video");
				window.location.replace(newUrl);
			};
			document.body.appendChild(button);
		}
		(function() {
			const wrappers = document.querySelectorAll("div[data-gif]");
			let count = 0;
			wrappers.forEach((wrapper) => {
				if (wrapper.parentElement.querySelector(".custom-gif-link-btn")) return;
				const gifUrl = wrapper.getAttribute("data-gif");
				if (!gifUrl) return;
				const container = wrapper.parentElement;
				if (window.getComputedStyle(container).position === "static") container.style.position = "relative";
				const btn = document.createElement("a");
				btn.href = gifUrl;
				btn.target = "_blank";
				btn.innerText = "GIF";
				btn.className = "custom-gif-link-btn";
				Object.assign(btn.style, {
					position: "absolute",
					right: "5px",
					bottom: "2px",
					backgroundColor: "rgba(0, 0, 0, 0.6)",
					color: "#ffffff",
					padding: "3px 3px",
					borderRadius: "5px",
					fontSize: "10px",
					fontWeight: "bold",
					textDecoration: "none",
					fontFamily: "Arial, sans-serif",
					border: "1px solid rgba(255, 255, 255, 0.2)",
					width: "auto",
					left: "auto",
					display: "inline-block",
					backdropFilter: "blur(2px)",
					boxSizing: "border-box"
				});
				btn.onmouseover = () => btn.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
				btn.onmouseout = () => btn.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
				container.appendChild(btn);
				count++;
			});
			console.log(`已成功添加 ${count} 个半透明 GIF 下载按钮。`);
		})();
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

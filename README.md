## 油猴脚本


- [TV剧集信息提取器](https://github.com/sherlocknieh/Monkey-Scripts/raw/main/src/TV-Score-Extraction.user.js)

- [Porn GIF 工具](https://github.com/sherlocknieh/Monkey-Scripts/raw/main/src/Porn-GIF-Tools.user.js)

- [调试脚本](https://github.com/sherlocknieh/Monkey-Scripts/raw/main/src/Debug-Script.user.js)


## 开发指南


1. **创建项目：**
```bash
pnpm create monkey
# 或 npm create monkey

```


2. **按照提示选择框架：** 支持 Vanilla JS/TS、Vue、React、Svelte 等。
3. **启动开发服务：**
```bash
pnpm dev

```


终端会输出一个本地服务链接，点击后 Tampermonkey 会提示安装开发版脚本。之后你在 VS Code 修改代码，浏览器页面会**实时热更新（HMR）**，无需手动刷新。
4. **打包构建：**
```bash
pnpm build

```


会自动生成最终可直接发布到 Greasy Fork 的单个 `.user.js` 文件。

---
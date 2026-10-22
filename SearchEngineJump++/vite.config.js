import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import monkey from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  // Wikipedia 等站点的 CSP 只允许 localhost，不允许 127.0.0.1
  server: { host: 'localhost' },
  plugins: [
    vue(),
    monkey({
      entry: 'src/main.js',
      userscript: {
        name: 'SearchEngineJump++',
        namespace:'npm/vite-plugin-monkey',
        version: '2026.10.22.20',
        description:
          'Fork 版本搜索引擎跳转脚本，Vue 重构版。在搜索页插入跳转小横条，支持划词搜索、分类下拉、设置菜单等。',
        author: 'NLF & 锐经 & iqxin & MUTED64',
        license: 'MIT',
        icon: 'https://www.google.com/favicon.ico',
        match: ['*://*/*'],
        exclude: ['*://mega.nz/*'],
        noframes: true,
        runAt: 'document-idle',
        grant: [
          'window.onurlchange',
          'GM_xmlhttpRequest',
          'GM_addValueChangeListener',
          'GM_removeValueChangeListener',
          'GM.getValue',
          'GM.setValue',
          'GM.deleteValue',
          'GM.addValueChangeListener',
          'GM.removeValueChangeListener',
        ],
        connect: ['*'],
      },
      build: {
        fileName: 'search-engine-jump.user.js',
      },
    }),
  ],
});

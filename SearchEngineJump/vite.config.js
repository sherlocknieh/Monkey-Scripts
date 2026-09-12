import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import monkey from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    monkey({
      entry: 'src/main.js',
      userscript: {
        name: 'SearchEngineJumpPlus 搜索引擎快捷跳转+',
        namespace:
          'https://greasyfork.org/en/scripts/454280-searchenginejumpplus',
        version: '5.32.7',
        description:
          'Fork 版本搜索引擎跳转脚本，Vue 重构版。在搜索页插入跳转小横条，支持划词搜索、分类下拉、设置菜单等。',
        author: 'NLF & 锐经 & iqxin & MUTED64',
        license: 'MIT',
        icon: 'https://www.google.com/favicon.ico',
        match: ['*://**/*'],
        exclude: ['*://mega.nz/*'],
        noframes: true,
        runAt: 'document-idle',
      },
      build: {
        fileName: 'search-engine-jump.user.js',
      },
    }),
  ],
});

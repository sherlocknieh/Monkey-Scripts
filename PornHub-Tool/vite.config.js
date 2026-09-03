import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.js',
      userscript: {
        icon: 'https://vitejs.dev/logo.svg',
        namespace: 'npm/vite-plugin-monkey',
        match: [
          'https://greasyfork.org/*',
          'https://sleazyfork.org/*',
          'https://*.pornhub.com/*',
          'https://musedam.cc/*',
          'https://nsfw.xxx/*',
          'https://rule34.xxx/*',
          'https://anacams.com/post/*',
          'https://www.sex.com/*/gifs/*'
        ],
        grant: 'none',
        description: '视频自动取消静音, Pornhub 标签栏图标替换, GIF 搜索页与 Video 搜索页跳转按钮, Musedam 视频自动播放, Greasyfork 和 Sleazyfork 页面互链',
      },
    }),
  ],
});

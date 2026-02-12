import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import monkey from 'vite-plugin-monkey';
import pkg from './package.json';

export default defineConfig({
  plugins: [
    vue({
      features: {
        customElement: /\.ce\.vue$/,
      },
    }),
    {
      name: 'inject-env-vars',
      config() {
        return {
          define: {
            'process.env.NULLBR_APP_ID': JSON.stringify(process.env.NULLBR_APP_ID),
            'process.env.NULLBR_API_KEY': JSON.stringify(process.env.NULLBR_API_KEY),
          },
        };
      },
    },
    monkey({
      entry: 'src/main.ts',  // 暂时保持.js,稍后迁移
      userscript: {
        name: 'Emby Launchpad - Emby 媒体库助手',
        namespace: 'http://tampermonkey.net/',
        version: pkg.version,
        description: '在豆瓣(Douban)、GYG、DMHY 等网站上自动检测 Emby 服务端库内是否存在当前影视。提供 Nullbr 快捷资源检索，支持搜索115网盘和磁链内容; 提供 TMDB/IMDb 评分, gyg.si/bt4gprx.com 资源搜索链接。支持 Web Components 现代化 UI。',
        author: 'leo',
        match: [
          'https://movie.douban.com/*',
          'https://m.douban.com/*',
          'https://www.gyg.si/*',
          'https://dmhy.org/*',
        ],
        connect: [
          'api.themoviedb.org',
          'www.gyg.si',
          'www.imdb.com',
          'www.rottentomatoes.com',
          'api.bgm.tv',
          'api.nullbr.eu.org',
        ],
        license: 'MIT',
        grant: [
          'GM_xmlhttpRequest',
          'GM_addStyle',
          'GM_setClipboard',
          'GM_getValue',
          'GM_setValue',
          'GM_listValues',
          'GM_deleteValue',
          'GM_registerMenuCommand',
          'GM_getResourceText',
        ],
      },
      server: { mountGmApi: true },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});

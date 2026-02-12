import { defineCustomElement } from 'vue';
import { adapterEngine } from '@/adapters/engine';
import doubanConfig from '@/adapters/douban';
import { gygConfig } from '@/adapters/gyg';
import { dmhyConfig } from '@/adapters/dmhy';
import type { SiteConfig } from '@/types/adapter';

// Import Vue CE components
import StatusDotCE from '@/components/StatusDot.ce.vue';
import InfoCardCE from '@/components/InfoCard.ce.vue';
import SettingsCE from '@/components/Settings.ce.vue';

// Register Custom Elements
const StatusDotElement = defineCustomElement(StatusDotCE);
const InfoCardElement = defineCustomElement(InfoCardCE);
const SettingsElement = defineCustomElement(SettingsCE);

customElements.define('us-status-dot', StatusDotElement);
customElements.define('us-info-card', InfoCardElement);
customElements.define('us-settings', SettingsElement);

// Inject global styles for host-page integration (non-Shadow-DOM elements like GYG cards)
GM.addStyle(`
  .tmdb-wrapper { animation: fadeIn 0.5s ease; display: flex; flex-direction: column; gap: 10px; }
  .gyg-card { display: flex; flex-direction: column; padding: 10px; background: white; border-radius: 8px; border: 1px solid #eee; box-shadow: 0 1px 4px rgba(0,0,0,0.05); transition: all 0.2s; }
  .tmdb-header-row { display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
  .tmdb-source { font-size: 12px; color: #888; font-weight: bold; }
  .tmdb-score { font-size: 20px; font-weight: bold; color: #01b4e4; }
  .tmdb-copy-area { margin-top: 8px; padding-top: 8px; border-top: 1px dashed #ddd; font-size: 13px; color: #555; cursor: copy; position: relative; transition: color 0.2s; display: flex; align-items: center; justify-content: space-between; }
  .tmdb-copy-area:hover { color: #01b4e4; }
  .emby-card { display: flex; flex-direction: row; justify-content: space-between; align-items: center; cursor: pointer; }
  .emby-card:hover { background: rgba(0,0,0,0.02); }
  .emby-label { font-size: 13px; font-weight: bold; color: #333; }
  .emby-badge { padding: 2px 8px; border-radius: 4px; color: white; font-weight: bold; font-size: 11px; }
  .emby-yes { background-color: #52B54B; }
  .emby-no { background-color: #999; }
  .emby-loading { background-color: #ddd; color: #666; }
  .douban-aside-box { margin-bottom: 30px; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
`);

// All site configs
const configs: SiteConfig[] = [
  doubanConfig,
  gygConfig,
  dmhyConfig,
];

// Main entry
(function () {
  'use strict';

  // Register menu commands for settings / cache
  GM_registerMenuCommand('设置 / Settings', () => {
    showSettings('settings');
  });

  GM_registerMenuCommand('清除缓存 / Clear Cache', () => {
    showSettings('cache');
  });

  // Config-driven adapter dispatch
  const url = location.href;
  for (const config of configs) {
    if (config.match(url)) {
      adapterEngine.run(config);
      break;
    }
  }
})();

function showSettings(mode: 'settings' | 'cache'): void {
  const existing = document.querySelector('us-settings');
  if (existing) existing.remove();

  const settings = document.createElement('us-settings');
  settings.setAttribute('visible', 'true');
  settings.setAttribute('mode', mode);

  settings.addEventListener('close', () => {
    settings.remove();
  });

  document.body.appendChild(settings);
}

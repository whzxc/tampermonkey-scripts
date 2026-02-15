import { adapterEngine } from '@/adapters/engine';
import doubanConfig from '@/adapters/douban';
import { gygConfig } from '@/adapters/gyg';
import { dmhyConfig } from '@/adapters/dmhy';
import { uiController } from '@/services/ui-controller';
import type { SiteConfig } from '@/types/adapter';

// Inject global styles
import tailwindStyles from './style.css?inline';
if (tailwindStyles) {
  GM.addStyle(tailwindStyles);
} else {
  console.warn('[Emby Launchpad] Tailwind Styles is Empty!');
}

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
    uiController.showSettings();
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

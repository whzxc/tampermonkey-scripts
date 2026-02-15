import { reactive } from 'vue';
import pkg from '../../package.json';

export interface ServiceConfig {
  apiKey?: string;
  baseUrl?: string;
  server?: string;
  cacheTTL?: number;
  userAgent?: string;
  selectedLibraries?: string[];

  [key: string]: any;
}

export interface UserConfig {
  tmdb: ServiceConfig;
  emby: ServiceConfig;
  bangumi: ServiceConfig;
  imdb: ServiceConfig;
  nullbr: ServiceConfig;
  state: Record<string, never>;
}

type ConfigListener = (service: string, config: ServiceConfig) => void;

class ConfigManager {
  readonly config: UserConfig;
  private listeners: ConfigListener[] = [];

  constructor() {
    this.config = reactive<UserConfig>({
      tmdb: {
        apiKey: GM_getValue('tmdb_api_key', ''),
        baseUrl: 'https://api.themoviedb.org/3',
        language: 'zh-CN',
        cacheTTL: 1440,
      },
      emby: {
        server: GM_getValue('emby_server', ''),
        apiKey: GM_getValue('emby_api_key', ''),
        selectedLibraries: JSON.parse(GM_getValue('emby_selected_libraries', 'null')),
        cacheTTL: 60,
      },
      bangumi: {
        apiKey: GM_getValue('bangumi_token', ''),
        baseUrl: 'https://api.bgm.tv',
        cacheTTL: 1440,
      },
      imdb: {
        baseUrl: 'https://www.imdb.com',
        cacheTTL: 10080,
      },
      nullbr: {
        baseUrl: 'https://api.nullbr.eu.org',
        apiKey: GM_getValue('nullbr_api_key'),
        cacheTTL: 10080,
        userAgent: `emby-launchpad/${pkg.version}`,
        enable115: GM_getValue('nullbr_enable_115', true),
        enableMagnet: GM_getValue('nullbr_enable_magnet', false),
      },
      state: {},
    });
  }

  update(service: 'tmdb' | 'emby' | 'bangumi' | 'nullbr' | 'state', updates: Partial<ServiceConfig>): void {
    const config = this.config[service] as ServiceConfig;
    Object.assign(config, updates);

    if (service === 'tmdb' && updates.apiKey !== undefined) {
      GM_setValue('tmdb_api_key', updates.apiKey);
    } else if (service === 'emby') {
      if (updates.server !== undefined) GM_setValue('emby_server', updates.server);
      if (updates.apiKey !== undefined) GM_setValue('emby_api_key', updates.apiKey);
      if (updates.selectedLibraries !== undefined) GM_setValue('emby_selected_libraries', JSON.stringify(updates.selectedLibraries));
    } else if (service === 'bangumi' && updates.apiKey !== undefined) {
      GM_setValue('bangumi_token', updates.apiKey);
    } else if (service === 'nullbr') {
      if (updates.appId !== undefined) GM_setValue('nullbr_app_id', updates.appId);
      if (updates.apiKey !== undefined) GM_setValue('nullbr_api_key', updates.apiKey);
      if (updates.enable115 !== undefined) GM_setValue('nullbr_enable_115', updates.enable115);
      if (updates.enableMagnet !== undefined) GM_setValue('nullbr_enable_magnet', updates.enableMagnet);
    }

    this.notifyListeners(service, config);
  }

  validate(service: 'tmdb' | 'emby' | 'bangumi' | 'imdb' | 'nullbr'): boolean {
    const config = this.config[service];

    switch (service) {
      case 'tmdb':
        return !!config.apiKey && config.apiKey.length > 0;
      case 'emby':
        return !!config.server && !!config.apiKey;
      case 'bangumi':
        return !!config.apiKey && config.apiKey.length > 0;
      case 'imdb':
        return true;
      case 'nullbr':
        return !!config.appId && !!config.apiKey;
      default:
        return false;
    }
  }

  addListener(listener: ConfigListener): void {
    this.listeners.push(listener);
  }

  removeListener(listener: ConfigListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  getSummary(): Record<string, any> {
    return {
      tmdb: {
        hasApiKey: !!this.config.tmdb.apiKey,
        language: this.config.tmdb.language,
      },
      emby: {
        hasServer: !!this.config.emby.server,
        hasApiKey: !!this.config.emby.apiKey,
        server: this.config.emby.server || '(未配置)',
      },
      bangumi: {
        hasToken: !!this.config.bangumi.apiKey,
      },
      nullbr: {
        enable115: !!this.config.nullbr.enable115,
        enableMagnet: !!this.config.nullbr.enableMagnet,
      },
    };
  }

  private notifyListeners(service: string, config: ServiceConfig): void {
    this.listeners.forEach(listener => {
      try {
        listener(service, config);
      } catch (error) {
        console.error('Config listener error:', error);
      }
    });
  }
}

const configManager = new ConfigManager();

/** Reactive config object — use in Vue components for auto-reactivity */
export const CONFIG = configManager.config;

/** Config manager with update/validate/listener methods */
export const configService = configManager;

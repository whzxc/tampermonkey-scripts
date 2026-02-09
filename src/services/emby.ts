import { ApiClient, ApiResponse } from '../core/api-client';
import { CONFIG } from '../core/api-config';
import { Utils } from '../utils';

/**
 * Emby 媒体项
 */
export interface EmbyItem {
  Id: string;
  Name: string;
  ServerId?: string;
  Type?: string;
  ProductionYear?: number;
  PremiereDate?: string;
  CommunityRating?: number;
  OfficialRating?: string;
  RunTimeTicks?: number;
  Genres?: string[];
  Path?: string;
  ChildCount?: number;
  RecursiveItemCount?: number;
  MediaSources?: Array<{
    Name?: string;
    Container?: string;
    Size?: number;
    Bitrate?: number;
    Path?: string;
    MediaStreams?: Array<{
      Type?: string;
      Language?: string;
      DisplayTitle?: string;
      Codec?: string;
      Width?: number;
      Height?: number;
      BitRate?: number;
      BitDepth?: number;
      Channels?: number;
      IsForced?: boolean;
    }>;
  }>;
}

/**
 * Emby API 服务
 * 检查媒体库中是否存在指定影片
 */
export class EmbyService extends ApiClient {
  constructor() {
    super('Emby');
  }

  /**
   * 检查 TMDB ID 对应的媒体是否存在于 Emby
   * @param tmdbId - TMDB ID
   * @returns Promise<ApiResponse<EmbyItem | null>>
   */
  async checkExistence(tmdbId: number): Promise<ApiResponse<EmbyItem | null>> {
    const { server, apiKey } = CONFIG.emby as { server: string; apiKey: string };

    if (!server || !apiKey) {
      Utils.log('[Emby] Server or API Key not configured');
      return {
        data: null,
        meta: { error: 'Emby not configured', source: this.name, timestamp: new Date().toISOString() }
      };
    }

    const cacheKey = this.buildCacheKey('check', tmdbId);

    return this.request<EmbyItem | null>({
      requestFn: async () => {
        const queryId = `tmdb.${tmdbId}`;
        const params = new URLSearchParams({
          Recursive: 'true',
          AnyProviderIdEquals: queryId,
          Fields: 'ProviderIds,MediaSources,MediaStreams',
          api_key: apiKey
        });

        const url = `${server}/emby/Items?${params.toString()}`;

        Utils.log(`[Emby] Checking TMDB ID: ${tmdbId}`);

        const data = await Utils.getJSON(url);

        if (data.Items && data.Items.length > 0) {
          const item: EmbyItem = data.Items[0];
          Utils.log(`[Emby] Found: ${item.Name}`);
          return item;
        }

        Utils.log('[Emby] Not found in Emby');
        return null;
      },
      cacheKey,
      cacheTTL: 1440, // 24小时
      useCache: true,
      useQueue: true,
      priority: 3 // Emby 检查优先级较高
    });
  }

  /**
   * 决定缓存时长
   * @override
   */
  protected determineTTL(data: any, defaultTTL: number): number {
    // 找到的结果:长缓存(24小时),未找到:短缓存(1小时,用户可能会添加)
    return data ? defaultTTL : 60;
  }

  /**
   * 获取 Emby Web 链接
   * @param item - Emby 媒体项
   * @returns Web 链接
   */
  getWebUrl(item: EmbyItem | null): string {
    if (!item) return '';

    const { server } = CONFIG.emby as { server: string };
    return `${server}/web/index.html#!/item?id=${item.Id}&serverId=${item.ServerId || ''}`;
  }
}

// 导出单例实例
export const embyService = new EmbyService();

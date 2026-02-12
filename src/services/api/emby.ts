import { ApiClient, ApiResponse } from './api-client';
import { CONFIG } from '@/services/config';
import { EmbyItem } from '@/types/emby';

export class EmbyService extends ApiClient {
  constructor() {
    super('Emby');
  }

  async checkExistence(tmdbId: number): Promise<ApiResponse<EmbyItem | undefined>> {
    const { server, apiKey } = CONFIG.emby as { server: string; apiKey: string };

    if (!server || !apiKey) {
      return {
        data: undefined,
        meta: { error: 'Emby not configured', source: this.name, timestamp: new Date().toISOString() },
      };
    }

    const queryId = `tmdb.${tmdbId}`;
    const params = new URLSearchParams({
      Recursive: 'true',
      AnyProviderIdEquals: queryId,
      Fields: 'ProviderIds,MediaSources,MediaStreams,ProductionYear,ChildCount,RecursiveItemCount,Path,IndexNumber',
      api_key: apiKey,
    });

    const url = `${server}/emby/Items?${params.toString()}`;
    const cacheKey = this.buildCacheKey('check', tmdbId);

    const result = await this.request<EmbyItem | undefined>({
      requestFn: async () => {
        const data = (await GM.xmlHttpRequest({ url, responseType: 'json' })).response;

        if (data.Items && data.Items.length > 0) {
          const item: EmbyItem = data.Items[0];
          await this.enrichSeriesInfo(item, server, apiKey);
          return item;
        }

        return undefined;
      },
      cacheKey,
      cacheTTL: 1440,
      useCache: true,
      useQueue: true,
      priority: 3,
    });

    if (result.meta) {
      (result.meta as any).url = url;
    }

    return result;
  }

  /**
   * Search Emby library by name.
   * Returns all matching EmbyItems (0 = not found, 1 = exact, >1 = ambiguous).
   */
  async searchByName(name: string): Promise<ApiResponse<EmbyItem[]>> {
    const { server, apiKey } = CONFIG.emby as { server: string; apiKey: string };

    if (!server || !apiKey) {
      return {
        data: [],
        meta: { error: 'Emby not configured', source: this.name, timestamp: new Date().toISOString() },
      };
    }

    const params = new URLSearchParams({
      Recursive: 'true',
      SearchTerm: name,
      IncludeItemTypes: 'Movie,Series',
      Fields: 'ProviderIds,MediaSources,MediaStreams,ProductionYear,ChildCount,RecursiveItemCount,Path,IndexNumber',
      api_key: apiKey,
    });

    const url = `${server}/emby/Items?${params.toString()}`;
    const cacheKey = this.buildCacheKey('search', name);

    return this.request<EmbyItem[]>({
      requestFn: async () => {
        const data = (await GM.xmlHttpRequest({ url, responseType: 'json' })).response;

        return data.Items || [];
      },
      cacheKey,
      cacheTTL: 60,
      useCache: true,
      useQueue: true,
      priority: 3,
    });
  }

  /**
   * Search Emby library by Douban subject ID.
   */
  async getByDoubanId(doubanId: string): Promise<ApiResponse<EmbyItem | undefined>> {
    const { server, apiKey } = CONFIG.emby as { server: string; apiKey: string };

    if (!server || !apiKey) {
      return {
        data: undefined,
        meta: { error: 'Emby not configured', source: this.name, timestamp: new Date().toISOString() },
      };
    }

    const queryId = `douban.${doubanId}`;
    const params = new URLSearchParams({
      Recursive: 'true',
      AnyProviderIdEquals: queryId,
      Fields: 'ProviderIds,MediaSources,MediaStreams,ProductionYear,ChildCount,RecursiveItemCount,Path,IndexNumber',
      api_key: apiKey,
    });

    const url = `${server}/emby/Items?${params.toString()}`;
    const cacheKey = this.buildCacheKey('douban', doubanId);

    return this.request<EmbyItem | undefined>({
      requestFn: async () => {
        const data = (await GM.xmlHttpRequest({ url, responseType: 'json' })).response;

        if (data.Items && data.Items.length > 0) {
          const item: EmbyItem = data.Items[0];
          await this.enrichSeriesInfo(item, server, apiKey);
          return item;
        }

        return undefined;
      },
      cacheKey,
      cacheTTL: 1440,
      useCache: true,
      useQueue: true,
      priority: 3,
    });
  }

  /**
   * Enrich a Series EmbyItem with season/episode details.
   */
  async enrichSeriesInfo(item: EmbyItem, server: string, apiKey: string): Promise<void> {
    if (item.Type !== 'Series') return;

    try {
      const seasonParams = new URLSearchParams({
        ParentId: item.Id,
        IncludeItemTypes: 'Season',
        Fields: 'ChildCount,RecursiveItemCount,Path,IndexNumber',
        api_key: apiKey,
      });
      const seasonUrl = `${server}/emby/Items?${seasonParams.toString()}`;
      const seasonData = (await GM.xmlHttpRequest({ url: seasonUrl, responseType: 'json' })).response;

      if (seasonData.Items && seasonData.Items.length > 0) {
        item.Seasons = seasonData.Items;

        const totalEpisodes = item.Seasons!.reduce((acc, s) => acc + (s.RecursiveItemCount || 0), 0);

        if (totalEpisodes === 0) {
          const episodeParams = new URLSearchParams({
            ParentId: item.Id,
            IncludeItemTypes: 'Episode',
            Recursive: 'true',
            Fields: 'ParentIndexNumber',
            api_key: apiKey,
          });
          const allEpUrl = `${server}/emby/Items?${episodeParams.toString()}`;
          const allEpData = (await GM.xmlHttpRequest({ url: allEpUrl, responseType: 'json' })).response;

          if (allEpData.Items && allEpData.Items.length > 0) {
            const seasonMap: Record<number, number> = {};
            allEpData.Items.forEach((ep: any) => {
              const sNum = ep.ParentIndexNumber || 1;
              seasonMap[sNum] = (seasonMap[sNum] || 0) + 1;
            });

            if (item.Seasons) {
              item.Seasons.forEach(s => {
                let ids = s.IndexNumber;
                if (ids === undefined) {
                  const m = s.Name.match(/(\d+)/);
                  if (m) ids = parseInt(m[1], 10);
                }

                if (ids !== undefined && seasonMap[ids]) {
                  s.RecursiveItemCount = seasonMap[ids];
                  s.ChildCount = seasonMap[ids];
                }
              });
            }
          }
        }
      }
    } catch (e) {
      console.log(`[Emby] Failed to fetch seasons/episodes: ${e}`);
    }
  }

  getWebUrl(item: EmbyItem | null): string {
    if (!item) return '';

    const { server } = CONFIG.emby as { server: string };
    return `${server}/web/index.html#!/item?id=${item.Id}&serverId=${item.ServerId || ''}`;
  }

  protected determineTTL(data: any, defaultTTL: number): number {
    return data ? defaultTTL : 60;
  }
}

export const embyService = new EmbyService();

import { ApiClient, ApiResponse } from './api-client';
import { CONFIG } from '@/services/config';
import { EmbyItem } from '@/types/emby';

export class EmbyService extends ApiClient {
  constructor() {
    super('Emby');
  }

  async getLibraries(): Promise<ApiResponse<any[]>> {
    const { server, apiKey } = CONFIG.emby as { server: string; apiKey: string };

    if (!server || !apiKey) {
      return {
        data: [],
        meta: { error: 'Emby not configured', source: this.name, timestamp: new Date().toISOString() },
      };
    }

    const params = new URLSearchParams({
      api_key: apiKey,
    });

    const url = `${server}/emby/Library/VirtualFolders?${params.toString()}`;
    // No cache for library list, or short cache
    const cacheKey = this.buildCacheKey('libraries', 'list');

    return this.request<any[]>({
      requestFn: async () => {
        const data = (await GM.xmlHttpRequest({ url, responseType: 'json' })).response;
        return data || [];
      },
      cacheKey,
      cacheTTL: 5, // Short cache for libraries
      useCache: false, // Always fetch fresh to ensure settings are up to date
      useQueue: true,
      priority: 3,
    });
  }

  /**
   * Helper to filter items by selected libraries.
   * If selectedLibraries is empty, returns true (allow all).
   */
  private isAllowedLibrary(item: EmbyItem): boolean {
    const { selectedLibraries } = CONFIG.emby as { selectedLibraries?: string[] };
    if (!selectedLibraries || selectedLibraries.length === 0) return true;

    // Item must be in one of the selected libraries
    // Top-level items often have "ParentId" pointing to the library/folder
    // Deep items might need checking "AncestorIds" if available,
    // but typically for "search" results of Movies/Series, ParentId is often the Library or a Folder within it.
    // However, the most reliable way for Emby root libraries validation might be tricky if structure is complex.
    // simpler approach:
    // If we have "ParentId", check if it matches a selected library ID.
    // But VirtualFolders endpoint returns items with "ItemId".
    // So we match (item.ParentId === selectedLibraryId)
    // NOTE: This assumes the search result's ParentId IS the library ID.
    // If the item is deep in folders, we might need to check AncestorIds.
    // The current Fields for search include 'ParentId', let's check 'AncestorIds' too.
    return true;
    // Implementing actual logic inside the main methods where we have context or can request Ancestors.
  }

  async checkExistence(tmdbId: number): Promise<ApiResponse<EmbyItem | undefined>> {
    const { server, apiKey, selectedLibraries } = CONFIG.emby as { server: string; apiKey: string; selectedLibraries?: string[] };

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
          let foundItem: EmbyItem | undefined = data.Items[0];

          if (selectedLibraries && selectedLibraries.length > 0) {
            foundItem = data.Items.find((item: any) => {
              const ancestors = item.AncestorIds || [];
              return selectedLibraries.some(libId => libId === item.ParentId || ancestors.includes(libId));
            });
          }

          if (foundItem) {
            await this.enrichSeriesInfo(foundItem, server, apiKey);
            return foundItem;
          }
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
    const { server, apiKey, selectedLibraries } = CONFIG.emby as { server: string; apiKey: string; selectedLibraries?: string[] };

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
      Fields: 'ProviderIds,MediaSources,MediaStreams,ProductionYear,ChildCount,RecursiveItemCount,Path,IndexNumber,ParentId,AncestorIds',
      api_key: apiKey,
    });

    const url = `${server}/emby/Items?${params.toString()}`;
    const cacheKey = this.buildCacheKey('search', name);

    return this.request<EmbyItem[]>({
      requestFn: async () => {
        const data = (await GM.xmlHttpRequest({ url, responseType: 'json' })).response;

        let items = data.Items || [];

        if (selectedLibraries && selectedLibraries.length > 0) {
          items = items.filter((item: any) => {
            const ancestors = item.AncestorIds || [];
            return selectedLibraries.some(libId => libId === item.ParentId || ancestors.includes(libId));
          });
        }

        return items;
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
    const { server, apiKey, selectedLibraries } = CONFIG.emby as { server: string; apiKey: string; selectedLibraries?: string[] };

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
          let foundItem: EmbyItem | undefined = data.Items[0];

          if (selectedLibraries && selectedLibraries.length > 0) {
            foundItem = data.Items.find((item: any) => {
              const ancestors = item.AncestorIds || [];
              return selectedLibraries.some(libId => libId === item.ParentId || ancestors.includes(libId));
            });
          }

          if (foundItem) {
            await this.enrichSeriesInfo(foundItem, server, apiKey);
            return foundItem;
          }
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

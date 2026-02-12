import { tmdbService } from '@/services/api/tmdb';
import { embyService } from '@/services/api/emby';
import { CONFIG } from '@/services/config';
import type { MediaType } from '@/types/tmdb';
import type { TmdbInfo } from '@/types/ui';
import type { EmbyItem } from '@/types/emby';

/**
 * A normalized TMDB search result for display in the InfoCard.
 */
export interface TmdbSearchItem {
  id: number;
  title: string;
  year: string;
  overview: string;
  posterPath: string;
  mediaType: MediaType;
}

/**
 * The result of a media check through the new pipeline.
 */
export interface MediaCheckResult {
  tmdbId: number | null;
  embyItem: EmbyItem | null;
  /** All matched Emby items (for multi-result switching) */
  embyItems?: EmbyItem[];
  status: 'found' | 'not-found' | 'error';
  statusMessage: string;
  title: string;
  mediaType: MediaType;
  searchQueries: string[];
  tmdbInfo?: TmdbInfo;
  /** TMDB search results for display when media is not found in Emby */
  tmdbResults?: TmdbSearchItem[];
}

/**
 * Unified data processing layer.
 *
 * New pipeline:
 * 1. If doubanId is available → Emby lookup by Douban ID
 * 2. Emby search by title
 *    - 0 results → not-found, fetch TMDB info for display
 *    - 1 result → found
 *    - N results → TMDB search to get tmdbId, match against Emby results
 * 3. When not-found, search TMDB and return results for InfoCard display
 */
class MediaService {
  async checkMedia(
    title: string,
    year: string,
    mediaType: MediaType,
    searchQueries: string[] = [title],
    doubanId: string = '',
  ): Promise<MediaCheckResult> {
    try {
      // Step 1: Try Douban ID lookup if available
      if (doubanId) {
        const doubanResult = await embyService.getByDoubanId(doubanId);
        if (doubanResult.data) {
          const item = doubanResult.data;
          return {
            tmdbId: null,
            embyItem: item,
            status: 'found',
            statusMessage: `Found: ${item.Name}`,
            title,
            mediaType,
            searchQueries,
          };
        }
      }

      // Step 2: Search Emby by title
      const embySearch = await embyService.searchByName(title);
      const embyItems = embySearch.data || [];

      if (embyItems.length === 1) {
        // Exactly one match — enrich and return
        const item = embyItems[0];
        const { server, apiKey } = this.getEmbyConfig();
        if (server && apiKey) {
          await embyService.enrichSeriesInfo(item, server, apiKey);
        }
        return {
          tmdbId: null,
          embyItem: item,
          status: 'found',
          statusMessage: `Found: ${item.Name}`,
          title,
          mediaType,
          searchQueries,
        };
      }

      if (embyItems.length > 1) {
        // Multiple Emby matches — enrich all and return them for switching
        const { server, apiKey } = this.getEmbyConfig();
        if (server && apiKey) {
          await Promise.all(embyItems.map(item => embyService.enrichSeriesInfo(item, server, apiKey)));
        }

        return {
          tmdbId: null,
          embyItem: embyItems[0],
          embyItems,
          status: 'found',
          statusMessage: `Found: ${embyItems[0].Name} (+${embyItems.length - 1} more)`,
          title,
          mediaType,
          searchQueries,
        };
      }

      // Step 3: Not found in Emby — search TMDB for display info
      const tmdbResults = await this.searchTmdbForDisplay(title, year, mediaType);
      const tmdbId = tmdbResults.length > 0 ? tmdbResults[0].id : null;
      const tmdbInfo = tmdbId ? { id: tmdbId, mediaType } : undefined;

      return {
        tmdbId,
        embyItem: null,
        status: 'not-found',
        statusMessage: 'Not in Emby',
        title,
        mediaType,
        searchQueries,
        tmdbInfo,
        tmdbResults,
      };
    } catch (error: any) {
      return {
        tmdbId: null,
        embyItem: null,
        status: 'error',
        statusMessage: `Error: ${error.message || error}`,
        title,
        mediaType,
        searchQueries,
      };
    }
  }

  /**
   * Get TMDB ID by searching movie or tv.
   */
  private async getTmdbId(title: string, year: string, mediaType: MediaType): Promise<number | null> {
    if (mediaType === 'tv') {
      const result = await tmdbService.searchTv(title, year);
      if (result.data?.length) return result.data[0].id;
      // Retry without year
      const retry = await tmdbService.searchTv(title);
      if (retry.data?.length) return retry.data[0].id;
    } else {
      const result = await tmdbService.searchMovie(title, year);
      if (result.data?.length) return result.data[0].id;
      // Retry without year
      const retry = await tmdbService.searchMovie(title);
      if (retry.data?.length) return retry.data[0].id;
    }
    return null;
  }

  /**
   * Search TMDB and normalize results for display in the InfoCard.
   */
  private async searchTmdbForDisplay(
    title: string,
    year: string,
    mediaType: MediaType,
  ): Promise<TmdbSearchItem[]> {
    const normalize = (items: any[], type: MediaType): TmdbSearchItem[] => {
      return items.map(item => ({
        id: item.id,
        title: type === 'tv' ? (item.name || item.original_name) : (item.title || item.original_title),
        year: type === 'tv'
          ? (item.first_air_date || '').substring(0, 4)
          : (item.release_date || '').substring(0, 4),
        overview: item.overview || '',
        posterPath: item.poster_path || '',
        mediaType: type,
      }));
    };

    if (mediaType === 'tv') {
      const result = await tmdbService.searchTv(title, year);
      if (result.data?.length) return normalize(result.data, 'tv');
      const retry = await tmdbService.searchTv(title);
      if (retry.data?.length) return normalize(retry.data, 'tv');
    } else {
      const result = await tmdbService.searchMovie(title, year);
      if (result.data?.length) return normalize(result.data, 'movie');
      const retry = await tmdbService.searchMovie(title);
      if (retry.data?.length) return normalize(retry.data, 'movie');
    }

    return [];
  }

  private getEmbyConfig(): { server: string; apiKey: string } {
    return {
      server: (CONFIG.emby.server as string) || '',
      apiKey: (CONFIG.emby.apiKey as string) || '',
    };
  }
}

export const mediaService = new MediaService();

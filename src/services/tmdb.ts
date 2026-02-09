import { ApiClient, ApiResponse } from '../core/api-client';
import { CONFIG } from '../core/api-config';
import { Utils } from '../utils';

/**
 * TMDB 搜索结果项
 */
export interface TmdbSearchResult {
  id: number;
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  poster_path?: string | null;
  overview?: string;
}

/**
 * TMDB 电影详情
 */
export interface TmdbMovieDetails {
  id: number;
  title: string;
  release_date: string;
  runtime?: number;
  genres?: Array<{ id: number; name: string }>;
  vote_average?: number;
  overview?: string;
}

/**
 * TMDB 电视剧详情
 */
export interface TmdbTvDetails {
  id: number;
  name: string;
  first_air_date: string;
  number_of_seasons?: number;
  genres?: Array<{ id: number; name: string }>;
  vote_average?: number;
  overview?: string;
}

/**
 * TMDB API 服务
 * 提供电影和电视剧搜索功能
 */
export class TmdbService extends ApiClient {
  constructor() {
    super('TMDB');
  }

  /**
   * 搜索电影或电视剧
   * @param query - 搜索关键词
   * @param year - 年份(可选)
   * @param type - 类型 'movie' | 'tv' | null
   */
  async search(
    query: string,
    year: string = '',
    type: 'movie' | 'tv' | null = null
  ): Promise<ApiResponse<TmdbSearchResult[]>> {
    if (!CONFIG.tmdb.apiKey) {
      Utils.log('[TMDB] API Key missing');
      return {
        data: [],
        meta: { error: 'API Key not configured', source: this.name, timestamp: new Date().toISOString() }
      };
    }

    const cacheKey = this.buildCacheKey('search', query, year, type || '');
    const config = CONFIG.tmdb;

    return this.request<TmdbSearchResult[]>({
      requestFn: async () => {
        // 构建请求 URL
        const params = new URLSearchParams({
          api_key: config.apiKey!,
          query: query,
          language: config.language as string || 'zh-CN',
          include_adult: 'false'
        });

        const url = `${config.baseUrl}/search/multi?${params.toString()}`;

        // 记录请求日志
        Utils.log(`[TMDB] Searching: ${query}${year ? ` (${year})` : ''}${type ? ` [${type}]` : ''}`);

        // 发起请求
        const data = await Utils.getJSON(url);

        // 处理结果
        let results: TmdbSearchResult[] = [];

        if (data.results && data.results.length > 0) {
          // 过滤结果
          results = data.results.filter((item: TmdbSearchResult) => {
            const matchType = item.media_type === 'movie' || item.media_type === 'tv';
            if (type && matchType) {
              return item.media_type === type;
            }
            return matchType;
          });

          // 按年份接近度排序
          if (year) {
            results.sort((a, b) => {
              const dateA = a.release_date || a.first_air_date || '';
              const dateB = b.release_date || b.first_air_date || '';
              const yearA = dateA.split('-')[0];
              const yearB = dateB.split('-')[0];

              // 精确匹配的优先
              const scoreA = yearA === year ? 1 : 0;
              const scoreB = yearB === year ? 1 : 0;

              return scoreB - scoreA;
            });
          }
        }

        Utils.log(`[TMDB] Found ${results.length} results`);
        return results;
      },
      cacheKey,
      cacheTTL: 1440, // 24小时
      useCache: true,
      useQueue: true,
      priority: type ? 5 : 0 // 有类型的搜索优先级更高
    });
  }

  /**
   * 根据 ID 获取详情
   * @param id - TMDB ID
   * @param type - 'movie' | 'tv'
   */
  async getDetails(
    id: number,
    type: 'movie' | 'tv'
  ): Promise<ApiResponse<TmdbMovieDetails | TmdbTvDetails>> {
    if (!CONFIG.tmdb.apiKey) {
      return {
        data: null as any,
        meta: { error: 'API Key not configured', source: this.name, timestamp: new Date().toISOString() }
      };
    }

    const cacheKey = this.buildCacheKey('details', id, type);
    const config = CONFIG.tmdb;

    return this.request<TmdbMovieDetails | TmdbTvDetails>({
      requestFn: async () => {
        const params = new URLSearchParams({
          api_key: config.apiKey!,
          language: config.language as string || 'zh-CN'
        });

        const url = `${config.baseUrl}/${type}/${id}?${params.toString()}`;

        Utils.log(`[TMDB] Fetching ${type} details: ${id}`);
        return await Utils.getJSON(url);
      },
      cacheKey,
      cacheTTL: 2880, // 48小时,详情数据更稳定
      useCache: true,
      useQueue: true
    });
  }

  /**
   * 决定缓存时长
   * @override
   */
  protected determineTTL(data: any, defaultTTL: number): number {
    if (Array.isArray(data)) {
      // 有结果:长缓存,无结果:短缓存
      return data.length > 0 ? defaultTTL : 60;
    }
    return defaultTTL;
  }
}

// 导出单例实例
export const tmdbService = new TmdbService();

import { ApiClient, ApiResponse } from '../core/api-client';
import { CONFIG } from '../core/api-config';
import { Utils } from '../utils';

/**
 * IMDB 聚合评分
 */
export interface ImdbAggregateRating {
  '@type': string;
  ratingCount: number;
  bestRating: number;
  worstRating: number;
  ratingValue: number;
}

/**
 * IMDB 数据(从 JSON-LD 解析)
 */
export interface ImdbData {
  '@context': string;
  '@type': string;
  url: string;
  name: string;
  image?: string;
  description?: string;
  aggregateRating?: ImdbAggregateRating;
  contentRating?: string;
  genre?: string | string[];
  datePublished?: string;
  keywords?: string;
}

/**
 * IMDB API 服务
 * 从 IMDB 页面抓取评分信息
 */
export class ImdbService extends ApiClient {
  constructor() {
    super('IMDB');
  }

  /**
   * 获取 IMDB 评分
   * @param imdbId - IMDB ID (如 tt1234567)
   * @returns Promise<ApiResponse<ImdbData | null>>
   */
  async getRating(imdbId: string): Promise<ApiResponse<ImdbData | null>> {
    const cacheKey = this.buildCacheKey('rating', imdbId);
    const config = CONFIG.imdb;

    return this.request<ImdbData | null>({
      requestFn: async () => {
        const url = `${config.baseUrl}/title/${imdbId}/`;

        Utils.log(`[IMDB] Fetching rating for: ${imdbId}`);

        // 获取 HTML 文档
        const doc = await Utils.getDoc(url);

        // 查找 JSON-LD 结构化数据
        const jsonLd = doc.querySelector('script[type="application/ld+json"]');

        if (jsonLd && jsonLd.textContent) {
          const data: ImdbData = JSON.parse(jsonLd.textContent);

          if (data.aggregateRating) {
            Utils.log(`[IMDB] Rating: ${data.aggregateRating.ratingValue}/10`);
            return data;
          }
        }

        Utils.log('[IMDB] No rating found');
        return null;
      },
      cacheKey,
      cacheTTL: config.cacheTTL as number, // 7天,IMDB评分变化较慢
      useCache: true,
      useQueue: true,
      priority: 1 // IMDB 优先级较低
    });
  }

  /**
   * 决定缓存时长
   * @override
   */
  protected determineTTL(data: any, defaultTTL: number): number {
    // IMDB 评分变化慢,统一长缓存
    return defaultTTL;
  }
}

// 导出单例实例
export const imdbService = new ImdbService();

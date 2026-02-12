import { ApiClient, ApiResponse } from './api-client';
import { CONFIG } from '@/services/config';

export interface BangumiSubject {
  id: number;
  name: string;
  name_cn?: string;
  type: number;
  date?: string;
  images?: {
    large?: string;
    common?: string;
    medium?: string;
    small?: string;
    grid?: string;
  };
  score?: number;
  rank?: number;
}

export class BangumiService extends ApiClient {
  constructor() {
    super('Bangumi');
  }

  async search(query: string): Promise<ApiResponse<BangumiSubject | null>> {
    const apiKey = CONFIG.bangumi.apiKey;

    if (!apiKey) {
      return {
        data: null,
        meta: { error: 'Token not configured', source: this.name, timestamp: new Date().toISOString() },
      };
    }

    const cacheKey = this.buildCacheKey('search', query);
    const config = CONFIG.bangumi;

    return this.request<BangumiSubject | null>({
      requestFn: async () => {
        const url = `${config.baseUrl}/v0/search/subjects`;

        const response = await GM.xmlHttpRequest({
          method: 'POST',
          url: url,
          responseType: 'json',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          data: JSON.stringify({
            keyword: query,
            filter: { type: [2] },  // type 2 = anime
          }),
        });

        if (response.status === 200) {
          const data = typeof response.response === 'string'
            ? JSON.parse(response.response)
            : response.response;

          if (data && data.data && data.data.length > 0) {
            return data.data[0];
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return null;
      },
      cacheKey,
      cacheTTL: 1440,
      useCache: true,
      useQueue: true,
    });
  }

  protected determineTTL(data: any, defaultTTL: number): number {
    return data ? defaultTTL : 60;
  }
}

export const bangumiService = new BangumiService();

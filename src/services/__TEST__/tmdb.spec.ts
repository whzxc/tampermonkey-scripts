import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tmdbService } from '../api/tmdb';
import { configService } from '../config';

describe('TmdbService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchMovie', () => {
    it('应该能搜索电影', async () => {
      const result = await tmdbService.searchMovie('Inception', '2010');

      expect(result.data).toBeDefined();
      if (result.data && result.data.length > 0) {
        expect(result.data[0]).toHaveProperty('id');
        expect(result.data[0]).toHaveProperty('title');
      }
    }, 15000);

    it('应该使用缓存', async () => {
      const result1 = await tmdbService.searchMovie('The Matrix');
      const result2 = await tmdbService.searchMovie('The Matrix');

      expect(result2.meta.cached).toBeTruthy();
      expect(result1.data).toEqual(result2.data);
    }, 20000);
  });

  describe('searchTv', () => {
    it('应该能搜索电视剧', async () => {
      const result = await tmdbService.searchTv('Breaking Bad');

      expect(result.data).toBeDefined();
      if (result.data && result.data.length > 0) {
        expect(result.data[0]).toHaveProperty('id');
        expect(result.data[0]).toHaveProperty('name');
      }
    }, 15000);
  });

  describe('getDetail', () => {
    it('应该能获取电影详情', async () => {
      // Inception TMDB ID
      const result = await tmdbService.getMovieDetails(27205);

      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.title).toBe('Inception');
        expect(result.data.id).toBe(27205);
      }
    }, 15000);
  });

  describe('配置检查', () => {
    it('未配置API Key时应该返回错误', async () => {
      const originalKey = configService.config.tmdb.apiKey;
      configService.update('tmdb', { apiKey: '' });

      const result = await tmdbService.searchMovie('test');

      expect(result.meta.error).toBeDefined();
      expect(result.data).toBeNull();

      if (originalKey) {
        configService.update('tmdb', { apiKey: originalKey });
      }
    });
  });
});

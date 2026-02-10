/**
 * Handler抽象基类
 * 提供Handler通用的媒体检查流程，减少重复代码
 */

import { UI } from '../utils/ui';
import { tmdbService } from '../services/tmdb';
import { embyService, EmbyItem } from '../services/emby';
import { ProcessLogger } from '../utils/logger';
import { TmdbInfo, MediaType } from '../types/common';

/**
 * 媒体检查结果
 */
export interface MediaCheckResult {
  found: boolean;
  embyItem: EmbyItem | null;
  tmdbInfo: TmdbInfo | null;
  logger: ProcessLogger;
}

/**
 * Handler抽象基类
 * 提供通用的媒体检查流程
 */
export abstract class BaseMediaHandler {
  protected logger: ProcessLogger;

  constructor() {
    this.logger = new ProcessLogger();
  }

  /**
   * 通用媒体检查流程
   * @param title 清理后的标题
   * @param year 年份（可选）
   * @param mediaType 媒体类型
   * @param originalTitle 原始标题（用于日志）
   */
  protected async checkMedia(
    title: string,
    year: string = '',
    mediaType: MediaType | null = null,
    originalTitle?: string
  ): Promise<MediaCheckResult> {
    const logger = new ProcessLogger();

    logger.log('【解析标题】', {
      'Original Title': originalTitle || title,
      'Cleaned Title': title,
      'Year': year,
      'Type': mediaType
    });

    try {
      // 1. 搜索TMDB
      const tmdbResult = await tmdbService.search(title, year, mediaType);
      logger.logApiRequest('TMDB', tmdbResult.meta, {
        count: tmdbResult.data.length,
        top_result: tmdbResult.data[0] || null
      });

      if (tmdbResult.data.length === 0) {
        logger.log('【请求API: Emby】', { message: 'Skipped (No TMDB Result)' });
        return {
          found: false,
          embyItem: null,
          tmdbInfo: null,
          logger
        };
      }

      const bestMatch = tmdbResult.data[0];
      const tmdbInfo: TmdbInfo = {
        id: bestMatch.id,
        mediaType: bestMatch.media_type
      };

      // 2. 检查Emby
      const embyResult = await embyService.checkExistence(bestMatch.id);
      const embyItem = embyResult.data;

      logger.logApiRequest('Emby', embyResult.meta,
        embyItem ? `Found: ${embyItem.Name} (ID: ${embyItem.Id})` : 'Not Found'
      );

      return {
        found: !!embyItem,
        embyItem,
        tmdbInfo,
        logger
      };

    } catch (error) {
      logger.logError(error);
      return {
        found: false,
        embyItem: null,
        tmdbInfo: null,
        logger
      };
    }
  }

  /**
   * 更新Dot状态并绑定点击事件
   */
  protected updateDotStatus(
    dot: HTMLElement,
    result: MediaCheckResult,
    title: string,
    searchQueries: string[] = []
  ): void {
    dot.classList.remove('loading');

    const queries = searchQueries.length ? searchQueries : [title];

    if (result.found && result.embyItem) {
      dot.className = 'us-dot found';
      dot.title = `Found in Emby: ${result.embyItem.Name}`;
      dot.onclick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        UI.showDetailModal(
          title,
          result.logger.getLogs(),
          result.embyItem,
          queries,
          result.tmdbInfo || undefined
        );
      };
    } else {
      dot.className = 'us-dot not-found';
      dot.title = 'Not found in Emby';
      dot.onclick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        UI.showDetailModal(
          title,
          result.logger.getLogs(),
          null,
          queries,
          result.tmdbInfo || undefined
        );
      };
    }
  }

  /**
   * 处理错误情况，更新Dot为错误状态
   */
  protected handleError(dot: HTMLElement, error: any, title: string, logger: ProcessLogger): void {
    console.error(error);
    logger.logError(error);
    dot.className = 'us-dot error';
    dot.classList.remove('loading');
    dot.title = 'Error occurred';
    dot.onclick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      UI.showDetailModal(title, logger.getLogs(), null, [title]);
    };
  }
}

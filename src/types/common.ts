/**
 * 公共类型定义模块
 * 整合项目中重复使用的类型定义
 */

/**
 * API请求日志条目
 */
export interface LogEntry {
  time: string;
  step: string;
  data: unknown;
  status?: string;
}

/**
 * 解析后的视频标题信息
 */
export interface ParsedTitle {
  title: string;
  group?: string;
  resolution?: string;
  subtitle?: string;
  format?: string;
  season?: string;
  episode?: string;
}

/**
 * Media类型
 */
export type MediaType = 'movie' | 'tv';

/**
 * TMDB信息
 */
export interface TmdbInfo {
  id: number;
  mediaType: MediaType;
}

/**
 * Dot配置选项
 */
export interface DotOptions {
  posterContainer?: HTMLElement;
  titleElement?: HTMLElement;
}

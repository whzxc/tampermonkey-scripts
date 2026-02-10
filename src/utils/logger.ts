/**
 * 日志记录工具模块
 * 提供统一的进程日志记录功能
 */

import { LogEntry } from '../types/common';

/**
 * 进程日志记录器
 */
export class ProcessLogger {
  private logs: LogEntry[] = [];

  /**
   * 记录日志
   */
  log(step: string, data: unknown, status?: string): void {
    this.logs.push({
      time: new Date().toLocaleTimeString(),
      step,
      data,
      status
    });
  }

  /**
   * 记录API请求
   */
  logApiRequest(apiName: string, meta: any, response: any): void {
    this.log(`【请求API: ${apiName}】`, {
      meta,
      response
    });
  }

  /**
   * 记录错误
   */
  logError(error: any): void {
    this.log('【错误】', {
      message: error?.message || String(error),
      stack: error?.stack
    }, 'error');
  }

  /**
   * 获取所有日志
   */
  getLogs(): LogEntry[] {
    return this.logs;
  }

  /**
   * 清空日志
   */
  clear(): void {
    this.logs = [];
  }
}

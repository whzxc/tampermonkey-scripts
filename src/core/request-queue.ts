import { Utils } from '../utils';

/**
 * 请求任务
 */
interface QueueTask<T = any> {
  requestFn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  priority: number;
  key?: string;
}

/**
 * 队列状态
 */
interface QueueStatus {
  running: number;
  queued: number;
  pending: number;
  maxConcurrent: number;
}

/**
 * 请求队列管理器
 * 限制并发数量、去重请求、支持优先级
 */
export class RequestQueue {
  private maxConcurrent: number;
  private queue: QueueTask[];
  private running: number;
  private pendingRequests: Map<string, Promise<any>>;

  constructor(maxConcurrent: number = 6) {
    this.maxConcurrent = maxConcurrent;
    this.queue = [];
    this.running = 0;
    this.pendingRequests = new Map();
  }

  /**
   * 添加请求到队列
   * @param requestFn - 返回 Promise 的请求函数
   * @param options - 选项
   */
  async enqueue<T>(
    requestFn: () => Promise<T>,
    options: { key?: string; priority?: number } = {}
  ): Promise<T> {
    const { key, priority = 0 } = options;

    // 去重:如果相同请求正在进行,返回相同的 Promise
    if (key && this.pendingRequests.has(key)) {
      Utils.log(`Request deduped: ${key}`);
      return this.pendingRequests.get(key)!;
    }

    // 创建请求 Promise
    const promise = new Promise<T>((resolve, reject) => {
      this.queue.push({
        requestFn,
        resolve,
        reject,
        priority,
        key
      });
    });

    // 如果有 key,记录到 pending
    if (key) {
      this.pendingRequests.set(key, promise);
    }

    // 按优先级排序队列
    this.queue.sort((a, b) => b.priority - a.priority);

    // 尝试执行
    this.processQueue();

    return promise;
  }

  /**
   * 处理队列
   */
  private async processQueue(): Promise<void> {
    while (this.running < this.maxConcurrent && this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        this.running++;
        this.executeTask(task);
      }
    }
  }

  /**
   * 执行单个任务
   */
  private async executeTask<T>(task: QueueTask<T>): Promise<void> {
    const { requestFn, resolve, reject, key } = task;

    try {
      const result = await requestFn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;

      // 从 pending 中移除
      if (key) {
        this.pendingRequests.delete(key);
      }

      // 继续处理队列
      this.processQueue();
    }
  }

  /**
   * 获取队列状态
   */
  getStatus(): QueueStatus {
    return {
      running: this.running,
      queued: this.queue.length,
      pending: this.pendingRequests.size,
      maxConcurrent: this.maxConcurrent
    };
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.queue = [];
    this.pendingRequests.clear();
  }
}

// 导出单例实例
export const requestQueue = new RequestQueue(6);

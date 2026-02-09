/**
 * 工具函数集合
 */
export const Utils = {
  /**
   * Promisified GM_xmlhttpRequest
   */
  request(details: any): Promise<any> {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        ...details,
        onload(response: any) {
          if (response.status >= 200 && response.status < 400) {
            resolve(response);
          } else {
            reject(response);
          }
        },
        onerror(response: any) {
          reject(response);
        }
      });
    });
  },

  /**
   * 获取 JSON 数据
   */
  async getJSON(url: string): Promise<any> {
    Utils.log(`fetching ${url}`);
    const resp = await this.request({
      method: 'GET',
      url: url,
      headers: { 'Accept': 'application/json' }
    });
    return JSON.parse(resp.responseText);
  },

  /**
   * 获取 HTML 文档
   */
  async getDoc(url: string): Promise<Document> {
    const resp = await this.request({
      method: 'GET',
      url: url
    });
    return (new DOMParser()).parseFromString(resp.responseText, 'text/html');
  },

  /**
   * 添加样式
   */
  addStyle(css: string): void {
    GM_addStyle(css);
  },

  /**
   * 复制到剪贴板
   */
  copyToClipboard(text: string, successCallback?: () => void): void {
    GM_setClipboard(text);
    if (successCallback) successCallback();
  },

  /**
   * 日志输出
   */
  log(...args: any[]): void {
    console.log('[Unified-Script]', ...args);
  }
};

// 导出缓存管理器包装
export { cache as Cache } from '../core/cache-manager';

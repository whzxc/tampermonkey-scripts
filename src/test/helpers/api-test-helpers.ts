/**
 * 检查是否有有效的 API Keys
 */
export function hasValidApiKeys() {
  return {
    tmdb: !!process.env.TMDB_API_KEY,
    emby: !!(process.env.EMBY_SERVER && process.env.EMBY_API_KEY),
    bangumi: !!process.env.BANGUMI_TOKEN,
    imdb: true // IMDB 不需要 API Key
  };
}

/**
 * 跳过测试如果 API Key 不可用
 */
export function skipIfNoApiKey(service: keyof ReturnType<typeof hasValidApiKeys>): boolean {
  const keys = hasValidApiKeys();
  return !keys[service];
}

/**
 * 测试辅助:延迟函数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 生成随机字符串
 */
export function randomString(length: number = 8): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

import { config } from 'dotenv';
import { vi, beforeEach } from 'vitest';

// 加载 .env 文件
config();

// 创建内存存储来模拟 GM storage
const gmStorage = new Map<string, any>();

// Mock Tampermonkey APIs
(global as any).GM_getValue = vi.fn((key: string, defaultValue?: any) => {
  // 优先从内存存储获取
  if (gmStorage.has(key)) {
    return gmStorage.get(key);
  }

  // 如果是配置项,从环境变量获取
  const envMap: Record<string, string> = {
    'tmdb_api_key': process.env.TMDB_API_KEY || '',
    'emby_server': process.env.EMBY_SERVER || '',
    'emby_api_key': process.env.EMBY_API_KEY || '',
    'bangumi_token': process.env.BANGUMI_TOKEN || '',
    'us_dot_position': 'auto'
  };

  return envMap[key] ?? defaultValue;
});

(global as any).GM_setValue = vi.fn((key: string, value: any) => {
  gmStorage.set(key, value);
});

(global as any).GM_listValues = vi.fn(() => {
  return Array.from(gmStorage.keys());
});

(global as any).GM_deleteValue = vi.fn((key: string) => {
  gmStorage.delete(key);
});

(global as any).GM_addStyle = vi.fn();
(global as any).GM_setClipboard = vi.fn();

// Mock GM_xmlhttpRequest 使用 fetch
(global as any).GM_xmlhttpRequest = vi.fn((details: any) => {
  const { method = 'GET', url, headers = {}, data, onload, onerror } = details;

  fetch(url, {
    method,
    headers,
    body: data
  })
    .then(async (response) => {
      const responseText = await response.text();
      if (onload) {
        onload({
          status: response.status,
          statusText: response.statusText,
          responseText,
          finalUrl: url
        });
      }
    })
    .catch((error) => {
      if (onerror) {
        onerror(error);
      }
    });
});

// 在每个测试前清空存储(除了配置项)
beforeEach(() => {
  const configKeys = ['tmdb_api_key', 'emby_server', 'emby_api_key', 'bangumi_token', 'us_dot_position'];
  for (const [key, value] of gmStorage.entries()) {
    if (!configKeys.includes(key)) {
      gmStorage.delete(key);
    }
  }
});

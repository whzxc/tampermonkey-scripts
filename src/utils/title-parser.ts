/**
 * 标题解析工具模块
 * 提供统一的标题清理和解析功能
 */

import { ParsedTitle } from '../types/common';

/**
 * 季度匹配正则（统一定义）
 */
export const SEASON_REGEX = /(?:[\s:：(（\[【]|^)(?:第[0-9一二三四五六七八九十]+季|Season\s*\d+|S\d+).*/i;

/**
 * 清理标题中的季度信息
 */
export function removeSeasonInfo(title: string): string {
  return title.replace(SEASON_REGEX, '').trim();
}

/**
 * 检测是否包含季度信息
 */
export function hasSeasonInfo(title: string): boolean {
  return SEASON_REGEX.test(title);
}

/**
 * 通用标题清理
 */
export function cleanTitle(title: string): string {
  return title
    .replace(/[【】\[\]()（）]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 解析DMHY标题
 * 从原 dmhy.ts 的 parseTitle 方法迁移而来
 */
export function parseDmhyTitle(raw: string): ParsedTitle {
  let title = raw;
  let group = '';
  let res = '';
  let sub = '';
  let fmt = '';

  // 1. Extract Group (Brackets at start)
  const groupMatch = title.match(/^(?:\[|【)([^\]】]+)(?:\]|】)/);
  if (groupMatch) {
    group = groupMatch[1];
    title = title.replace(groupMatch[0], ' ');
  }

  // 2. Extract Resolution
  const resMatch = title.match(/(?:1080[pP]|720[pP]|2160[pP]|4[kK])/);
  if (resMatch) {
    res = resMatch[0];
    title = title.replace(new RegExp(resMatch[0], 'i'), ' ');
  }

  // 3. Extract Format
  const fmtKeywords = ['AVC', 'HEVC', 'x264', 'x265', 'MP4', 'MKV', 'WebRip', 'BDRip', 'AAC', 'OPUS', '10bit', '8bit'];
  const foundFmts: string[] = [];
  fmtKeywords.forEach(k => {
    const regex = new RegExp(k, 'i');
    if (regex.test(title)) {
      foundFmts.push(k);
      title = title.replace(regex, ' ');
    }
  });
  fmt = foundFmts.join(' ');

  // 4. Extract Subtitles
  const subKeywords = ['CHS', 'CHT', 'GB', 'BIG5', 'JPN', 'ENG', '简', '繁', '日', '双语', '内封', '外挂'];
  title = title.replace(/(?:\[|【|\()([^\]】)]+)(?:\]|】|\))/g, (match, content: string) => {
    const up = content.toUpperCase();
    if (subKeywords.some(k => up.includes(k))) {
      sub += ' ' + content;
      return ' ';
    }
    return match;
  });

  // 5. Clean Main Title (Scoring Logic)
  const scoreStr = (str: string): number => {
    let s = 0; if (!str) return -999;
    const lower = str.toLowerCase();
    if (/[\u4e00-\u9fa5]/.test(str)) s += 15;
    if (str.includes('/')) s += 5;
    const len = str.length;
    if (len >= 2) s += Math.min(len, 20) * 0.5;
    let techCount = 0;
    if (/(?:1080p|720p|mkv|mp4|avc|hevc|aac|opus|bdrip|web-dl|remux|fin|v\d|av1)/.test(lower)) techCount = 1;
    if (/(?:字幕组|搬运|新番|合集|整理|发布|制作|招募|staff)/i.test(str)) s -= 20;
    if (techCount > 0) s -= 5;
    return s;
  };

  const blockRegex = /(?:\[[^\]]+\]|【[^】]+】|★[^★]+★|\([^\)]+\))/g;
  const blocks = title.match(blockRegex) || [];
  const naked = title.replace(blockRegex, ' ').trim();

  let bestStr = naked;
  let maxScore = scoreStr(naked);
  if (naked.length < 2 && !/[\u4e00-\u9fa5]/.test(naked)) maxScore -= 10;

  blocks.forEach(b => {
    const content = b.slice(1, -1);
    const score = scoreStr(content);
    if (score > maxScore) { maxScore = score; bestStr = content; }
  });
  title = bestStr;

  // Standardize & Remove noise
  title = title.replace(/[|／_]/g, '/');
  const techKeywords = /(?:1080p|720p|2160p|4k|web|bdrip|avc|hevc|aac|mp4|mkv|big5|chs|cht|jpn|eng|s\d+|season|fin|opus|x264|x265|10bit|tv动画|剧场版|ova|cd|others)/gi;
  title = title.replace(techKeywords, ' ');
  // 清理中文季/话/集/期标记，包括 "第3期", "第一季", "Season 3" 等
  title = title.replace(/第\s*[\d一二三四五六七八九十]+\s*[话集季期部]/g, ' ');
  title = title.replace(/Season\s*\d+/gi, ' ');
  title = title.replace(/\s\d+-\d+/g, ' ');
  title = title.replace(/\[\d+(?:-\d+)?\]/g, ' ');

  if (title.includes('/')) {
    const parts = title.split('/').map(p => p.trim());
    const cnPart = parts.find(p => /[\u4e00-\u9fa5]/.test(p) && p.length > 1);
    if (cnPart) title = cnPart; else title = parts[0];
  }

  title = title.split('：')[0];
  const parenMatch = title.match(/^([\u4e00-\u9fa5\s\w:-]+)\s*[\(（]/);
  if (parenMatch) title = parenMatch[1];

  title = title.replace(/[\[\]【】()（）★]/g, ' ').replace(/\s+/g, ' ').trim();

  return {
    title,
    group: group.trim(),
    resolution: res.trim(),
    subtitle: sub.trim(),
    format: fmt.trim()
  };
}

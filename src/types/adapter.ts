import type { MediaType } from '@/types/tmdb';

/**
 * Configuration for extracting media info from a single DOM element.
 */
export interface MediaItemConfig {
  /** Extract the title from the item element */
  getTitle: (el: Element) => string;
  /** Extract the year from the item element */
  getYear: (el: Element) => string;
  /** Determine the media type (movie/tv) from the item element */
  getType: (el: Element) => MediaType;
  /** Locate the cover/poster container for DOT mounting */
  getCover: (el: Element) => HTMLElement | null;
  /** Optional: extract Douban subject ID from the item element */
  getDoubanId?: (el: Element) => string;
}

/**
 * Page-level configuration for a specific page pattern within a site.
 */
export interface PageConfig {
  /** Strategy name for logging */
  name: string;
  /** Return true if this page config should handle the current URL */
  match: (url: string) => boolean;
  /** Find all media items on the page */
  getItems: () => NodeListOf<Element> | Element[];
  /** Config for extracting info from each item */
  itemConfig: MediaItemConfig;
  /** Dot size override (default: 'medium') */
  dotSize?: 'small' | 'medium' | 'large';
  /** Whether to use MutationObserver for dynamic content */
  observe?: boolean;
  /** Hook called before mounting DOT on cover element */
  beforeMount?: (cover: HTMLElement) => void;
}

/**
 * Custom handler for pages that don't follow the standard media-check pipeline.
 * (e.g., DMHY uses Bangumi scoring instead of TMDB→Emby)
 */
export interface CustomPageConfig {
  /** Strategy name for logging */
  name: string;
  /** Return true if this page config should handle the current URL */
  match: (url: string) => boolean;
  /** Custom initialization handler — takes over completely */
  handler: () => void | Promise<void>;
}

/**
 * Top-level site configuration.
 * Each supported website exports one of these.
 */
export interface SiteConfig {
  /** Human-readable site name for logging */
  name: string;
  /** Return true if this site config should handle the given URL */
  match: (url: string) => boolean;
  /** Page configs — can be standard (media pipeline) or custom */
  pages: (PageConfig | CustomPageConfig)[];
  /** Optional global styles to inject into the host page */
  globalStyles?: string;
}

/**
 * Type guard: check if a page config is a custom handler.
 */
export function isCustomPageConfig(
  config: PageConfig | CustomPageConfig,
): config is CustomPageConfig {
  return 'handler' in config;
}

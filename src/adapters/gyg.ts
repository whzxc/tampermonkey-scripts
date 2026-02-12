import type { SiteConfig } from '@/types/adapter';
import type { MediaType } from '@/types/tmdb';

/**
 * GYG (gyg.si) adapter configuration.
 *
 * Supports:
 * - List pages (/mv, /tv, /ac, /)
 * - Detail pages (all other paths)
 */
export const gygConfig: SiteConfig = {
  name: 'GYG',

  match: (url) => url.includes('gyg.si'),

  pages: [
    // === List page ===
    {
      name: 'list',
      match: () => ['/mv', '/tv', '/ac', '/'].includes(location.pathname),
      getItems: () => document.querySelectorAll('.content-list li'),
      itemConfig: {
        getTitle: (item) => item.querySelector('a')?.getAttribute('title') || '',
        getYear: (item) => item.querySelector('.li-bottom .tag')?.textContent?.match(/\b(19|20)\d{2}\b/)?.[0] || '',
        getType: (item): MediaType => item.querySelector<HTMLLinkElement>('.cover a')?.getAttribute('href')?.startsWith('/mv') ? 'movie' : 'tv',
        getCover: (item) => item.querySelector('.cover') as HTMLElement | null,
        getDoubanId: () => '',
      },
      dotSize: 'medium',
      observe: false,
    },

    {
      name: 'hits',
      match: (url) => new URL(url).pathname.startsWith('/hits'),
      getItems: () => document.querySelectorAll('.content-list li'),
      itemConfig: {
        getTitle: (item) => item.querySelector('a')?.getAttribute('title') || '',
        getYear: (item) => item.querySelector('.li-bottom .tag')?.textContent?.match(/\b(19|20)\d{2}\b/)?.[0] || '',
        getType: (): MediaType => location.pathname.startsWith('/hits/mv') ? 'movie' : 'tv',
        getCover: (item) => item.querySelector('.cover') as HTMLElement | null,
        getDoubanId: () => '',
      },
      dotSize: 'medium',
      observe: false,
    },

    // === Detail page ===
    {
      name: 'detail',
      match: () => true, // fallback for any non-list path
      getItems: () => {
        const el = document.querySelector('.main-meta picture img');
        if (!el) return [] as unknown as NodeListOf<Element>;
        // Return the rating section as the "item" — we mount our dot on it
        const ratingSection = document.querySelector('.ratings-section');
        return ratingSection ? [ratingSection] as unknown as NodeListOf<Element> : [] as unknown as NodeListOf<Element>;
      },
      itemConfig: {
        getTitle: () => document.querySelector('.main-meta picture img')?.getAttribute('alt') || '',
        getYear: () => document.querySelector('.main-ui-meta .year')?.textContent?.trim().replace(/[()]/g, '') || '',
        getType: (): MediaType => location.pathname.startsWith('/mv') ? 'movie' : 'tv',
        getCover: () => document.querySelector('.main-meta .img'),
        getDoubanId: () => new URL(document.querySelector('.ratings-section')?.querySelector('a')?.href || '').pathname.split('/').filter(Boolean)[1],
      },
      dotSize: 'medium',
      observe: false,
    },
  ],
};

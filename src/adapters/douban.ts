import type { SiteConfig } from '@/types/adapter';
import type { MediaType } from '@/types/tmdb';

/**
 * Douban adapter configuration.
 *
 * Supports:
 * - Subject detail page (/subject/)
 * - Explore list page (subject-list-list)
 * - Chart page (indent tr.item)
 * - Subject collection page (frc-subject-card-l)
 */
const doubanConfig: SiteConfig = {
  name: 'Douban',

  match: (url) => url.includes('movie.douban.com') || url.includes('m.douban.com'),

  pages: [
    // === Subject detail page ===
    {
      name: 'subject',
      match: () => location.pathname.startsWith('/subject/'),
      getItems: () => {
        const container = document.querySelector('#mainpic');
        return container ? [container] as unknown as NodeListOf<Element> : [] as unknown as NodeListOf<Element>;
      },
      itemConfig: {
        getTitle: () => {
          const titleEl = document.querySelector('#content h1 span');
          return titleEl?.textContent?.trim() || '';
        },
        getYear: () => {
          const yearEl = document.querySelector('#content h1 .year');
          return yearEl?.textContent?.replace(/[()]/g, '').trim() || '';
        },
        getType: (): MediaType => {
          const titleEl = document.querySelector('#content h1 span');
          const title = titleEl?.textContent?.trim() || '';
          const infoEl = document.querySelector('#info');
          const infoText = infoEl?.textContent || '';

          // Check for TV indicators
          if (infoText.includes('集数')) return 'tv';
          if (/(?:[\s:：(（\[【]|^)(?:第[0-9一二三四五六七八九十]+季|Season\s*\d+|S\d+)/i.test(title)) return 'tv';

          return 'movie';
        },
        getCover: (el) => el as HTMLElement,
        getDoubanId: () => location.pathname.split('/').filter(Boolean)[1] || '',
      },
      dotSize: 'medium',
      observe: false,
      beforeMount: (cover) => {
        cover.style.marginLeft = '0';
      },
    },

    // === Explore list page ===
    {
      name: 'explore',
      match: () => location.pathname.startsWith('/explore'),
      getItems: () => document.querySelectorAll('.subject-list-list li'),
      itemConfig: {
        getTitle: (el) => el?.querySelector('.drc-subject-info-title-text')?.textContent || '',
        getYear: (el) => el?.querySelector('.drc-subject-info-subtitle')?.textContent?.match(/\b(19|20)\d{2}\b/)?.[0] || '',
        getType: (card): MediaType => card.querySelector('.drc-subject-card')?.classList.contains('tv') ? 'tv' : 'movie',
        getCover: (card) => card.querySelector('.drc-cover-container') as HTMLElement | null,
        getDoubanId: (card) => new URL(card.querySelector('a')?.href || '').searchParams.get('uri')?.split('/').slice(-1)[0] || '',
      },
      dotSize: 'small',
      observe: true,
    },

    // === Chart page ===
    {
      name: 'chart',
      match: () => location.pathname.startsWith('/chart'),
      getItems: () => document.querySelectorAll('.indent tr.item'),
      itemConfig: {
        getTitle: (el) => el?.querySelector('a.nbg')?.getAttribute('title') || '',
        getYear: (el) => el?.querySelector('td p')?.textContent?.match(/\b(19|20)\d{2}\b/)?.[0] || '',
        getType: (): MediaType => 'movie',
        getCover: (card) => card.querySelector('a.nbg') as HTMLElement | null,
        getDoubanId: (el) => new URL(el?.querySelector<HTMLLinkElement>('a.nbg')?.href || '').pathname.split('/').filter(Boolean)[1] || '',
      },
      dotSize: 'small',
      observe: true,
    },

    // === Subject collection page ===
    {
      name: 'subject_collection',
      match: () => location.pathname.startsWith('/subject_collection'),
      getItems: () => document.querySelectorAll('.frc-subject-card-l'),
      itemConfig: {
        getTitle: (el) => el?.querySelector('h3.frc-subject-info-title')?.textContent || '',
        getYear: (el) => el?.querySelector('.frc-subject-info-content')?.textContent?.match(/\b(19|20)\d{2}\b/)?.[0] || '',
        getType: (card): MediaType => card.parentElement?.parentElement?.classList.contains('tv') ? 'tv' : 'movie',
        getCover: (card) => card.querySelector('.frc-size-cover') as HTMLElement | null,
        getDoubanId: (el) => new URL(el.querySelector<HTMLLinkElement>('.frc-subject-item-tag-vendor')?.href || '').pathname.split('/').filter(Boolean)[1] || '',
      },
      dotSize: 'medium',
      observe: true,
    },
  ],
};

export default doubanConfig;

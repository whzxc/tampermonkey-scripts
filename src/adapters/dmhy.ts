import type { SiteConfig } from '@/types/adapter';
import { createApp, h } from 'vue';
import DmhyTitle from '@/components/DmhyTitle.vue';

export const dmhyConfig: SiteConfig = {
  name: 'DMHY',

  match: (url) => {
    try {
      const u = new URL(url);
      return u.hostname.includes('dmhy.org') &&
        (u.pathname === '/' || u.pathname.startsWith('/topics'));
    } catch {
      return false;
    }
  },

  globalStyles: `
    table#topic_list tr td span.tag { display: none !important; }
    body > .container { margin: 0 auto }
  `,

  pages: [
    {
      name: 'topic_list',
      match: () => true,
      handler: () => {
        const titles = document.querySelectorAll('#topic_list td.title');

        titles.forEach(title => {
          if (!['sort-2', 'sort-31'].some(e => title.previousElementSibling?.querySelector('a')?.classList.contains(e))) return;

          const anchor = title.querySelector('& > a') as HTMLAnchorElement;

          const href = anchor.getAttribute('href') || '';
          if (!href.includes('/topics/view/')) return;

          const rawTitle = anchor.textContent?.trim() || '';
          if (!rawTitle) return;

          const container = document.createElement('div');

          if (anchor.parentNode) {
            anchor.parentNode.replaceChild(container, anchor);

            const app = createApp({
              render() {
                return h(DmhyTitle, {
                  originalTitle: rawTitle,
                  href: href,
                });
              },
            });
            app.mount(container);
          }
        });
      },
    },
  ],
};

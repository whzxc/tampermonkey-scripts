import type { SiteConfig } from '@/types/adapter';
import { parseDmhyTitle, type ParsedDmhyTitle } from './dmhy-title-parser';
import { embyService } from '@/services/api/emby';
import { bangumiService } from '@/services/api/bangumi';
import { uiController } from '@/services/ui-controller';
import type { MediaCheckResult } from '@/services/media-service';
import { configService } from '@/services/config';
import { createApp, h, reactive } from 'vue';
import DmhyTags from '@/components/DmhyTags.vue';

/**
 * DMHY adapter configuration.
 *
 * Pipeline per row:
 * 1. Parse raw title → cleaned title + tags
 * 2. Replace DOM text with cleaned title + tag badges (via Vue component)
 * 3. Try Emby search (with name validation) → if found, mount green DOT
 * 4. Fallback: Bangumi search → update Vue component state with Bangumi badge
 */
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
    /* Hide original tag spans */
    table#topic_list tr td span.tag { display: none !important; }

    /* Inline DOT for DMHY (no cover images) */
    .us-dmhy-dot-wrapper {
      display: inline-block;
      width: 14px;
      height: 14px;
      margin-right: 4px;
      vertical-align: middle;
      position: relative;
    }
  `,

  pages: [
    {
      name: 'topic_list',
      match: () => true,
      handler: () => processTopicList(),
    },
  ],
};

// ─── DMHY handler logic ─────────────────────────────────────────────────

interface TagState {
  tags: ParsedDmhyTitle;
  bangumiSubject: {
    id: number;
    name: string;
    name_cn?: string;
    url: string;
  } | null;
}

function processTopicList(): void {
  const titles = document.querySelectorAll('#topic_list td.title');

  titles.forEach(title => {
    if (!['sort-2', 'sort-31'].some(e => title.previousElementSibling?.querySelector('a')?.classList.contains(e))) return;

    const anchor = title.querySelector('& > a') as HTMLAnchorElement;

    // Only process links to topic views
    const href = anchor.getAttribute('href') || '';
    if (!href.includes('/topics/view/')) return;

    const rawTitle = anchor.textContent?.trim() || '';
    if (!rawTitle) return;

    // 1. Parse
    const parsed = parseDmhyTitle(rawTitle);
    if (!parsed.title) return;

    // 2. Replace title text and set raw title as tooltip
    anchor.textContent = parsed.title;
    anchor.title = rawTitle;

    // 3. Mount Tag Component (after the anchor)
    const tagContainer = document.createElement('span');
    anchor.parentNode?.insertBefore(tagContainer, anchor.nextSibling);

    const state = reactive<TagState>({
      tags: parsed,
      bangumiSubject: null,
    });

    const app = createApp({
      render() {
        return h(DmhyTags, {
          tags: state.tags,
          bangumiSubject: state.bangumiSubject,
        });
      },
    });

    // Add scoped styles class to container if needed, or component handles it.
    // DmhyTags uses inline Tailwind classes, so just mounting is fine.
    // However, we need to make sure Tailwind preflight/reset doesn't break things here.
    // We can add .tw-reset to the container if styles are wonky.
    tagContainer.classList.add('tw-reset', 'inline-block', 'align-middle');
    app.mount(tagContainer);

    // 4. Mount inline DOT before title
    const dotWrapper = document.createElement('div');
    dotWrapper.className = 'us-dmhy-dot-wrapper';
    anchor.parentNode?.insertBefore(dotWrapper, anchor);

    const dot = uiController.mountDot(dotWrapper, 'mini');

    // 5. Run Emby → Bangumi pipeline
    processAnimeItem(parsed.title, dot, state);
  });
}



async function processAnimeItem(
  title: string,
  dot: Element,
  state: TagState,
): Promise<void> {
  // Common result props
  const baseResult = {
    title,
    mediaType: 'tv' as const,
    searchQueries: [title],
    tmdbId: null,
    embyItem: null,
  };

  try {
    // Step A: Try Emby search first (if configured)
    if (configService.validate('emby')) {
      const embyResult = await embyService.searchByName(title);
      const items = embyResult.data || [];

      // Validate results: filter to items whose name actually matches the search title
      const matchedItems = items.filter(item => isNameMatch(title, item.Name));

      if (matchedItems.length > 0) {
        const item = matchedItems[0];
        // Found in Emby → green dot, clickable

        const result: MediaCheckResult = {
          ...baseResult,
          embyItem: item,
          embyItems: matchedItems.length > 1 ? matchedItems : undefined,
          status: 'found',
          statusMessage: `Found: ${item.Name}`,
        };

        uiController.updateDot(dot, result);
        uiController.bindInfoCard(dot, result);

        return; // Done — skip Bangumi
      }
    }

    // Step B: Bangumi search (update Vue component state)
    if (configService.validate('bangumi')) {
      const bangumiResult = await bangumiService.search(title);
      const subject = bangumiResult.data;

      if (subject) {
        // Found on Bangumi → grey dot (not in Emby), no click handler

        // Update Vue state to show Bangumi badge
        state.bangumiSubject = {
          id: subject.id,
          name: subject.name,
          name_cn: subject.name_cn,
          url: `https://bgm.tv/subject/${subject.id}`,
        };

        const result: MediaCheckResult = {
          ...baseResult,
          status: 'not-found',
          statusMessage: `BGM: ${subject.name_cn || subject.name}`,
        };
        uiController.updateDot(dot, result);

        return;
      }
    }

    // Neither Emby nor Bangumi returned results
    const result: MediaCheckResult = {
      ...baseResult,
      status: 'not-found',
      statusMessage: 'Not found',
    };
    uiController.updateDot(dot, result);
  } catch (error: any) {
    const result: MediaCheckResult = {
      ...baseResult,
      status: 'error',
      statusMessage: `Error: ${error.message || error}`,
    };
    uiController.updateDot(dot, result);
  }
}

/**
 * Check if an Emby item name reasonably matches the search title.
 * Prevents false positives from Emby's fuzzy search.
 */
function isNameMatch(searchTitle: string, embyName: string): boolean {
  const normalize = (s: string) => s
    .toLowerCase()
    .replace(/[\s\-–—:：·・、,，.。!！?？]/g, '')
    .replace(/[（()）\[\]【】]/g, '');

  const a = normalize(searchTitle);
  const b = normalize(embyName);

  // Exact match
  if (a === b) return true;

  // One contains the other
  if (a.includes(b) || b.includes(a)) return true;

  // Check if a significant portion of characters overlap
  // (handles cases like "葬送的芙莉莲" matching "葬送的芙莉莲 第二季")
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length > b.length ? a : b;

  if (shorter.length >= 2 && longer.includes(shorter)) return true;

  // Character overlap ratio for CJK titles
  if (/[\u4e00-\u9fa5]/.test(a) && /[\u4e00-\u9fa5]/.test(b)) {
    const charsA = new Set(a);
    let overlap = 0;
    for (const c of b) {
      if (charsA.has(c)) overlap++;
    }
    const ratio = overlap / Math.max(a.length, b.length);
    if (ratio >= 0.6) return true;
  }

  return false;
}

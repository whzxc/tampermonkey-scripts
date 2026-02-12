import type { SiteConfig } from '@/types/adapter';
import { parseDmhyTitle } from './dmhy-title-parser';
import { embyService } from '@/services/api/emby';
import { bangumiService } from '@/services/api/bangumi';
import { uiController } from '@/services/ui-controller';
import { configService } from '@/services/config';

/**
 * DMHY adapter configuration.
 *
 * Pipeline per row:
 * 1. Parse raw title → cleaned title + tags
 * 2. Replace DOM text with cleaned title + tag badges
 * 3. Try Emby search (with name validation) → if found, mount green DOT
 * 4. Fallback: Bangumi search → extract id, mount Bangumi link badge
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

    /* Tag badges */
    .us-dmhy-tag {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      margin-left: 4px;
      white-space: nowrap;
      vertical-align: middle;
      line-height: 1.6;
    }
    .us-dmhy-tag-group    { background: #fff8e1; color: #f57f17; }
    .us-dmhy-tag-res      { background: #e3f2fd; color: #1565c0; }
    .us-dmhy-tag-codec    { background: #f3e5f5; color: #6a1b9a; }
    .us-dmhy-tag-audio    { background: #fce4ec; color: #c62828; }
    .us-dmhy-tag-source   { background: #e8f5e9; color: #2e7d32; }
    .us-dmhy-tag-subtitle { background: #e0f7fa; color: #00695c; }
    .us-dmhy-tag-format   { background: #e0e0e0; color: #424242; }
    .us-dmhy-tag-bangumi  { background: #e8f5e9; color: #2e7d32; cursor: pointer; text-decoration: none; }
    .us-dmhy-tag-bangumi:hover { opacity: 0.8; }
    .us-dmhy-tag-episode  { background: #ede7f6; color: #4527a0; }
    .us-dmhy-tag-season   { background: #fce4ec; color: #880e4f; }

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

// ─── Tag badge definitions ──────────────────────────────────────────────

interface TagDef {
  key: string;
  cssClass: string;
}

// Order: Season → Episode → Group → tech tags
const TAG_DEFS: TagDef[] = [
  { key: 'season', cssClass: 'us-dmhy-tag-season' },
  { key: 'episode', cssClass: 'us-dmhy-tag-episode' },
  { key: 'group', cssClass: 'us-dmhy-tag-group' },
  { key: 'resolution', cssClass: 'us-dmhy-tag-res' },
  { key: 'codec', cssClass: 'us-dmhy-tag-codec' },
  { key: 'audio', cssClass: 'us-dmhy-tag-audio' },
  { key: 'source', cssClass: 'us-dmhy-tag-source' },
  { key: 'subtitle', cssClass: 'us-dmhy-tag-subtitle' },
  { key: 'format', cssClass: 'us-dmhy-tag-format' },
];

// ─── DMHY handler logic ─────────────────────────────────────────────────

function processTopicList(): void {
  const links = document.querySelectorAll('#topic_list td.title a');

  links.forEach(link => {
    const anchor = link as HTMLAnchorElement;
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

    // 3. Append tag badges (after the anchor)
    const tagContainer = document.createElement('span');
    tagContainer.style.whiteSpace = 'nowrap';

    // All tags in defined order (Season → Episode → Group → tech tags)
    for (const def of TAG_DEFS) {
      const value = parsed[def.key as keyof typeof parsed];
      if (value) {
        tagContainer.appendChild(createTagBadge(value, def.cssClass));
      }
    }

    // Insert tags after the anchor
    anchor.parentNode?.insertBefore(tagContainer, anchor.nextSibling);

    // 4. Mount inline DOT before title
    const dotWrapper = document.createElement('div');
    dotWrapper.className = 'us-dmhy-dot-wrapper';
    anchor.parentNode?.insertBefore(dotWrapper, anchor);

    const dot = uiController.mountDot(dotWrapper, 'mini');

    // 5. Run Emby → Bangumi pipeline
    processAnimeItem(parsed.title, dot, tagContainer);
  });
}

async function processAnimeItem(
  title: string,
  dot: Element,
  tagContainer: HTMLElement,
): Promise<void> {
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
        dot.setAttribute('status', 'found');
        dot.setAttribute('title', `Emby: ${item.Name}`);

        // Bind InfoCard on click (only for actual Emby matches)
        uiController.bindInfoCard(dot, {
          tmdbId: null,
          embyItem: item,
          embyItems: matchedItems.length > 1 ? matchedItems : undefined,
          status: 'found',
          statusMessage: `Found: ${item.Name}`,
          title,
          mediaType: 'tv',
          searchQueries: [title],
        });

        return; // Done — skip Bangumi
      }
    }

    // Step B: Bangumi search (no InfoCard, just Bangumi link badge)
    if (configService.validate('bangumi')) {
      const bangumiResult = await bangumiService.search(title);
      const subject = bangumiResult.data;

      if (subject) {
        // Found on Bangumi — grey dot (not in Emby), no click handler
        dot.setAttribute('status', 'not-found');
        dot.setAttribute('title', `BGM: ${subject.name_cn || subject.name}`);

        // Bangumi ID badge (clickable link)
        const bangumiLink = document.createElement('a');
        bangumiLink.className = 'us-dmhy-tag us-dmhy-tag-bangumi';
        bangumiLink.textContent = `BGM:${subject.id}`;
        bangumiLink.href = `https://bgm.tv/subject/${subject.id}`;
        bangumiLink.target = '_blank';
        bangumiLink.rel = 'noopener noreferrer';
        bangumiLink.title = subject.name_cn || subject.name;
        bangumiLink.addEventListener('click', e => e.stopPropagation());
        tagContainer.appendChild(bangumiLink);

        return;
      }
    }

    // Neither Emby nor Bangumi returned results
    dot.setAttribute('status', 'not-found');
    dot.setAttribute('title', 'Not found');
  } catch (error) {
    dot.setAttribute('status', 'error');
    dot.setAttribute('title', `Error: ${error}`);
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

function createTagBadge(text: string, cssClass: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = `us-dmhy-tag ${cssClass}`;
  span.textContent = text;
  return span;
}

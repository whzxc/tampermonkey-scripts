import { mediaService } from '@/services/media-service';
import { uiController } from '@/services/ui-controller';
import type { PageConfig, SiteConfig } from '@/types/adapter';
import { isCustomPageConfig } from '@/types/adapter';

/**
 * Config-driven adapter engine.
 *
 * Accepts a SiteConfig and automatically executes:
 * 1. Match the current page to a PageConfig
 * 2. Iterate items → extract title/year/type/cover from DOM
 * 3. Call MediaService.checkMedia for each item
 * 4. Call UIController to mount DOT and bind InfoCard
 */
class AdapterEngine {
  private processedElements = new WeakSet<Element>();

  /**
   * Run a site config against the current page.
   */
  run(config: SiteConfig): void {
    // Inject global styles if provided
    if (config.globalStyles) {
      GM.addStyle(config.globalStyles);
    }

    const url = location.href;

    for (const page of config.pages) {
      if (!page.match(url)) continue;

      // Custom handler — delegate entirely
      if (isCustomPageConfig(page)) {
        page.handler();
        return;
      }

      // Standard media pipeline
      this.processPage(page);
      return;
    }
  }

  /**
   * Process a standard page config:
   * scan items, optionally observe for dynamic content.
   */
  private processPage(page: PageConfig): void {
    const scan = () => this.scanItems(page);

    scan();

    if (page.observe) {
      const observer = new MutationObserver(() => scan());
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }

  /**
   * Scan all items matching the page config and process unprocessed ones.
   */
  private scanItems(page: PageConfig): void {
    const items = page.getItems();

    items.forEach(item => {
      if (this.processedElements.has(item)) return;
      this.processedElements.add(item);

      this.processItem(item, page);
    });
  }

  /**
   * Process a single media item:
   * extract info → mount dot → check media → update dot → bind card.
   */
  private async processItem(item: Element, page: PageConfig): Promise<void> {
    const { itemConfig, dotSize } = page;

    let title = itemConfig.getTitle(item);
    let mediaType = itemConfig.getType(item);
    let year = itemConfig.getYear(item);

    // Clean season info from title
    if (hasSeasonInfo(title)) {
      mediaType = 'tv';
      year = '';
      title = removeSeasonInfo(title);
    }

    const cover = itemConfig.getCover(item);
    if (!cover) return;

    // Optional pre-mount hook
    if (page.beforeMount) {
      page.beforeMount(cover);
    }

    // Mount dot
    const dot = uiController.mountDot(cover, dotSize || 'medium');

    // Extract optional IDs
    const doubanId = itemConfig.getDoubanId ? itemConfig.getDoubanId(item) : '';

    // Build search queries
    const searchQueries = [title];
    const fullTitle = itemConfig.getTitle(item); // raw title before season removal
    if (fullTitle !== title) searchQueries.unshift(fullTitle);

    // Check media through unified pipeline
    const result = await mediaService.checkMedia(title, year, mediaType, searchQueries, doubanId);

    // Update dot with result
    uiController.updateDot(dot, result);

    // Bind click → InfoCard
    uiController.bindInfoCard(dot, result);
  }
}

export const SEASON_REGEX = /(?:[\s:：(（\[【]|^)(?:第[0-9一二三四五六七八九十]+季|Season\s*\d+|S\d+).*/i;

export function removeSeasonInfo(title: string): string {
  return title.replace(SEASON_REGEX, '').trim();
}

export function hasSeasonInfo(title: string): boolean {
  return SEASON_REGEX.test(title);
}

export const adapterEngine = new AdapterEngine();

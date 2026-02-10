import { Utils } from '../../utils';
import { UI } from '../../utils/ui';
import { CONFIG } from '../../core/api-config';
import { tmdbService } from '../../services/tmdb';
import { embyService, EmbyItem } from '../../services/emby';
import { BaseMediaHandler } from '../base-handler';
import { removeSeasonInfo, hasSeasonInfo } from '../../utils/title-parser';

interface Strategy {
  name: string;
  itemSelector: string;
  titleSelector: string;
  yearSelector: string;
  getYear: (el: Element | null) => string;
  getType: (card: Element) => 'tv' | 'movie' | null;
  getCover: (card: Element) => Element | null | undefined;
}

export class DoubanListHandler extends BaseMediaHandler {
  private strategies: Strategy[];

  constructor() {
    super(); // 调用基类constructor
    this.strategies = [
      {
        // Scenario 1: Explore / TV (React App)
        name: 'Explore/TV',
        itemSelector: '.drc-subject-card',
        titleSelector: '.drc-subject-info-title-text',
        yearSelector: '.drc-subject-info-subtitle',
        getYear: (el) => {
          const text = el ? el.textContent : '';
          return text?.split('/').map(t => t.trim())[0] || '';
        },
        getType: (card) => {
          if (card.classList.contains('tv')) return 'tv';
          if (card.classList.contains('movie')) return 'movie';
          return null;
        },
        getCover: (card) => card.querySelector('.drc-subject-cover') || card.querySelector('img')?.parentElement
      },
      {
        // Scenario 2: Chart (Classic HTML)
        name: 'Chart',
        itemSelector: 'tr.item',
        titleSelector: 'div.pl2 > a',
        yearSelector: 'p.pl',
        getYear: (el) => {
          // Format: "2024-05-01(China) / ..." or "2023 / ..."
          const text = el ? el.textContent : '';
          const match = text?.match(/(\d{4})/);
          return match ? match[1] : '';
        },
        getType: () => 'movie',
        getCover: (card) => card.querySelector('a.nbg')
      },
      {
        // Scenario 3: Subject Collection (m.douban.com)
        name: 'SubjectCollection',
        itemSelector: '.frc-swiper-card',
        titleSelector: '.frc-subject-info-title',
        yearSelector: '.frc-subject-info-content',
        getYear: (el) => {
          const text = el ? el.textContent : '';
          return text?.split('/').map(t => t.trim())[0] || '';
        },
        getType: (card) => {
          let parent = card.parentElement;
          while (parent && parent !== document.body) {
            if (parent.classList.contains('tv')) return 'tv';
            if (parent.classList.contains('movie')) return 'movie';
            parent = parent.parentElement;
          }
          return null;
        },
        getCover: (card) => card.querySelector('.frc-subject-cover') || card.querySelector('img')?.parentElement
      }
    ];
  }

  init(): void {
    Utils.log('Initializing Douban List Handler');
    UI.init();
    this.observe();
  }

  observe(): void {
    this.processExistingCards();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          this.processExistingCards();
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  processExistingCards(): void {
    // Iterate over all strategies to find matching items
    this.strategies.forEach(strategy => {
      const cards = document.querySelectorAll(strategy.itemSelector);
      if (cards.length > 0) Utils.log(`Strategy ${strategy.name}: Found ${cards.length} cards`);

      cards.forEach(card => {
        const titleEl = card.querySelector(strategy.titleSelector);
        if (!titleEl) return;

        // Get raw title for comparison
        let rawTitle = '';

        if (strategy.name === 'Explore/TV') {
          rawTitle = titleEl.textContent?.trim() || '';
        } else if (strategy.name === 'SubjectCollection') {
          rawTitle = Array.from(titleEl.childNodes)
            .filter(n => n.nodeType === 3) // Text nodes
            .map(n => n.textContent)
            .join('').trim();
          if (!rawTitle) rawTitle = titleEl.textContent?.trim() || ''; // Fallback
        } else {
          // Chart
          rawTitle = titleEl.childNodes[0]?.textContent?.trim().split('/')[0].trim() || '';
        }

        // Check if already processed and title matches
        if ((card as HTMLElement).getAttribute('data-gyg-title') === rawTitle) {
          return;
        }

        this.processCard(card as HTMLElement, strategy, rawTitle);
      });
    });
  }

  async processCard(card: HTMLElement, strategy: Strategy, rawTitle: string): Promise<void> {
    // Mark as processed with current title
    card.setAttribute('data-gyg-title', rawTitle);

    const titleEl = card.querySelector(strategy.titleSelector);
    const yearEl = card.querySelector(strategy.yearSelector);

    // Find Cover to attach Dot
    const coverEl = strategy.getCover(card);
    if (!coverEl) {
      Utils.log(`No cover found for ${rawTitle}`);
      return;
    }

    // Clean TV Season suffixes
    let cleanTitle = rawTitle;
    let useYear = strategy.getYear(yearEl);
    const mediaType = strategy.getType ? strategy.getType(card) : null;

    // 使用统一的标题解析工具
    if (hasSeasonInfo(rawTitle)) {
      cleanTitle = removeSeasonInfo(rawTitle);
      useYear = ''; // Don't filter by year
    }

    // Create Dot
    const dot = UI.createDot({
      posterContainer: coverEl as HTMLElement,
      titleElement: titleEl as HTMLElement
    });
    dot.title = `Checking ${cleanTitle}...`;

    try {
      // 使用基类的通用媒体检查流程
      const result = await this.checkMedia(cleanTitle, useYear, mediaType, rawTitle);
      this.updateDotStatus(dot, result, cleanTitle, [cleanTitle]);
    } catch (e) {
      this.handleError(dot, e, cleanTitle, this.logger);
    }
  }
}

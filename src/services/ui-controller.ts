import { createApp, h, reactive, type App } from 'vue';
import type { MediaCheckResult } from '@/services/media-service';
import StatusDot from '@/components/StatusDot.vue';
import InfoCard from '@/components/InfoCard.vue';
import Settings from '@/components/Settings.vue';

/**
 * Unified UI injection controller.
 *
 * Handles StatusDot mounting, state updates, click binding, and InfoCard/Settings display.
 */
class UIController {
  // Store update functions for dots: Map<Element, (result: MediaCheckResult) => void>
  private dotUpdaters = new WeakMap<Element, (result: MediaCheckResult) => void>();
  private dotClickHandlers = new WeakMap<Element, (result: MediaCheckResult) => void>();
  private settingsApp: App | null = null;
  private settingsContainer: HTMLElement | null = null;

  /**
   * Create and mount a StatusDot on the given cover element.
   */
  mountDot(
    cover: HTMLElement,
    size: 'small' | 'medium' | 'large' | 'mini' = 'medium',
    inline?: boolean,
  ): Element {
    const container = document.createElement('div');
    if (inline) {
      container.style.display = 'inline-block';
    } else {
      container.style.position = 'absolute';
      container.style.zIndex = '99';
      container.style.left = '0';
      container.style.top = '0';
    }

    const sizeMap = {
      mini: '12px',
      small: '20px',
      medium: '28px',
      large: '36px',
    };

    container.style.width = sizeMap[size];
    container.style.height = sizeMap[size];

    // Reactive state for the dot
    const state = reactive<{
      status: 'loading' | 'found' | 'not-found' | 'error';
      title: string;
    }>({
      status: 'loading',
      title: '',
    });

    const app = createApp({
      render() {
        return h(StatusDot, {
          status: state.status,
          title: state.title,
          size: size,
          onDotClick: () => {
            // Retrieve the current result associated with this dot and call handler
            const handler = uiController.dotClickHandlers.get(container);
            if (handler) {
              // We need the result here. 
              // The handler is bound in bindInfoCard, which has the result closure.
              // So calling handler() is enough? 
              // bindInfoCard(dotEl, result) -> sets handler = () => showModal(result)
              // Yes.
              handler(null as any); // Argument ignored by internal handler usually
            }
          }
        });
      },
    });

    app.mount(container);

    if (!inline) {
      cover.style.position = 'relative';
      // cover.style.display = 'block'; // Avoid forcing block if not needed? formatting
      if (getComputedStyle(cover).display === 'inline') {
        cover.style.display = 'inline-block';
      }
    }
    cover.appendChild(container);

    // Store updater
    this.dotUpdaters.set(container, (result: MediaCheckResult) => {
      state.status = result.status;
      state.title = result.statusMessage;
    });

    return container;
  }

  /**
   * Update a mounted dot element based on a MediaCheckResult.
   */
  updateDot(dotEl: Element, result: MediaCheckResult): void {
    const updater = this.dotUpdaters.get(dotEl);
    if (updater) {
      updater(result);
    }
  }

  /**
   * Bind click events on a dot to show the InfoCard.
   */
  bindInfoCard(dotEl: Element, result: MediaCheckResult): void {
    // Store the handler logic
    this.dotClickHandlers.set(dotEl, () => {
      this.showModal(result);
    });

    // Also bind native click on container just in case, though StatusDot emits dotClick
    dotEl.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showModal(result);
    });
  }

  /**
   * Show the InfoCard modal with the given media check result.
   */
  showModal(result: MediaCheckResult): void {
    // Remove existing info card
    const existing = document.getElementById('us-info-card-container');
    if (existing) {
      // Ideally we reuse or unmount. For simplicity, remove.
      // But 'createApp' unmount? 
      // We can't easily access the app instance from here unless stored.
      existing.remove();
      // Note: this leaves the previous app instance hanging in memory potentially? 
      // Vue 3 generally cleans up observed nodes, but explicit unmount is better.
      // Let's rely on simple DOM removal for now as it's a userscript, or better: store single instance.
    }

    const container = document.createElement('div');
    container.id = 'us-info-card-container';
    document.body.appendChild(container);

    const app = createApp({
      render() {
        return h(InfoCard, {
          visible: true,
          title: result.title,
          embyItem: result.embyItem,
          embyItems: result.embyItems,
          searchQueries: result.searchQueries,
          tmdbInfo: result.tmdbInfo,
          tmdbResults: result.tmdbResults,
          onClose: () => {
            app.unmount();
            container.remove();
          }
        });
      }
    });

    app.mount(container);
  }

  /**
   * Show Settings modal.
   */
  showSettings(initialTab?: string): void {
    // Remove existing
    const existing = document.getElementById('us-settings-container');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'us-settings-container';
    document.body.appendChild(container);

    const app = createApp({
      render() {
        return h(Settings, {
          visible: true,
          initialTab,
          onClose: () => {
            app.unmount();
            container.remove();
          }
        });
      }
    });

    app.mount(container);
  }
}

export const uiController = new UIController();

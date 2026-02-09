import { CONFIG } from '../core/api-config';

/**
 * DOT 状态类型
 */
export type DotStatus = 'loading' | 'found' | 'not-found' | 'error';

/**
 * DOT 控制器选项
 */
export interface DotControllerOptions {
  posterContainer?: HTMLElement;
  titleElement?: HTMLElement;
}

/**
 * DOT 控制器
 * 管理单个状态点的完整生命周期
 */
export class DotController {
  private posterContainer?: HTMLElement;
  private titleElement?: HTMLElement;
  private element: HTMLElement | null = null;
  private status: DotStatus = 'loading';
  private tooltip: string = '';
  private onClick: ((e: MouseEvent) => void) | null = null;

  constructor(options: DotControllerOptions = {}) {
    this.posterContainer = options.posterContainer;
    this.titleElement = options.titleElement;
  }

  /**
   * 创建 DOT 元素
   */
  create(): HTMLElement {
    const dot = document.createElement('div');
    dot.className = 'us-dot loading';

    // 决定定位策略
    const position = CONFIG.state.dotPosition;
    const isInlinePosition = position === 'title_left' || position === 'title_right';
    const isPosterPosition = position.startsWith('poster_');

    if (isInlinePosition && this.titleElement) {
      // 内联模式:在标题旁边
      dot.classList.add('inline');
      if (position === 'title_right') {
        this.titleElement.parentNode?.insertBefore(dot, this.titleElement.nextSibling);
      } else {
        this.titleElement.parentNode?.insertBefore(dot, this.titleElement);
      }
    } else if (isPosterPosition && this.posterContainer) {
      // 海报模式:绝对定位在海报上
      dot.classList.add('on-poster');
      this.posterContainer.style.position = 'relative';
      this.posterContainer.appendChild(dot);
    } else {
      // 自动模式:优先海报,其次标题
      if (this.posterContainer) {
        dot.classList.add('on-poster');
        this.posterContainer.style.position = 'relative';
        this.posterContainer.appendChild(dot);
      } else if (this.titleElement) {
        dot.classList.add('inline');
        this.titleElement.appendChild(dot);
      }
    }

    this.element = dot;
    return dot;
  }

  /**
   * 更新状态
   */
  updateStatus(status: DotStatus, tooltip: string = ''): void {
    if (!this.element) return;

    this.status = status;
    this.tooltip = tooltip;

    // 移除所有状态类
    this.element.classList.remove('loading', 'found', 'not-found', 'error');

    // 添加新状态类
    this.element.classList.add(status);

    // 更新 tooltip
    if (tooltip) {
      this.element.title = tooltip;
    }
  }

  /**
   * 设置点击事件
   */
  setClickHandler(handler: (e: MouseEvent) => void): void {
    if (!this.element) return;

    this.onClick = handler;
    this.element.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.onClick) {
        this.onClick(e);
      }
    };
  }

  /**
   * 销毁 DOT
   */
  destroy(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }

  /**
   * 获取 DOT 元素
   */
  getElement(): HTMLElement | null {
    return this.element;
  }

  /**
   * 检查 DOT 是否存在
   */
  exists(): boolean {
    return this.element !== null && document.contains(this.element);
  }
}

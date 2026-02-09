import { Utils } from '../utils';

/**
 * DOT 样式管理
 * 统一管理所有 DOT 相关的 CSS 样式
 */
export class DotStyles {
  /**
   * 初始化并注入样式
   */
  static init(): void {
    Utils.addStyle(`
      /* DOT 基础样式 */
      .us-dot {
        position: absolute;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        cursor: pointer;
        z-index: 100;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }

      /* DOT 状态颜色 */
      .us-dot.loading {
        background: linear-gradient(45deg, #ddd 25%, #bbb 25%, #bbb 50%, #ddd 50%, #ddd 75%, #bbb 75%, #bbb);
        background-size: 20px 20px;
        animation: us-dot-loading 1s linear infinite;
      }

      .us-dot.found {
        background: #52B54B;
      }

      .us-dot.not-found {
        background: #999;
      }

      .us-dot.error {
        background: #e74c3c;
      }

      /* DOT 加载动画 */
      @keyframes us-dot-loading {
        0% { background-position: 0 0; }
        100% { background-position: 20px 20px; }
      }

      /* DOT 悬停效果 */
      .us-dot:hover {
        transform: scale(1.3);
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      }

      /* DOT 在海报上的定位 */
      .us-dot.on-poster {
        top: 8px;
        right: 8px;
      }

      /* DOT 在标题旁的定位 */
      .us-dot.inline {
        position: relative;
        display: inline-block;
        vertical-align: middle;
        margin-left: 6px;
        width: 1em;
        height: 1em;
        top: -0.05em;
      }

      /* 弹窗覆盖层 */
      .us-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.6);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        animation: fadeIn 0.2s ease;
      }

      /* 弹窗容器 */
      .us-modal {
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 800px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
      }

      /* 弹窗动画 */
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* 弹窗标题 */
      .us-modal-title {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 16px;
        color: #333;
        border-bottom: 2px solid #01b4e4;
        padding-bottom: 8px;
      }

      /* 弹窗关闭按钮 */
      .us-modal-close {
        float: right;
        font-size: 24px;
        color: #999;
        cursor: pointer;
        line-height: 1;
        transition: color 0.2s;
      }

      .us-modal-close:hover {
        color: #333;
      }

      /* 弹窗内容区域 */
      .us-modal-content {
        margin-top: 16px;
      }

      /* 日志列表 */
      .us-log-list {
        margin-bottom: 20px;
      }

      .us-log-item {
        padding: 10px;
        margin-bottom: 8px;
        background: #f8f9fa;
        border-radius: 6px;
        border-left: 3px solid #01b4e4;
      }

      .us-log-time {
        font-size: 11px;
        color: #888;
        margin-right: 8px;
      }

      .us-log-step {
        font-weight: bold;
        color: #333;
        margin-right: 8px;
      }

      .us-log-data {
        color: #555;
        font-size: 13px;
      }

      .us-log-data pre {
        margin: 8px 0 0 0;
        padding: 8px;
        background: #fff;
        border-radius: 4px;
        overflow-x: auto;
        font-size: 12px;
      }

      /* Emby 信息卡片 */
      .us-emby-card {
        background: #f0f8ff;
        border: 1px solid #01b4e4;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
      }

      .us-emby-title {
        font-size: 16px;
        font-weight: bold;
        color: #333;
        margin-bottom: 12px;
      }

      .us-emby-field {
        margin-bottom: 8px;
        font-size: 13px;
      }

      .us-emby-label {
        font-weight: bold;
        color: #555;
        display: inline-block;
        min-width: 80px;
      }

      .us-emby-value {
        color: #333;
      }

      .us-emby-link {
        display: inline-block;
        margin-top: 12px;
        padding: 8px 16px;
        background: #01b4e4;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        font-weight: bold;
        transition: background 0.2s;
      }

      .us-emby-link:hover {
        background: #0195c4;
      }

      /* 快速搜索链接 */
      .us-search-links {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px dashed #ddd;
      }

      .us-search-title {
        font-weight: bold;
        color: #333;
        margin-bottom: 8px;
      }

      .us-search-link {
        display: inline-block;
        margin: 4px 8px 4px 0;
        padding: 6px 12px;
        background: #f8f9fa;
        color: #01b4e4;
        text-decoration: none;
        border-radius: 4px;
        font-size: 13px;
        border: 1px solid #ddd;
        transition: all 0.2s;
      }

      .us-search-link:hover {
        background: #01b4e4;
        color: white;
        border-color: #01b4e4;
      }

      /* 切换按钮 */
      .us-toggle-btn {
        display: inline-block;
        margin-top: 8px;
        padding: 4px 10px;
        background: #eee;
        color: #333;
        border: none;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .us-toggle-btn:hover {
        background: #ddd;
      }

      /* 文本弹窗样式 */
      .us-text-modal {
        white-space: pre-wrap;
        font-family: monospace;
        font-size: 13px;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 6px;
        max-height: 60vh;
        overflow-y: auto;
      }
    `);
  }
}

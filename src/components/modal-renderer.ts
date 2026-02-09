import { embyService } from '../services/emby';
import { EmbyItem } from '../services/emby';

export interface LogEntry {
  time: string;
  step: string;
  data: any;
}

export class ModalRenderer {
  static showDetailModal(title: string, logs: LogEntry[] = [], embyItem: EmbyItem | null = null, searchQueries: string[] = []): void {
    const overlay = document.createElement('div');
    overlay.className = 'us-modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    const modal = document.createElement('div');
    modal.className = 'us-modal';
    modal.onclick = (e) => e.stopPropagation();

    const titleHtml = `<div class="us-modal-title"><span class="us-modal-close" onclick="this.closest('.us-modal-overlay').remove()">×</span>${this.escapeHtml(title)}</div>`;
    const embyHtml = embyItem ? this.renderEmbyCard(embyItem) : '';
    const logsHtml = this.renderLogs(logs);
    const searchHtml = this.renderSearchLinks(searchQueries);

    modal.innerHTML = titleHtml + `<div class="us-modal-content">${embyHtml}${logsHtml}${searchHtml}</div>`;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  static showTextModal(title: string, content: string): void {
    const overlay = document.createElement('div');
    overlay.className = 'us-modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    const modal = document.createElement('div');
    modal.className = 'us-modal';
    modal.onclick = (e) => e.stopPropagation();
    modal.innerHTML = `<div class="us-modal-title"><span class="us-modal-close" onclick="this.closest('.us-modal-overlay').remove()">×</span>${this.escapeHtml(title)}</div><div class="us-text-modal">${this.escapeHtml(content)}</div>`;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  static renderEmbyCard(item: EmbyItem): string {
    if (!item) return '';
    const webUrl = embyService.getWebUrl(item);
    let html = `<div class="us-emby-card"><div class="us-emby-title">��� 在 Emby 中找到</div><div class="us-emby-field"><span class="us-emby-label">名称:</span><span class="us-emby-value">${this.escapeHtml(item.Name)}</span></div>`;
    
    if (item.CommunityRating) html += `<div class="us-emby-field"><span class="us-emby-label">评分:</span><span class="us-emby-value">${item.CommunityRating}/10</span></div>`;
    if (item.Type) html += `<div class="us-emby-field"><span class="us-emby-label">类型:</span><span class="us-emby-value">${item.Type}</span></div>`;
    
    if (item.MediaSources && item.MediaSources.length > 0) {
      const source = item.MediaSources[0];
      if (source.Bitrate) {
        const bitrateMbps = (source.Bitrate / 1000000).toFixed(2);
        html += `<div class="us-emby-field"><span class="us-emby-label">码率:</span><span class="us-emby-value">${bitrateMbps} Mbps</span></div>`;
      }
      if (source.MediaStreams) {
        const audioStreams = source.MediaStreams.filter(s => s.Type === 'Audio');
        const subtitleStreams = source.MediaStreams.filter(s => s.Type === 'Subtitle');
        if (audioStreams.length > 0) {
          const audioLangs = audioStreams.map(s => s.Language || s.DisplayTitle || '未知').join(', ');
          html += `<div class="us-emby-field"><span class="us-emby-label">音轨:</span><span class="us-emby-value">${audioLangs}</span></div>`;
        }
        if (subtitleStreams.length > 0) {
          const subLangs = subtitleStreams.map(s => s.Language || s.DisplayTitle || '未知').join(', ');
          html += `<div class="us-emby-field"><span class="us-emby-label">字幕:</span><span class="us-emby-value">${subLangs}</span></div>`;
        }
      }
    }
    
    if (webUrl) html += `<a href="${webUrl}" target="_blank" class="us-emby-link">在 Emby 中打开 →</a>`;
    html += '</div>';
    return html;
  }

  static renderLogs(logs: LogEntry[]): string {
    if (!logs || logs.length === 0) return '';
    let html = '<div class="us-log-list">';
    logs.forEach(log => {
      html += `<div class="us-log-item"><span class="us-log-time">${log.time}</span><span class="us-log-step">${this.escapeHtml(log.step)}</span><div class="us-log-data">${this.renderLogData(log.data)}</div></div>`;
    });
    html += '</div>';
    return html;
  }

  static renderLogData(data: any): string {
    if (typeof data === 'string') return this.escapeHtml(data);
    if (typeof data === 'object' && data !== null) {
      const jsonStr = JSON.stringify(data, null, 2);
      if (jsonStr.length > 500) {
        const preview = jsonStr.substring(0, 500);
        return `<div><pre class="us-log-preview">${this.escapeHtml(preview)}...</pre><button class="us-toggle-btn" onclick="const pre = this.previousElementSibling; const full = this.nextElementSibling; if (full.style.display === 'none') { pre.style.display = 'none'; full.style.display = 'block'; this.textContent = '收起完整响应 ▲'; } else { pre.style.display = 'block'; full.style.display = 'none'; this.textContent = '展开完整响应 ▼'; }">展开完整响应 ▼</button><pre class="us-log-full" style="display: none;">${this.escapeHtml(jsonStr)}</pre></div>`;
      }
      return `<pre>${this.escapeHtml(jsonStr)}</pre>`;
    }
    return String(data);
  }

  static renderSearchLinks(queries: string[]): string {
    if (!queries || queries.length === 0) return '';
    const searchSites = [
      { name: 'GYG', url: (q: string) => `https://www.gyg.si/search?searchstr=${encodeURIComponent(q)}` },
      { name: 'BT4G', url: (q: string) => `https://bt4gprx.com/search?orderby=size&p=1&q=${encodeURIComponent(q)}` },
      { name: 'DMHY', url: (q: string) => `https://dmhy.org/topics/list?keyword=${encodeURIComponent(q)}` },
      { name: 'DMHY(全集)', url: (q: string) => `https://dmhy.org/topics/list?keyword=${encodeURIComponent(q + ' 合集')}` }
    ];
    let html = '<div class="us-search-links"><div class="us-search-title">��� 快速搜索</div>';
    queries.forEach(query => {
      if (!query) return;
      searchSites.forEach(site => {
        html += `<a href="${site.url(query)}" target="_blank" class="us-search-link">${site.name}: ${this.escapeHtml(this.truncate(query, 20))}</a>`;
      });
    });
    html += '</div>';
    return html;
  }

  static escapeHtml(str: string | any): string {
    if (typeof str !== 'string') return String(str);
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  static truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  }
}

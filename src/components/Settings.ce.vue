<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { CONFIG, configService } from '@/services/config';
import { cache } from '@/services/cache';

const props = defineProps<{
  visible: boolean;
  mode: 'settings' | 'cache';
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

// Settings form values
const tmdbApiKey = ref('');
const embyServer = ref('');
const embyApiKey = ref('');
const bangumiToken = ref('');
const nullbrEnable115 = ref(true);
const nullbrEnableMagnet = ref(false);
const saved = ref(false);

// Cache info
const cacheKeys = ref<string[]>([]);
const selectedCategory = ref<string | null>(null);

const cacheStats = computed(() => {
  const keys = cacheKeys.value;
  return {
    emby: keys.filter(k => k.startsWith('emby_')).length,
    tmdb: keys.filter(k => k.startsWith('tmdb_')).length,
    bangumi: keys.filter(k => k.startsWith('bangumi_')).length,
    nullbr: keys.filter(k => k.startsWith('nullbr_')).length,
    total: keys.length
  };
});

const selectedCategoryKeys = computed(() => {
  if (!selectedCategory.value) return [];
  return cacheKeys.value.filter(k => k.startsWith(`${selectedCategory.value}_`));
});

onMounted(() => {
  tmdbApiKey.value = (CONFIG.tmdb.apiKey as string) || '';
  embyServer.value = (CONFIG.emby.server as string) || '';
  embyApiKey.value = (CONFIG.emby.apiKey as string) || '';
  bangumiToken.value = (CONFIG.bangumi.apiKey as string) || '';
  nullbrEnable115.value = CONFIG.nullbr.enable115 !== false;
  nullbrEnableMagnet.value = CONFIG.nullbr.enableMagnet === true;
  refreshCacheKeys();
});

function refreshCacheKeys() {
  cacheKeys.value = cache.listKeys();
}

function saveSettings() {
  configService.update('tmdb', { apiKey: tmdbApiKey.value });
  configService.update('emby', { server: embyServer.value, apiKey: embyApiKey.value });
  configService.update('bangumi', { apiKey: bangumiToken.value });
  configService.update('nullbr', { enable115: nullbrEnable115.value, enableMagnet: nullbrEnableMagnet.value });

  saved.value = true;
  setTimeout(() => { saved.value = false; }, 2000);
}

function clearCache(filter?: string) {
  if (filter) {
    cache.clear([filter]);
  } else {
    cache.clear();
  }
  refreshCacheKeys();
}

function selectCategory(category: string) {
  selectedCategory.value = category;
}

function backToCacheList() {
  selectedCategory.value = null;
}

function onOverlayClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('us-settings-overlay')) {
    emit('close');
  }
}

function getCategoryName(key: string): string {
  const map: Record<string, string> = {
    emby: 'Emby',
    tmdb: 'TMDB',
    bangumi: 'Bangumi',
    nullbr: 'Nullbr'
  };
  return map[key] || key;
}
</script>

<template>
  <div v-if="visible" class="us-settings-overlay" @click="onOverlayClick">
    <div class="us-settings-modal">
      <!-- Settings Mode -->
      <template v-if="mode === 'settings'">
        <h3 class="us-settings-title">脚本设置 / Settings</h3>

        <div class="us-settings-row">
          <label class="us-settings-label">TMDB API Key</label>
          <input v-model="tmdbApiKey" class="us-settings-input" type="text" placeholder="Enter TMDB API Key">
        </div>

        <div class="us-settings-row">
          <label class="us-settings-label">Emby Server URL</label>
          <input v-model="embyServer" class="us-settings-input" type="text" placeholder="http://your-emby-server:8096">
        </div>

        <div class="us-settings-row">
          <label class="us-settings-label">Emby API Key</label>
          <input v-model="embyApiKey" class="us-settings-input" type="text" placeholder="Enter Emby API Key">
        </div>

        <div class="us-settings-row">
          <label class="us-settings-label">Bangumi Token</label>
          <input v-model="bangumiToken" class="us-settings-input" type="text" placeholder="Enter Bangumi Token">
        </div>

        <div class="us-settings-row">
          <label class="us-settings-label">Nullbr 资源搜索 / Resource Search</label>
          <div class="us-checkbox-group">
            <label class="us-checkbox-label">
              <input v-model="nullbrEnable115" type="checkbox" class="us-checkbox">
              <span>115 网盘资源搜索</span>
            </label>
            <label class="us-checkbox-label">
              <input v-model="nullbrEnableMagnet" type="checkbox" class="us-checkbox">
              <span>磁链资源搜索</span>
            </label>
          </div>
        </div>

        <div class="us-settings-actions">
          <button class="us-button us-button-secondary" @click="emit('close')">取消 / Cancel</button>
          <button class="us-button us-button-primary" @click="saveSettings">
            {{ saved ? '✓ 已保存' : '保存 / Save' }}
          </button>
        </div>
      </template>

      <!-- Cache Mode -->
      <template v-else>
        <!-- Cache Summary List -->
        <template v-if="!selectedCategory">
          <h3 class="us-settings-title">缓存管理 / Cache</h3>

          <div class="us-cache-info">
            <span>总缓存数量: {{ cacheStats.total }}</span>
          </div>

          <div class="us-cache-list">
            <div class="us-cache-item us-clickable" @click="selectCategory('emby')">
              <div class="us-cache-label">
                <span class="us-cache-name">Emby</span>
                <span class="us-cache-count">{{ cacheStats.emby }} items</span>
              </div>
              <button class="us-button us-button-sm us-button-danger" @click.stop="clearCache('emby')">清除</button>
            </div>

            <div class="us-cache-item us-clickable" @click="selectCategory('tmdb')">
              <div class="us-cache-label">
                <span class="us-cache-name">TMDB</span>
                <span class="us-cache-count">{{ cacheStats.tmdb }} items</span>
              </div>
              <button class="us-button us-button-sm us-button-danger" @click.stop="clearCache('tmdb')">清除</button>
            </div>

            <div class="us-cache-item us-clickable" @click="selectCategory('bangumi')">
              <div class="us-cache-label">
                <span class="us-cache-name">Bangumi</span>
                <span class="us-cache-count">{{ cacheStats.bangumi }} items</span>
              </div>
              <button class="us-button us-button-sm us-button-danger" @click.stop="clearCache('bangumi')">清除</button>
            </div>

            <div class="us-cache-item us-clickable" @click="selectCategory('nullbr')">
              <div class="us-cache-label">
                <span class="us-cache-name">Nullbr</span>
                <span class="us-cache-count">{{ cacheStats.nullbr }} items</span>
              </div>
              <button class="us-button us-button-sm us-button-danger" @click.stop="clearCache('nullbr')">清除</button>
            </div>
          </div>

          <div class="us-settings-actions us-settings-actions-column">
            <button class="us-button us-button-danger us-button-block" @click="clearCache()">清除全部 / Clear All</button>
            <button class="us-button us-button-secondary us-button-block" @click="emit('close')">关闭 / Close</button>
          </div>
        </template>

        <!-- Cache Detail View -->
        <template v-else>
          <div class="us-detail-header">
            <button class="us-button-icon" @click="backToCacheList">←</button>
            <h3 class="us-settings-title" style="margin: 0;">{{ getCategoryName(selectedCategory) }} Cache</h3>
          </div>

          <div class="us-cache-detail-list">
            <div v-if="selectedCategoryKeys.length === 0" class="us-cache-empty">
              无缓存数据 / No cache items
            </div>
            <div v-for="key in selectedCategoryKeys" :key="key" class="us-cache-detail-row">
              {{ key }}
            </div>
          </div>

          <div class="us-settings-actions">
            <button class="us-button us-button-danger" @click="clearCache(selectedCategory!)">清除此类全部</button>
            <button class="us-button us-button-secondary" @click="backToCacheList">返回 / Back</button>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<style>
:host {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  pointer-events: none;
}

:host([visible]) {
  pointer-events: auto;
}

* {
  box-sizing: border-box;
}

.us-settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: auto;
}

.us-settings-modal {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.us-settings-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  color: #333;
}

.us-settings-row {
  margin-bottom: 15px;
}

.us-settings-label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
  font-size: 13px;
}

.us-settings-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 13px;
  font-family: inherit;
}

.us-settings-input:focus {
  outline: none;
  border-color: #01b4e4;
  box-shadow: 0 0 0 2px rgba(1, 180, 228, 0.2);
}

.us-settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.us-settings-actions-column {
  flex-direction: column;
}

.us-button {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  border: none;
  font-weight: bold;
  font-size: 13px;
  transition: opacity 0.2s;
}

.us-button:hover {
  opacity: 0.85;
}

.us-button-primary {
  background: #01b4e4;
  color: white;
}

.us-button-secondary {
  background: #eee;
  color: #333;
}

.us-button-danger {
  background: #dc3545;
  color: white;
}

.us-button-sm {
  padding: 4px 12px;
  font-size: 12px;
}

.us-button-block {
  width: 100%;
  padding: 10px;
}

.us-button-icon {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 0 10px 0 0;
  color: #666;
}

.us-button-icon:hover {
  color: #333;
}

.us-cache-info {
  font-size: 14px;
  color: #666;
  margin-bottom: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
  text-align: center;
  font-weight: bold;
}

.us-cache-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
  overflow-y: auto;
}

.us-cache-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid #eee;
  border-radius: 6px;
  background: #fff;
  transition: background-color 0.2s;
}

.us-cache-item.us-clickable {
  cursor: pointer;
}

.us-cache-item.us-clickable:hover {
  background: #f8f9fa;
  border-color: #ddd;
}

.us-cache-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.us-cache-name {
  font-weight: bold;
  font-size: 14px;
  color: #333;
}

.us-cache-count {
  font-size: 12px;
  color: #999;
}

.us-detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.us-cache-detail-list {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
  background: #fafafa;
  padding: 4px;
  min-height: 200px;
}

.us-cache-detail-row {
  padding: 6px 8px;
  font-size: 12px;
  font-family: monospace;
  border-bottom: 1px solid #f0f0f0;
  word-break: break-all;
  color: #555;
}

.us-cache-detail-row:last-child {
  border-bottom: none;
}

.us-cache-empty {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.us-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.us-checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  user-select: none;
}

.us-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #01b4e4;
}
</style>

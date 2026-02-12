<script setup lang="ts">
import { ref, computed } from 'vue';
import type { TmdbSearchItem } from '@/services/media-service';

const props = defineProps<{
  results: TmdbSearchItem[];
  title?: string;
}>();

const selectedIndex = ref(0);

const current = computed(() => {
  if (!props.results?.length) return null;
  return props.results[selectedIndex.value] || props.results[0];
});

const posterUrl = computed(() => {
  if (!current.value?.posterPath) return '';
  return `https://image.tmdb.org/t/p/w300${current.value.posterPath}`;
});
</script>

<template>
  <div class="us-tmdb-section">
    <div class="us-tmdb-header">
      <span>🎬 影片信息</span>
      <span class="us-tmdb-not-found-badge">Not in Emby</span>
    </div>

    <!-- TMDB results available -->
    <template v-if="current">
      <div v-if="results.length > 1" class="us-tmdb-switcher">
        <select class="us-tmdb-select" :value="selectedIndex"
          @change="selectedIndex = Number(($event.target as HTMLSelectElement).value)">
          <option v-for="(item, idx) in results" :key="item.id" :value="idx">
            {{ item.title }} ({{ item.year }})
          </option>
        </select>
      </div>

      <div class="us-tmdb-detail">
        <div class="us-tmdb-poster">
          <img v-if="posterUrl" :src="posterUrl" @error="($event.target as HTMLImageElement).style.display = 'none'">
          <div v-else class="us-tmdb-no-poster">No Poster</div>
        </div>
        <div class="us-tmdb-info">
          <div class="us-tmdb-title">{{ current.title }}</div>
          <div class="us-tmdb-meta">
            <span class="us-tmdb-year-badge">{{ current.year }}</span>
            <span class="us-tmdb-type-badge">{{ current.mediaType === 'tv' ? 'TV' : 'Movie' }}</span>
            <span class="us-tmdb-id-badge">TMDB: {{ current.id }}</span>
          </div>
          <div class="us-tmdb-overview">{{ current.overview || '暂无简介' }}</div>
          <div class="us-tmdb-links">
            <a :href="`https://www.themoviedb.org/${current.mediaType}/${current.id}`" target="_blank"
              class="us-btn us-btn-tmdb">
              Open on TMDB ↗
            </a>
          </div>
        </div>
      </div>

      <div v-if="results.length > 1" class="us-tmdb-pagination">
        {{ selectedIndex + 1 }} / {{ results.length }} 个匹配结果
      </div>
    </template>

    <!-- No TMDB results -->
    <div v-else class="us-tmdb-empty">
      <div class="us-tmdb-empty-title">{{ title || 'Unknown' }}</div>
      <div class="us-tmdb-empty-text">TMDB 未找到匹配影片</div>
    </div>
  </div>
</template>

<style>
.us-tmdb-section {
  padding: 20px;
  border-bottom: 1px solid #eee;
  background: linear-gradient(135deg, #01b4e40a 0%, #00d2ff0a 100%);
}

.us-tmdb-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
  font-weight: bold;
  color: #333;
}

.us-tmdb-not-found-badge {
  background: #fff3e0;
  color: #e65100;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.us-tmdb-switcher {
  margin-bottom: 12px;
}

.us-tmdb-select {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 12px;
  color: #333;
  background: white;
  cursor: pointer;
}

.us-tmdb-detail {
  display: flex;
  gap: 15px;
}

.us-tmdb-poster {
  flex-shrink: 0;
  width: 110px;
}

.us-tmdb-poster img {
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
}

.us-tmdb-no-poster {
  width: 100%;
  height: 160px;
  background: #f0f0f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 12px;
}

.us-tmdb-info {
  flex: 1;
  min-width: 0;
}

.us-tmdb-title {
  font-size: 17px;
  font-weight: bold;
  color: #333;
  margin-bottom: 6px;
}

.us-tmdb-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.us-tmdb-year-badge {
  background: #e3f2fd;
  color: #1565c0;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.us-tmdb-type-badge {
  background: #fce4ec;
  color: #c62828;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.us-tmdb-id-badge {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-family: monospace;
}

.us-tmdb-overview {
  font-size: 13px;
  color: #555;
  line-height: 1.5;
  max-height: 100px;
  overflow-y: auto;
  margin-bottom: 10px;
}

.us-tmdb-links {
  margin-top: 8px;
}

.us-tmdb-pagination {
  text-align: center;
  font-size: 11px;
  color: #999;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px dashed #eee;
}

.us-tmdb-empty {
  text-align: center;
  padding: 20px 0;
}

.us-tmdb-empty-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.us-tmdb-empty-text {
  font-size: 13px;
  color: #999;
}

.us-btn {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background 0.2s;
}

.us-btn-tmdb {
  background: linear-gradient(135deg, #01b4e4 0%, #00d2ff 100%);
  color: white;
  padding: 6px 14px;
  font-size: 12px;
}

.us-btn-tmdb:hover {
  opacity: 0.9;
}
</style>

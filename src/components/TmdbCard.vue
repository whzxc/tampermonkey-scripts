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
  <div class="p-5 border-b border-[#eee] bg-[linear-gradient(135deg,#01b4e40a_0%,#00d2ff0a_100%)]">
    <div class="flex items-center justify-between mb-[15px] font-bold text-[#333]">
      <span>🎬 影片信息</span>
      <span class="bg-[#fff3e0] text-[#e65100] px-[10px] py-[2px] rounded-[10px] text-[11px] font-[600]">Not in Emby</span>
    </div>

    <!-- TMDB results available -->
    <template v-if="current">
      <div v-if="results.length > 1" class="mb-3">
        <select class="w-full px-[8px] py-[4px] border border-[#ccc] rounded-[6px] text-xs text-[#333] bg-white cursor-pointer" :value="selectedIndex"
          @change="selectedIndex = Number(($event.target as HTMLSelectElement).value)">
          <option v-for="(item, idx) in results" :key="item.id" :value="idx">
            {{ item.title }} ({{ item.year }})
          </option>
        </select>
      </div>

      <div class="flex gap-[15px]">
        <div class="shrink-0 w-[110px]">
          <img v-if="posterUrl" :src="posterUrl" class="w-full rounded-[8px] shadow-[0_3px_10px_rgba(0,0,0,0.15)]" @error="($event.target as HTMLImageElement).style.display = 'none'">
          <div v-else class="w-full h-[160px] bg-[#f0f0f0] rounded-[8px] flex items-center justify-center text-[#999] text-xs">No Poster</div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-[17px] font-bold text-[#333] mb-[6px]">{{ current.title }}</div>
          <div class="flex gap-[6px] flex-wrap mb-[10px]">
            <span class="bg-[#e3f2fd] text-[#1565c0] px-[8px] py-[2px] rounded-[4px] text-[11px]">{{ current.year }}</span>
            <span class="bg-[#fce4ec] text-[#c62828] px-[8px] py-[2px] rounded-[4px] text-[11px]">{{ current.mediaType === 'tv' ? 'TV' : 'Movie' }}</span>
            <span class="bg-[#e8f5e9] text-[#2e7d32] px-[8px] py-[2px] rounded-[4px] text-[11px] font-mono">TMDB: {{ current.id }}</span>
          </div>
          <div class="text-[13px] text-[#555] leading-[1.5] max-h-[100px] overflow-y-auto mb-[10px]">{{ current.overview || '暂无简介' }}</div>
          <div class="mt-2">
            <a :href="`https://www.themoviedb.org/${current.mediaType}/${current.id}`" target="_blank"
              class="inline-block px-[14px] py-[6px] rounded-[6px] no-underline text-xs font-medium cursor-pointer border-none transition-colors bg-[linear-gradient(135deg,#01b4e4_0%,#00d2ff_100%)] text-white hover:opacity-90">
              Open on TMDB ↗
            </a>
          </div>
        </div>
      </div>

      <div v-if="results.length > 1" class="text-center text-[11px] text-[#999] mt-[12px] pt-[8px] border-t border-dashed border-[#eee]">
        {{ selectedIndex + 1 }} / {{ results.length }} 个匹配结果
      </div>
    </template>

    <!-- No TMDB results -->
    <div v-else class="text-center py-5">
      <div class="text-lg font-bold text-[#333] mb-2">{{ title || 'Unknown' }}</div>
      <div class="text-[13px] text-[#999]">TMDB 未找到匹配影片</div>
    </div>
  </div>
</template>



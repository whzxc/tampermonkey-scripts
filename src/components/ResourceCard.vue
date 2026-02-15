<script lang="ts" setup>
import { computed, ref } from 'vue';
import { type Nullbr115Item, type NullbrMagnetItem, nullbrService } from '@/services/api/nullbr';
import type { TmdbInfo } from '@/types/ui';

const props = defineProps<{
  tmdbInfo?: TmdbInfo | null;
  searchQueries?: string[];
}>();

// Nullbr resource state
const nullbrLoading = ref(true);
const nullbrItems115 = ref<Nullbr115Item[]>([]);
const nullbrMagnets = ref<NullbrMagnetItem[]>([]);
const nullbrError = ref(false);

const uniqueQueries = computed(() => {
  if (!props.searchQueries) return [];
  return [...new Set(props.searchQueries.filter(q => q?.trim()))];
});

async function copyMagnet(magnet: string, event: Event) {
  const btn = event.target as HTMLButtonElement;
  try {
    await navigator.clipboard.writeText(magnet);
    btn.textContent = '已复制';
    setTimeout(() => {
      btn.textContent = '复制';
    }, 1500);
  } catch {
    GM.setClipboard(magnet);
    btn.textContent = '已复制';
    setTimeout(() => {
      btn.textContent = '复制';
    }, 1500);
  }
}

// Load Nullbr resources
async function loadNullbrResources() {
  if (!props.tmdbInfo) {
    nullbrLoading.value = false;
    return;
  }

  try {
    const resources = await nullbrService.getAllResources(props.tmdbInfo.id, props.tmdbInfo.mediaType);
    nullbrItems115.value = resources.items115;
    nullbrMagnets.value = resources.magnets;
  } catch {
    nullbrError.value = true;
  } finally {
    nullbrLoading.value = false;
  }
}

loadNullbrResources();
</script>

<template>
  <!-- Nullbr Resources -->
  <div v-if="tmdbInfo" class="p-[15px_20px] border-b border-[#eee] bg-[linear-gradient(135deg,#667eea0a_0%,#764ba20a_100%)]">
    <div class="flex items-center gap-2 mb-3 font-bold text-[#333]">
      <span>🔗 网盘 &amp; 磁力资源</span>
      <span class="bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white px-[8px] py-[2px] rounded-[10px] text-[11px]">Nullbr</span>
    </div>

    <div v-if="nullbrLoading" class="text-center text-[#999] p-5">正在搜索资源...</div>

    <div v-else-if="nullbrError" class="text-center text-[#999] p-[15px] text-[13px]">加载资源失败</div>

    <div v-else-if="!nullbrItems115.length && !nullbrMagnets.length" class="text-center text-[#999] p-[15px] text-[13px]">
      暂无可用资源
    </div>

    <div v-else>
      <!-- 115 Resources -->
      <div v-if="nullbrItems115.length" style="margin-bottom: 12px;">
        <div class="text-xs font-bold text-[#666] mb-2">📁 115 网盘分享 ({{ nullbrItems115.length }})</div>
        <div class="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
          <div v-for="item in nullbrItems115" :key="item.share_link" class="flex items-center justify-between p-[8px_12px] bg-white rounded-[6px] border border-[#e0e0e0] text-xs transition-all duration-200 hover:border-[#667eea] hover:shadow-[0_2px_6px_rgba(102,126,234,0.15)]">
            <div class="flex-1 min-w-0">
              <div :title="item.title" class="font-medium text-[#333] whitespace-nowrap overflow-hidden text-ellipsis max-w-[280px]">{{ item.title }}</div>
              <div class="flex gap-2 mt-[3px] text-[#888] text-[11px]">
                <span>{{ item.size }}</span>
                <span v-if="item.resolution" class="bg-[#f0f0f0] px-[5px] py-[1px] rounded-[3px]">{{ item.resolution }}</span>
                <span v-if="item.quality" class="bg-[#f0f0f0] px-[5px] py-[1px] rounded-[3px]">{{ item.quality }}</span>
                <span v-if="item.season_list" class="bg-[#f0f0f0] px-[5px] py-[1px] rounded-[3px]">{{ item.season_list.join(', ') }}</span>
              </div>
            </div>
            <div class="flex gap-[6px]">
              <a :href="item.share_link" class="px-[10px] py-[4px] rounded-[4px] border-none cursor-pointer text-[11px] transition-all duration-200 no-underline inline-block bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white hover:opacity-90" target="_blank">打开链接</a>
            </div>
          </div>
        </div>
      </div>

      <!-- Magnet Resources -->
      <div v-if="nullbrMagnets.length">
        <div class="text-xs font-bold text-[#666] mb-2">🧲 磁力链接 ({{ nullbrMagnets.length }})</div>
        <div class="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
          <div v-for="item in nullbrMagnets" :key="item.magnet" class="flex items-center justify-between p-[8px_12px] bg-white rounded-[6px] border border-[#e0e0e0] text-xs transition-all duration-200 hover:border-[#667eea] hover:shadow-[0_2px_6px_rgba(102,126,234,0.15)]">
            <div class="flex-1 min-w-0">
              <div :title="item.name" class="font-medium text-[#333] whitespace-nowrap overflow-hidden text-ellipsis max-w-[280px]">{{ item.name }}</div>
              <div class="flex gap-2 mt-[3px] text-[#888] text-[11px]">
                <span>{{ item.size }}</span>
                <span v-if="item.resolution" class="bg-[#f0f0f0] px-[5px] py-[1px] rounded-[3px]">{{ item.resolution }}</span>
                <span v-if="item.source" class="bg-[#f0f0f0] px-[5px] py-[1px] rounded-[3px]">{{ item.source }}</span>
                <span v-if="item.zh_sub" class="bg-[#e8f5e9] text-[#388e3c] px-[5px] py-[1px] rounded-[3px]">中字</span>
              </div>
            </div>
            <div class="flex gap-[6px]">
              <a :href="item.magnet" class="px-[10px] py-[4px] rounded-[4px] border-none cursor-pointer text-[11px] transition-all duration-200 no-underline inline-block bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white hover:opacity-90" style="text-decoration:none;">打开</a>
              <button class="px-[10px] py-[4px] rounded-[4px] border-none cursor-pointer text-[11px] transition-all duration-200 no-underline inline-block bg-[#f5f5f5] text-[#666] hover:bg-[#e0e0e0]" @click="copyMagnet(item.magnet, $event)">复制</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Search Actions -->
  <div v-if="uniqueQueries.length" class="p-5 border-b border-[#eee] text-center">
    <a v-if="!tmdbInfo" :href="`https://www.themoviedb.org/search?query=${encodeURIComponent(uniqueQueries[0])}`" class="block text-base font-bold mb-[15px] text-[#9e9e9e]">
      Not Found in TMDB
    </a>
    <div class="flex gap-[10px] flex-wrap justify-center">
      <a :href="`https://www.gyg.si/s/1---1/${encodeURIComponent(uniqueQueries[0])}`" class="inline-block px-[8px] py-[4px] rounded-[6px] no-underline text-sm font-medium cursor-pointer border-none transition-colors bg-[#eef9fd] text-[#01b4e4] border border-[#b3e5fc] hover:bg-[#e1f5fe] hover:text-[#008dba]" target="_blank">GYG</a>
      <a :href="`https://bt4gprx.com/search?orderby=size&p=1&q=${encodeURIComponent(uniqueQueries[0])}`" class="inline-block px-[8px] py-[4px] rounded-[6px] no-underline text-sm font-medium cursor-pointer border-none transition-colors bg-[#eef9fd] text-[#01b4e4] border border-[#b3e5fc] hover:bg-[#e1f5fe] hover:text-[#008dba]" target="_blank">BT4G</a>
      <a :href="`https://dmhy.org/topics/list?keyword=${encodeURIComponent(uniqueQueries[0])}&sort_id=2&team_id=0&order=date-desc`" class="inline-block px-[8px] py-[4px] rounded-[6px] no-underline text-sm font-medium cursor-pointer border-none transition-colors bg-[#eef9fd] text-[#01b4e4] border border-[#b3e5fc] hover:bg-[#e1f5fe] hover:text-[#008dba]" target="_blank">DMHY</a>
      <a :href="`https://dmhy.org/topics/list?keyword=${encodeURIComponent(uniqueQueries[0])}&sort_id=31&team_id=0&order=date-desc`" class="inline-block px-[8px] py-[4px] rounded-[6px] no-underline text-sm font-medium cursor-pointer border-none transition-colors bg-[#eef9fd] text-[#01b4e4] border border-[#b3e5fc] hover:bg-[#e1f5fe] hover:text-[#008dba]" target="_blank">DMHY 全集</a>
    </div>
  </div>
</template>



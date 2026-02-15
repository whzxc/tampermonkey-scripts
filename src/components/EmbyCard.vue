<script lang="ts" setup>
import { computed, ref } from 'vue';
import type { EmbyItem } from '@/types/emby';
import { CONFIG } from '@/services/config';

const props = defineProps<{
  item: EmbyItem;
  items?: EmbyItem[];
}>();

// Emby selector state (for multi-result)
const selectedIndex = ref(0);

const current = computed(() => {
  if (props.items?.length) {
    return props.items[selectedIndex.value] || props.items[0];
  }
  return props.item;
});

const year = computed(() => current.value?.ProductionYear || '');

const rating = computed(() => {
  if (!current.value) return '';
  return current.value.CommunityRating
    ? current.value.CommunityRating.toFixed(1)
    : (current.value.OfficialRating || '');
});

const path = computed(() => {
  if (!current.value) return '';
  return current.value.Path
    || (current.value.MediaSources?.[0]?.Path)
    || 'Path Unknown';
});

const imgUrl = computed(() => {
  if (!current.value) return '';
  return `${CONFIG.emby.server}/emby/Items/${current.value.Id}/Images/Primary?maxHeight=300&maxWidth=200&quality=90`;
});

const webUrl = computed(() => {
  if (!current.value) return '';
  return `${CONFIG.emby.server}/web/index.html#!/item?id=${current.value.Id}&serverId=${current.value.ServerId || ''}`;
});

const techInfo = computed(() => {
  if (!current.value?.MediaSources?.length) return [];
  const source = current.value.MediaSources[0];
  const items: string[] = [];

  const sizeBytes = source.Size || 0;
  items.push((sizeBytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB');
  if (source.Container) items.push(source.Container.toUpperCase());

  if (source.MediaStreams) {
    const video = source.MediaStreams.find(s => s.Type === 'Video');
    if (video) {
      if (video.Width && video.Height) items.push(`${video.Width}x${video.Height}`);
      if (video.Codec) items.push(video.Codec.toUpperCase());
      if (video.BitRate) items.push((video.BitRate / 1000000).toFixed(1) + ' Mbps');
      if (video.BitDepth) items.push(`${video.BitDepth}bit`);
    }
  }
  return items;
});

const audioInfo = computed(() => {
  if (!current.value?.MediaSources?.[0]?.MediaStreams) return '';
  const audios = current.value.MediaSources[0].MediaStreams.filter(s => s.Type === 'Audio');
  if (!audios.length) return '';
  return '🔊 ' + audios.map(a => {
    const lang = (a.Language || 'und').toUpperCase();
    const codec = (a.Codec || '').toUpperCase();
    const channels = a.Channels ? (a.Channels === 6 ? '5.1' : (a.Channels === 8 ? '7.1' : '2.0')) : '';
    return `${lang} ${codec} ${channels}`.trim();
  }).join(' / ');
});

const subtitleInfo = computed(() => {
  if (!current.value?.MediaSources?.[0]?.MediaStreams) return '';
  const subs = current.value.MediaSources[0].MediaStreams.filter(s => s.Type === 'Subtitle');
  if (!subs.length) return '';
  return '💬 ' + subs.map(s => {
    const lang = (s.Language || 'und').toUpperCase();
    const codec = (s.Codec || '').toUpperCase();
    const forced = s.IsForced ? '[Forced]' : '';
    return `${lang} ${codec}${forced}`.trim();
  }).join(' / ');
});
</script>

<template>
  <div class="p-5 border-b border-[#eee] bg-[#fdfdfd]">
    <!-- Emby switcher (for multi-result) -->
    <div v-if="items && items.length > 1" class="mb-3">
      <select :value="selectedIndex" class="w-full px-[10px] py-[6px] border border-[#ccc] rounded-[6px] text-[13px] text-[#333] bg-white cursor-pointer" @change="selectedIndex = Number(($event.target as HTMLSelectElement).value)">
        <option v-for="(it, idx) in items" :key="it.Id" :value="idx">
          {{ it.Name }} ({{ it.ProductionYear || '' }}) - {{ it.Type }}
        </option>
      </select>
    </div>

    <div class="flex">
      <div class="shrink-0 w-[100px] mr-5">
        <img :src="imgUrl" class="w-full rounded-[6px] shadow-[0_2px_8px_rgba(0,0,0,0.1)]" @error="($event.target as HTMLImageElement).style.display = 'none'">
      </div>
      <div class="flex-1">
        <div class="text-lg font-bold text-[#333] mb-1">
          {{ current.Name }} <span class="font-normal text-[#999] text-sm">({{ year }})</span>
        </div>
        <div class="text-[13px] text-[#666] mb-2">
          <span class="bg-[#eee] px-[6px] py-[2px] rounded-[4px] mr-[6px]">{{ current.Type }}</span>
          <span v-if="rating" class="text-[#f5c518] font-bold">★ {{ rating }}</span>
        </div>

        <!-- Series seasons -->
        <div v-if="current.Type === 'Series' && current.Seasons?.length" class="mt-[6px] flex flex-wrap gap-1">
          <span v-for="s in current.Seasons" :key="s.Id" class="bg-[#e8f5e9] text-[#2e7d32] px-[6px] py-[2px] rounded-[4px] text-[11px] border border-[#c8e6c9]">
            {{ s.Name.replace('Season', 'S').replace('Specials', 'SP') }}: {{ s.ChildCount || s.RecursiveItemCount || 0 }}集
          </span>
        </div>
        <div v-else-if="current.Type === 'Series'" class="mt-[5px] text-[#52B54B] font-bold">
          {{ current.ChildCount || 0 }} Seasons / {{ current.RecursiveItemCount || 0 }} Episodes
        </div>

        <div class="text-xs text-[#555] mt-2 leading-[1.4]">
          <strong>Path:</strong> <span class="font-mono bg-[#f1f1f1] px-[4px] py-[2px] rounded-[3px] break-all">{{ path }}</span>
        </div>
        <div v-if="techInfo.length" class="text-xs text-[#999] mt-[6px]">{{ techInfo.join(' • ') }}</div>
        <div v-if="audioInfo" class="text-[11px] text-[#777] mt-[6px] leading-[1.4]">{{ audioInfo }}</div>
        <div v-if="subtitleInfo" class="text-[11px] text-[#777] mt-[6px] leading-[1.4]">{{ subtitleInfo }}</div>

        <div class="mt-3">
          <a :href="webUrl" class="inline-block px-[8px] py-[4px] rounded-[6px] no-underline text-sm font-medium cursor-pointer border-none transition-colors bg-[#52B54B] text-white hover:bg-[#43943d]" target="_blank">▶ Play on Emby</a>
        </div>
      </div>
    </div>
  </div>
</template>



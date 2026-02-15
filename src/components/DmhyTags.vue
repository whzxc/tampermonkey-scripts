<script lang="ts" setup>
import { computed } from 'vue';
import type { ParsedDmhyTitle } from '@/adapters/dmhy-title-parser';

const props = defineProps<{
  tags: ParsedDmhyTitle;
  bangumiSubject?: {
    id: number;
    name: string;
    name_cn?: string;
    url: string;
  } | null;
}>();

// Order: Season → Episode → Group → tech tags
// Key matches ParsedDmhyTitle keys
const TAG_ORDER = [
  { key: 'season', bg: 'bg-[#fce4ec]', text: 'text-[#880e4f]' },
  { key: 'episode', bg: 'bg-[#ede7f6]', text: 'text-[#4527a0]' },
  { key: 'group', bg: 'bg-[#fff8e1]', text: 'text-[#f57f17]' },
  { key: 'resolution', bg: 'bg-[#e3f2fd]', text: 'text-[#1565c0]' },
  { key: 'codec', bg: 'bg-[#f3e5f5]', text: 'text-[#6a1b9a]' },
  { key: 'audio', bg: 'bg-[#fce4ec]', text: 'text-[#c62828]' },
  { key: 'source', bg: 'bg-[#e8f5e9]', text: 'text-[#2e7d32]' },
  { key: 'subtitle', bg: 'bg-[#e0f7fa]', text: 'text-[#00695c]' },
  { key: 'format', bg: 'bg-[#e0e0e0]', text: 'text-[#424242]' },
] as const;

const activeTags = computed(() => {
  return TAG_ORDER.filter(def => !!props.tags[def.key]).map(def => ({
    ...def,
    value: props.tags[def.key]
  }));
});

function onBangumiClick(e: Event) {
  e.stopPropagation();
}
</script>

<template>
  <div class="inline-flex items-center gap-1 ml-1 align-middle leading-[1.6]">
    <!-- Standard Tags -->
    <span
      v-for="tag in activeTags"
      :key="tag.key"
      class="inline-block px-[6px] py-[1px] rounded-[4px] text-[11px] font-medium whitespace-nowrap"
      :class="[tag.bg, tag.text]"
    >
      {{ tag.value }}
    </span>

    <!-- Bangumi Badge -->
    <a
      v-if="bangumiSubject"
      :href="bangumiSubject.url"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-block px-[6px] py-[1px] rounded-[4px] text-[11px] font-medium whitespace-nowrap bg-[#e8f5e9] text-[#2e7d32] cursor-pointer no-underline hover:opacity-80"
      :title="bangumiSubject.name_cn || bangumiSubject.name"
      @click="onBangumiClick"
    >
      BGM:{{ bangumiSubject.id }}
    </a>
  </div>
</template>

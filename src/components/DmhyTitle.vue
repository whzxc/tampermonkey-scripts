<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { parseDmhyTitle, type ParsedDmhyTitle } from '@/adapters/dmhy-title-parser';
import { configService } from '@/services/config';
import { embyService } from '@/services/api/emby';
import { bangumiService } from '@/services/api/bangumi';
import { uiController } from '@/services/ui-controller';
import type { MediaCheckResult } from '@/services/media-service';
import StatusDot, { type DotStatus } from './StatusDot.vue';

const props = defineProps<{
  originalTitle: string;
  href: string;
}>();

const parsed = computed(() => parseDmhyTitle(props.originalTitle));
const titleText = computed(() => parsed.value.title || props.originalTitle);

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
  const p = parsed.value;
  return TAG_ORDER.filter(def => !!p[def.key as keyof ParsedDmhyTitle]).map(def => ({
    ...def,
    value: p[def.key as keyof ParsedDmhyTitle]
  }));
});

const status = ref<DotStatus>('loading');
const checkResult = ref<MediaCheckResult | null>(null);
const bangumiSubject = ref<{
  id: number;
  name: string;
  name_cn?: string;
  url: string;
} | null>(null);

// ─── Logic ───────────────────────────────────────────────────────────────────

function isNameMatch(searchTitle: string, embyName: string): boolean {
  const normalize = (s: string) => s
    .toLowerCase()
    .replace(/[\s\-–—:：·・、,，.。!！?？]/g, '')
    .replace(/[（()）\[\]【】]/g, '');

  const a = normalize(searchTitle);
  const b = normalize(embyName);

  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  const shorter = a.length <= b.length ? a : b;
  const longer = a.length > b.length ? a : b;

  if (shorter.length >= 2 && longer.includes(shorter)) return true;

  if (/[\u4e00-\u9fa5]/.test(a) && /[\u4e00-\u9fa5]/.test(b)) {
    const charsA = new Set(a);
    let overlap = 0;
    for (const c of b) {
      if (charsA.has(c)) overlap++;
    }
    const ratio = overlap / Math.max(a.length, b.length);
    if (ratio >= 0.6) return true;
  }

  return false;
}

async function checkStatus() {
  const title = titleText.value;
  const baseResult = {
    title,
    mediaType: 'tv' as const,
    searchQueries: [title],
    tmdbId: null,
    embyItem: null,
  };

  try {
    status.value = 'loading';

    // 1. Emby
    if (configService.validate('emby')) {
      const embyResult = await embyService.searchByName(title);
      const items = embyResult.data || [];
      const matchedItems = items.filter(item => isNameMatch(title, item.Name));

      if (matchedItems.length > 0) {
        const item = matchedItems[0];
        status.value = 'found';
        checkResult.value = {
          ...baseResult,
          embyItem: item,
          embyItems: matchedItems.length > 1 ? matchedItems : undefined,
          status: 'found',
          statusMessage: `Found: ${item.Name}`,
        };
        return;
      }
    }

    // 2. Bangumi
    if (configService.validate('bangumi')) {
      const bgmResult = await bangumiService.search(title);
      const subject = bgmResult.data;

      if (subject) {
        bangumiSubject.value = {
          id: subject.id,
          name: subject.name,
          name_cn: subject.name_cn,
          url: `https://bgm.tv/subject/${subject.id}`,
        };
        status.value = 'not-found';
        checkResult.value = {
          ...baseResult,
          status: 'not-found',
          statusMessage: `BGM: ${subject.name_cn || subject.name}`,
        };
        return;
      }
    }

    // 3. Not Found
    status.value = 'not-found';
    checkResult.value = {
      ...baseResult,
      status: 'not-found',
      statusMessage: 'Not found',
    };

  } catch (error: any) {
    status.value = 'error';
    checkResult.value = {
      ...baseResult,
      status: 'error',
      statusMessage: `Error: ${error.message || error}`,
    };
  }
}

function onDotClick() {
  if (checkResult.value && status.value === 'found') {
     uiController.showModal(checkResult.value); 
  }
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────

onMounted(() => {
  checkStatus();
});

watch(() => props.originalTitle, () => {
  checkStatus();
});

function onBangumiClick(e: Event) {
  e.stopPropagation();
}

</script>

<template>
  <div class="tw-reset flex items-center gap-1">
    <div class="w-[14px] h-[14px]">
      <StatusDot 
        :status="status" 
        size="mini" 
        :title="checkResult?.statusMessage"
        @dot-click="onDotClick()"
      />
    </div>
    
    <!-- Title & Link -->
    <a 
      :href="href" 
      target="_blank" 
      class="no-underline text-inherit hover:underline"
      :title="originalTitle"
    >
      {{ titleText }}
    </a>

    <!-- Tags -->
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

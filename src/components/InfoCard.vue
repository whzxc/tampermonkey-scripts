<script lang="ts" setup>
import { computed, ref, watch, onMounted, nextTick } from 'vue';
import type { EmbyItem } from '@/types/emby';
import type { TmdbInfo } from '@/types/ui';
import type { TmdbSearchItem } from '@/services/media-service';
import EmbyCard from './EmbyCard.vue';
import TmdbCard from './TmdbCard.vue';
import ResourceCard from './ResourceCard.vue';

const props = defineProps<{
  title: string;
  embyItem?: EmbyItem | null;
  embyItems?: EmbyItem[];
  searchQueries?: string[];
  tmdbInfo?: TmdbInfo;
  tmdbResults?: TmdbSearchItem[];
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const localVisible = ref(false);

onMounted(() => {
  nextTick(() => {
    localVisible.value = true;
  });
});

watch(() => props.visible, (newVal) => {
  if (newVal) localVisible.value = true;
  else localVisible.value = false;
});

function close() {
  localVisible.value = false;
}

function onAfterLeave() {
  emit('close');
}

const hasEmby = computed(() => !!(props.embyItems?.length || props.embyItem));
const firstEmbyItem = computed(() => props.embyItems?.[0] || props.embyItem || null);

// Determine effective tmdbInfo for ResourceCard:
// 1. From pipeline props (when TMDB was searched)
// 2. From first TMDB search result
// 3. From Emby item's ProviderIds (when found via name search)
const effectiveTmdbInfo = computed((): TmdbInfo | null => {
  if (props.tmdbInfo) return props.tmdbInfo;
  if (props.tmdbResults?.length) {
    const first = props.tmdbResults[0];
    return { id: first.id, mediaType: first.mediaType };
  }
  // Try to extract from Emby item's ProviderIds
  const emby = firstEmbyItem.value;
  if (emby) {
    const providerIds = (emby as any).ProviderIds;
    const tmdbId = providerIds?.Tmdb || providerIds?.tmdb;
    if (tmdbId) {
      const mediaType = emby.Type === 'Series' ? 'tv' : 'movie';
      return { id: Number(tmdbId), mediaType };
    }
  }
  return null;
});

function onOverlayClick(e: MouseEvent) {
  close();
}
</script>

<template>
  <div class="tw-reset relative z-[10000]">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="localVisible" class="fixed inset-0 w-full h-full bg-black/60 backdrop-blur-[2px]" @click="onOverlayClick"></div>
    </Transition>

    <div class="fixed inset-0 flex items-center justify-center pointer-events-none">
       <Transition
        enter-active-class="transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        enter-from-class="opacity-0 translate-y-5 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-5 scale-95"
        @after-leave="onAfterLeave"
      >
        <div v-if="localVisible" class="pointer-events-auto bg-white w-[500px] max-w-[90%] max-h-[85vh] rounded-xl flex flex-col shadow-2xl overflow-hidden font-sans">
          <!-- Header -->
          <div class="p-[15px_20px] border-b border-[#eee] flex justify-between items-center bg-[#f8f9fa]">
            <div class="font-bold text-base text-[#333]">{{ title }}</div>
            <div class="cursor-pointer text-xl text-[#999] hover:text-[#333] leading-none" @click="close">&times;</div>
          </div>

          <div class="flex-1 overflow-y-auto p-0">
            <!-- Emby Item Detail -->
            <EmbyCard v-if="firstEmbyItem" :item="firstEmbyItem" :items="embyItems" />

            <!-- TMDB Info Panel (when not found in Emby) -->
            <TmdbCard v-if="!hasEmby" :results="tmdbResults || []" :title="title" />

            <!-- Nullbr Resources + Search Actions (always visible) -->
            <ResourceCard :search-queries="searchQueries" :tmdb-info="effectiveTmdbInfo" />
          </div>

          <!-- Footer -->
          <div class="p-[15px] bg-[#f8f9fa] text-right border-t border-[#eee]">
            <button class="inline-block px-2 py-1 rounded-md no-underline text-sm font-medium cursor-pointer transition-colors bg-white text-[#333] border border-[#ddd] hover:bg-[#f5f5f5]" @click="close">Close</button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>



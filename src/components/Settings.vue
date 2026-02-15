<script lang="ts" setup>
import { computed, onMounted, ref, watch, nextTick } from 'vue';
import { CONFIG, configService } from '@/services/config';
import { cache } from '@/services/cache';
import { embyService } from '@/services/api/emby';

const props = defineProps<{
  visible: boolean;
  initialTab?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

// Local visibility for exit animations
const localVisible = ref(false);

// Tabs: 'emby', 'resources', 'general', 'cache'
const activeTab = ref('emby'); // Default to Emby

// Settings form values
const tmdbApiKey = ref('');
const bangumiToken = ref('');
const embyServer = ref('');
const embyApiKey = ref('');
const embyLibraries = ref<any[]>([]);
const embySelectedLibraries = ref<string[] | null>(null); // Null means not set (implies Select All)
const isLoadingLibraries = ref(false);

const nullbrApiKey = ref('');
const nullbrEnable115 = ref(true);
const nullbrEnableMagnet = ref(false);
const saved = ref(false);

// Cache info
const cacheKeys = ref<string[]>([]);
const selectedCacheCategory = ref<string | null>(null);

const cacheStats = computed(() => {
  const keys = cacheKeys.value;
  return {
    emby: keys.filter(k => k.startsWith('emby_')).length,
    tmdb: keys.filter(k => k.startsWith('tmdb_')).length,
    bangumi: keys.filter(k => k.startsWith('bangumi_')).length,
    nullbr: keys.filter(k => k.startsWith('nullbr_')).length,
    total: keys.length,
  };
});

const selectedCacheCategoryKeys = computed(() => {
  if (!selectedCacheCategory.value) return [];
  return cacheKeys.value.filter(k => k.startsWith(`${selectedCacheCategory.value}_`));
});

onMounted(() => {
  if (props.initialTab) {
    activeTab.value = props.initialTab;
  }
  loadSettings();
  if (activeTab.value === 'cache') {
    refreshCacheKeys();
  }
  if (activeTab.value === 'emby') {
     fetchEmbyLibraries();
  }
  // Trigger enter animation
  nextTick(() => {
    localVisible.value = true;
  });
});

watch(() => props.visible, (newVal) => {
  if (newVal) {
    localVisible.value = true;
    loadSettings();
    if (activeTab.value === 'cache') refreshCacheKeys();
    if (activeTab.value === 'emby' && embyLibraries.value.length === 0) fetchEmbyLibraries();
  } else {
    localVisible.value = false;
  }
});

watch(activeTab, (newTab) => {
  if (newTab === 'cache') {
    refreshCacheKeys();
  } else if (newTab === 'emby') {
    if (embyLibraries.value.length === 0) {
      fetchEmbyLibraries();
    }
  }
});

function close() {
  localVisible.value = false;
}

function onAfterLeave() {
  emit('close');
}

function loadSettings() {
  tmdbApiKey.value = (CONFIG.tmdb.apiKey as string) || '';
  bangumiToken.value = (CONFIG.bangumi.apiKey as string) || '';
  
  // Emby
  embyServer.value = (CONFIG.emby.server as string) || '';
  embyApiKey.value = (CONFIG.emby.apiKey as string) || '';
  // Load from config, default to null if not set
  embySelectedLibraries.value = (CONFIG.emby.selectedLibraries as string[]) || null;

  // Nullbr
  nullbrApiKey.value = (CONFIG.nullbr.apiKey as string) || '';
  nullbrEnable115.value = CONFIG.nullbr.enable115 !== false;
  nullbrEnableMagnet.value = CONFIG.nullbr.enableMagnet === true;
}

function saveSettings() {
  configService.update('tmdb', { apiKey: tmdbApiKey.value });
  configService.update('bangumi', { apiKey: bangumiToken.value });
  
  configService.update('emby', { 
    server: embyServer.value, 
    apiKey: embyApiKey.value,
    selectedLibraries: embySelectedLibraries.value || [] 
  });
  
  configService.update('nullbr', { 
    apiKey: nullbrApiKey.value, 
    enable115: nullbrEnable115.value, 
    enableMagnet: nullbrEnableMagnet.value 
  });

  saved.value = true;
  setTimeout(() => {
    saved.value = false;
  }, 2000);
}

async function fetchEmbyLibraries() {
  if (!embyServer.value || !embyApiKey.value) return;
  
  isLoadingLibraries.value = true;
  try {
    const res = await embyService.getLibraries();
    if (res.data) {
      embyLibraries.value = res.data;
      
      // Auto-select all if not set (null)
      if (embySelectedLibraries.value === null) {
        selectAllLibraries();
      }
    }
  } catch (e) {
    console.error('Failed to fetch Emby libraries', e);
  } finally {
    isLoadingLibraries.value = false;
  }
}

function toggleLibrary(libId: string) {
  if (!embySelectedLibraries.value) {
    embySelectedLibraries.value = [];
  }
  const idx = embySelectedLibraries.value.indexOf(libId);
  if (idx > -1) {
    embySelectedLibraries.value.splice(idx, 1);
  } else {
    embySelectedLibraries.value.push(libId);
  }
}

function selectAllLibraries() {
  embySelectedLibraries.value = embyLibraries.value.map(l => l.ItemId);
}

function deselectAllLibraries() {
  embySelectedLibraries.value = [];
}

// Cache
function refreshCacheKeys() {
  cacheKeys.value = cache.listKeys();
}

function clearCache(filter?: string) {
  if (filter) {
    cache.clear([filter]);
  } else {
    cache.clear();
  }
  refreshCacheKeys();
  selectedCacheCategory.value = null;
}

function selectCacheCategory(category: string) {
  selectedCacheCategory.value = category;
}

function backToCacheList() {
  selectedCacheCategory.value = null;
}

function onOverlayClick(e: MouseEvent) {
  close();
}

function getCategoryName(key: string): string {
  const map: Record<string, string> = {
    emby: 'Emby',
    tmdb: 'TMDB',
    bangumi: 'Bangumi',
    nullbr: 'Nullbr',
  };
  return map[key] || key;
}

function getCacheCount(cat: string): number {
  return (cacheStats.value as any)[cat] || 0;
}
</script>

<template>
  <div class="tw-reset relative z-[10000]">
    <!-- Backdrop, transition on existing -->
    <Transition 
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="localVisible" class="fixed inset-0 w-full h-full bg-black/40 backdrop-blur-[2px]" @click="onOverlayClick"></div>
    </Transition>

    <!-- Content Container -->
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
        <div v-if="localVisible" class="pointer-events-auto bg-white w-[600px] max-w-[90vw] h-[500px] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden">
          
          <!-- Modal Header -->
          <div class="px-5 py-[15px] border-b border-[#f0f0f0] flex justify-between items-center bg-white">
            <h3 class="m-0 text-base font-semibold text-[#333]">Settings (v1.6.4)</h3>
            <button class="bg-transparent border-none text-2xl leading-none cursor-pointer text-[#999] hover:text-[#333]" @click="close">×</button>
          </div>

          <div class="flex-1 flex overflow-hidden">
            <!-- Sidebar -->
            <div class="w-[140px] bg-[#fafafa] border-r border-[#eee] py-[10px] flex flex-col shrink-0">
              <div 
                v-for="tab in ['emby', 'resources', 'general', 'cache']"
                :key="tab"
                class="px-5 py-2.5 cursor-pointer text-[13px] text-[#666] transition-all duration-200 border-l-[3px] border-transparent hover:bg-[#eee] hover:text-[#333] capitalize"
                :class="{ ['bg-white text-[#01b4e4] font-medium border-l-[#01b4e4] shadow-[-1px_1px_4px_rgba(0,0,0,0.02)]']: activeTab === tab }"
                @click="activeTab = tab"
              >
                {{ tab }}
              </div>
            </div>

            <!-- Content Area -->
            <div class="flex-1 p-5 overflow-y-auto relative bg-white">
              
              <!-- Emby Tab -->
              <div v-if="activeTab === 'emby'" class="animate-none">

                 <h4 class="m-[0_0_20px_0] text-[15px] font-semibold text-[#444] pb-2 border-b border-[#f0f0f0]">Emby Configuration</h4>
                
                <div class="mb-[15px]">
                  <label class="block text-xs font-medium text-[#555] mb-1.5">Server URL</label>
                  <input v-model="embyServer" class="w-full px-2.5 py-2 border border-[#ddd] rounded-md text-[13px] transition-colors outline-none focus:border-[#01b4e4] focus:ring-2 focus:ring-[#01b4e4]/10" placeholder="http://your-emby-server:8096" type="text" @change="fetchEmbyLibraries">
                </div>

                <div class="mb-[15px]">
                  <label class="block text-xs font-medium text-[#555] mb-1.5">API Key</label>
                  <input v-model="embyApiKey" class="w-full px-2.5 py-2 border border-[#ddd] rounded-md text-[13px] transition-colors outline-none focus:border-[#01b4e4] focus:ring-2 focus:ring-[#01b4e4]/10" placeholder="Enter Emby API Key" type="text" @change="fetchEmbyLibraries">
                </div>

                <div class="h-px bg-[#eee] my-5"></div>
                
                <div class="flex justify-between items-center mb-2.5">
                  <label class="block text-xs font-medium text-[#555]" style="margin:0">Libraries</label>
                  <div class="flex items-center">
                     <button class="bg-none border-none text-[#01b4e4] cursor-pointer text-xs ml-2 p-0 hover:underline disabled:text-[#ccc] disabled:cursor-not-allowed disabled:no-underline" @click="selectAllLibraries">Select All</button>
                     <button class="bg-none border-none text-[#01b4e4] cursor-pointer text-xs ml-2 p-0 hover:underline disabled:text-[#ccc] disabled:cursor-not-allowed disabled:no-underline" @click="deselectAllLibraries">Clear</button>
                     <button class="bg-none border-none text-[#01b4e4] cursor-pointer text-xs ml-2 p-0 hover:underline disabled:text-[#ccc] disabled:cursor-not-allowed disabled:no-underline" @click="fetchEmbyLibraries" :disabled="isLoadingLibraries">
                       {{ isLoadingLibraries ? '...' : 'Refresh' }}
                     </button>
                  </div>
                </div>

                <div class="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 max-h-[200px] overflow-y-auto border border-[#eee] rounded-md p-2">
                  <div v-if="embyLibraries.length === 0" class="col-span-full text-center text-[#999] text-[13px] p-5">
                    {{ isLoadingLibraries ? 'Fetching libraries...' : 'No libraries found (Check config)' }}
                  </div>
                  
                  <label 
                    v-for="lib in embyLibraries" 
                    :key="lib.ItemId" 
                    class="flex items-center gap-1.5 p-1.5 border border-[#f0f0f0] rounded cursor-pointer transition-all hover:bg-[#f9f9f9]" 
                    :class="{ ['bg-[#f0fbfd] border-[#bcecf7]']: embySelectedLibraries?.includes(lib.ItemId) }"
                  >
                    <input 
                      type="checkbox" 
                      :checked="embySelectedLibraries?.includes(lib.ItemId) ?? false"
                      @change="toggleLibrary(lib.ItemId)"
                    >
                    <span class="text-xs whitespace-nowrap overflow-hidden text-ellipsis">{{ lib.Name }}</span>
                  </label>
                </div>
                <div class="text-xs text-[#888] mt-2.5">Search only in selected libraries.</div>
              </div>

              <!-- Resources Tab -->
              <div v-if="activeTab === 'resources'">
                <h4 class="m-[0_0_20px_0] text-[15px] font-semibold text-[#444] pb-2 border-b border-[#f0f0f0]">Nullbr Search</h4>

                <div class="mb-[15px]">
                  <label class="block text-xs font-medium text-[#555] mb-1.5">Nullbr API Key</label>
                  <input v-model="nullbrApiKey" class="w-full px-2.5 py-2 border border-[#ddd] rounded-md text-[13px] transition-colors outline-none focus:border-[#01b4e4] focus:ring-2 focus:ring-[#01b4e4]/10" placeholder="Enter Nullbr Api Key" type="text">
                </div>

                <div class="flex flex-col gap-2.5">
                  <label class="flex items-center gap-2 text-[13px] cursor-pointer">
                    <input v-model="nullbrEnable115" type="checkbox">
                    <span>115 Drive Search</span>
                  </label>
                  <label class="flex items-center gap-2 text-[13px] cursor-pointer">
                    <input v-model="nullbrEnableMagnet" type="checkbox">
                    <span>Magnet Search</span>
                  </label>
                </div>
              </div>

              <!-- General Tab -->
              <div v-if="activeTab === 'general'">
                <h4 class="m-[0_0_20px_0] text-[15px] font-semibold text-[#444] pb-2 border-b border-[#f0f0f0]">General Settings</h4>
                
                <div class="mb-[15px]">
                  <label class="block text-xs font-medium text-[#555] mb-1.5">TMDB API Key</label>
                  <input v-model="tmdbApiKey" class="w-full px-2.5 py-2 border border-[#ddd] rounded-md text-[13px] transition-colors outline-none focus:border-[#01b4e4] focus:ring-2 focus:ring-[#01b4e4]/10" placeholder="Enter TMDB API Key" type="text">
                </div>

                <div class="mb-[15px]">
                  <label class="block text-xs font-medium text-[#555] mb-1.5">Bangumi Token</label>
                  <input v-model="bangumiToken" class="w-full px-2.5 py-2 border border-[#ddd] rounded-md text-[13px] transition-colors outline-none focus:border-[#01b4e4] focus:ring-2 focus:ring-[#01b4e4]/10" placeholder="Enter Bangumi Token" type="text">
                </div>
                
                <div class="bg-[#f0f7ff] border border-[#cce5ff] rounded-md p-2.5 mt-5">
                  <p class="m-0 mb-1.5 text-xs text-[#555]">TMDB is used for metadata.</p>
                  <p class="m-0 text-xs text-[#555]">Bangumi helps with Chinese title matching.</p>
                </div>
              </div>

              <!-- Cache Tab -->
              <div v-if="activeTab === 'cache'">
                <h4 class="m-[0_0_20px_0] text-[15px] font-semibold text-[#444] pb-2 border-b border-[#f0f0f0]">Cache Management</h4>

                <!-- Cache Summary List -->
                <template v-if="!selectedCacheCategory">
                  <div class="bg-[#fafafa] rounded-md p-[10px_15px] flex justify-between items-center text-[13px] font-medium mb-[15px]">
                    <span>Total Items: {{ cacheStats.total }}</span>
                    <button class="px-2.5 py-1 text-xs rounded border border-transparent bg-[#e74c3c] text-white hover:bg-[#c0392b] cursor-pointer transition-colors" @click="clearCache()">Clear All</button>
                  </div>

                  <div class="flex flex-col gap-2">
                    <div v-for="cat in ['emby', 'tmdb', 'bangumi', 'nullbr']" :key="cat" class="flex justify-between items-center p-[12px_14px] border border-[#eee] rounded-md transition-all hover:border-[#ddd] hover:bg-[#fafafa] cursor-pointer" @click="selectCacheCategory(cat)">
                      <div class="font-medium text-sm text-[#333]">
                        <span class="font-medium text-sm text-[#333] capitalize">{{ cat === 'tmdb' ? 'TMDB' : cat }}</span>
                        <span class="text-xs text-[#888] ml-1.5">{{ getCacheCount(cat) }} items</span>
                      </div>
                      <button class="px-2.5 py-1 text-xs rounded border border-[#ffcccc] bg-transparent text-[#e74c3c] hover:bg-[#feefef] hover:border-[#e74c3c] cursor-pointer transition-colors" @click.stop="clearCache(cat)">Clean</button>
                    </div>
                  </div>
                </template>

                <!-- Cache Detail View -->
                <template v-else>
                  <div class="flex justify-between items-center mb-2.5">
                    <button class="bg-none border-none text-lg cursor-pointer mr-2" @click="backToCacheList">🔙</button>
                    <h5 class="m-0 flex-1 font-semibold text-sm">{{ getCategoryName(selectedCacheCategory || '') }} Cache</h5>
                    <button class="px-2.5 py-1 text-xs rounded border border-transparent bg-[#e74c3c] text-white hover:bg-[#c0392b] cursor-pointer transition-colors" @click="clearCache(selectedCacheCategory || undefined)">Clear This</button>
                  </div>

                  <div class="border border-[#eee] rounded-md bg-[#fafafa] overflow-y-auto font-mono text-xs text-[#555] max-h-[300px]">
                    <div v-if="selectedCacheCategoryKeys.length === 0" class="p-2.5 text-center text-[#999]">
                      No cache items
                    </div>
                    <div v-for="key in selectedCacheCategoryKeys" :key="key" class="p-[6px_10px] border-b border-[#eee] last:border-0 break-all">
                      {{ key }}
                    </div>
                  </div>
                </template>
              </div>

            </div>
          </div>

          <!-- Footer Actions -->
          <div class="p-[15px_20px] border-t border-[#f0f0f0] flex justify-end items-center bg-white gap-2.5">
            <span class="mr-auto text-[13px] text-[#52B54B] transition-opacity duration-300 opacity-0" :class="{ 'opacity-100': saved }">✓ Saved</span>
            <button class="px-4 py-2 rounded-md text-[13px] font-medium cursor-pointer border-none transition-all bg-[#f0f0f0] text-[#333] hover:bg-[#e0e0e0]" @click="close">Close</button>
            <button v-if="activeTab !== 'cache'" class="px-4 py-2 rounded-md text-[13px] font-medium cursor-pointer border-none transition-all bg-[#01b4e4] text-white hover:bg-[#019ec9]" @click="saveSettings">
              Save
            </button>
          </div>

        </div>
      </Transition>
    </div>
  </div>
</template>



<script lang="ts" setup>
import { computed } from 'vue';

export type DotStatus = 'loading' | 'found' | 'not-found' | 'error';

const props = defineProps<{
  status: DotStatus;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'mini';
}>();

const emit = defineEmits<{
  (e: 'dotClick'): void;
}>();

const statusClass = computed(() => {
  switch (props.status) {
    case 'loading':
      return 'bg-[#01b4e4] animate-pulse opacity-80 border-[rgba(255,255,255,0.8)]';
    case 'found':
      return 'bg-[#52B54B] shadow-[0_0_10px_rgba(82,181,75,0.8)]';
    case 'not-found':
    case 'error':
      return 'bg-[#9e9e9e] opacity-70';
    default:
      return 'bg-[#01b4e4] animate-pulse opacity-80 border-[rgba(255,255,255,0.8)]';
  }
});

const dotTitle = computed(() => {
  if (props.title) return props.title;
  switch (props.status) {
    case 'loading':
      return 'Checking...';
    case 'found':
      return 'Found in Emby';
    case 'not-found':
      return 'Not found';
    case 'error':
      return 'Error';
    default:
      return '';
  }
});

const containerPaddingClass = computed(() => {
  if (props.size === 'small') return 'p-1'; // 4px
  if (props.size === 'large') return 'p-2'; // 8px
  if (props.size === 'mini') return 'p-0';
  return 'p-1.5'; // 6px
});
</script>

<template>
  <div :class="[
    containerPaddingClass,
    'tw-reset w-full h-full block box-border'
  ]">
    <div 
      :class="[
        statusClass,
        'w-full h-full rounded-full cursor-pointer border-2 border-white flex items-center justify-center text-[0px] box-border transition-transform duration-200 ease-out shadow-[0_0_8px_rgba(0,0,0,0.5)] hover:scale-115'
      ]"
      :title="dotTitle" 
      @click="emit('dotClick')" 
    />
  </div>
</template>



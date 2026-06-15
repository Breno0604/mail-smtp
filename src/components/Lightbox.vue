<!-- src/components/Lightbox.vue -->
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

interface Props {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
}

defineProps<Props>();

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    // Emit close event
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <Teleport to="body">
    <div 
      v-if="isOpen" 
      class="fixed inset-0 z-[1001] flex items-center justify-center bg-black/90"
      @click="$emit('close')"
    >
      <button 
        @click.stop="$emit('close')"
        class="lightbox-close absolute top-5 right-7 bg-none border-none text-white text-3xl cursor-pointer"
      >
        ✕
      </button>
      <img 
        :src="imageUrl" 
        alt="Preview ampliado" 
        class="max-w-[90vw] max-h-[90vh] rounded-[10px] shadow-2xl"
        @click.stop
      >
    </div>
  </Teleport>
</template>

<style scoped>
.lightbox-close:hover {
  opacity: 0.7;
}
</style>
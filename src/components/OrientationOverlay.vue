<!-- src/components/OrientationOverlay.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const showOverlay = ref(false);

function checkOrientation() {
  // Only show on mobile devices
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (!isMobile) return;
  
  // Show overlay in LANDSCAPE (width > height), hide in PORTRAIT
  showOverlay.value = window.innerWidth > window.innerHeight;
}

onMounted(() => {
  checkOrientation();
  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', checkOrientation);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkOrientation);
  window.removeEventListener('orientationchange', checkOrientation);
});
</script>

<template>
  <Teleport to="body">
    <div 
      v-if="showOverlay" 
      class="fixed inset-0 z-50 flex items-center justify-center bg-white"
      style="background: white;"
    >
      <div class="text-center p-8">
        <svg class="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Gire o celular na vertical</h2>
        <p class="text-gray-600">O formulário funciona melhor no modo retrato.</p>
      </div>
    </div>
  </Teleport>
</template>
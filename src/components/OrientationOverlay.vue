<!-- src/components/OrientationOverlay.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const showOverlay = ref(false);

function checkOrientation() {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (!isMobile) return;
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
      class="orientation-overlay"
      style="display: flex;"
    >
      <div class="orientation-overlay-content">
        <span class="orientation-icon">📱</span>
        <p class="orientation-text">Gire o celular na vertical</p>
        <p class="orientation-sub">O formulário funciona melhor no modo retrato.</p>
      </div>
    </div>
  </Teleport>
</template>

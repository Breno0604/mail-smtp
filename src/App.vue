<!-- src/App.vue -->
<script setup lang="ts">
import { useUIStore } from '@/stores/ui';
import { onMounted } from 'vue';
import Sidebar from '@/components/Sidebar.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import UpdateModal from '@/components/UpdateModal.vue';
import DuplicateModal from '@/components/DuplicateModal.vue';
import OrientationOverlay from '@/components/OrientationOverlay.vue';

const ui = useUIStore();

onMounted(() => {
  // Register service worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration failed silently
    });
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Toast notification -->
    <Teleport to="body">
      <div 
        v-if="ui.toastVisible" 
        class="fixed bottom-4 right-4 z-50 animate-slide-in"
        :class="[ui.toastSuccess ? 'bg-green-600' : 'bg-red-600', 'text-white px-4 py-3 rounded-lg shadow-lg']"
      >
        {{ ui.toastMessage }}
      </div>
    </Teleport>

    <!-- Error banner -->
    <Teleport to="body">
      <div 
        v-if="ui.errorVisible" 
        class="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-down"
      >
        <div class="flex items-center justify-between gap-4">
          <span>{{ ui.errorMessage }}</span>
          <button @click="ui.hideError()" class="text-white hover:text-gray-200 font-bold text-lg leading-none">
            ✕
          </button>
        </div>
      </div>
    </Teleport>

    <!-- Global modals -->
    <ConfirmModal />
    <UpdateModal />
    <DuplicateModal />
    <OrientationOverlay />

    <!-- Main app layout -->
    <header class="bg-blue-600 text-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 class="text-xl font-semibold">Retorno</h1>
        <div class="flex items-center gap-4">
          <Sidebar />
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
@keyframes slide-in {
  from { opacity: 0; transform: translateX(100%); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes slide-down {
  from { opacity: 0; transform: translateY(-100%); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-slide-in { animation: slide-in 0.3s ease-out; }
.animate-slide-down { animation: slide-down 0.3s ease-out; }
</style>
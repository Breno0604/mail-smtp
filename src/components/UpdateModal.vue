<!-- src/components/UpdateModal.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';

let registration: ServiceWorkerRegistration | null = null;

onMounted(async () => {
  if ('serviceWorker' in navigator) {
    try {
      registration = await navigator.serviceWorker.ready;
      
      registration.addEventListener('updatefound', () => {
        const newWorker = registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdatePrompt.value = true;
            }
          });
        }
      });
    } catch {
      // SW not supported or failed
    }
  }
});

const showUpdatePrompt = ref(false);

function applyUpdate() {
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
  window.location.reload();
}
</script>

<template>
  <Teleport to="body">
    <div 
      v-if="showUpdatePrompt" 
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 class="text-lg font-semibold mb-2">Atualização Disponível</h3>
        <p class="text-gray-600 mb-6">Uma nova versão do aplicativo está disponível. Deseja atualizar agora?</p>
        <div class="flex justify-end gap-3">
          <button 
            @click="showUpdatePrompt = false"
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Depois
          </button>
          <button 
            @click="applyUpdate"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Atualizar Agora
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
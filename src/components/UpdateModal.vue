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
      class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
    >
      <div class="bg-white rounded-[12px] p-7 max-w-[420px] w-[90%] shadow-xl text-center">
        <p class="text-base font-bold text-slate-900 mb-3">Sistema atualizado</p>
        <p class="text-sm text-slate-600 mb-6 leading-relaxed">O sistema foi atualizado com sucesso. Clique em OK para recarregar.</p>
        <div class="flex gap-2.5 justify-center">
          <button 
            @click="showUpdatePrompt = false"
            class="btn btn-secondary"
          >
            Depois
          </button>
          <button 
            @click="applyUpdate"
            class="btn btn-primary"
          >
            Atualizar Agora
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

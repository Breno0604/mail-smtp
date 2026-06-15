<!-- src/components/UpdateModal.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';

const showUpdatePrompt = ref(false);
let updateSW: ((reloadPage?: boolean) => Promise<void>) | null = null;

onMounted(async () => {
  try {
    const { registerSW } = await import('virtual:pwa-register');
    updateSW = registerSW({
      onNeedRefresh() {
        showUpdatePrompt.value = true;
      },
      onOfflineReady() {
        // App is ready for offline use — could show a toast here
      },
    });
  } catch {
    // virtual:pwa-register not available (dev mode)
  }
});

function applyUpdate() {
  if (updateSW) {
    updateSW();
  } else {
    window.location.reload();
  }
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

<!-- src/components/ConfirmModal.vue -->
<script setup lang="ts">
import { useUIStore } from '@/stores/ui';

const ui = useUIStore();
</script>

<template>
  <Teleport to="body">
    <div 
      v-if="ui.confirmOpen" 
      class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
    >
      <div class="bg-white rounded-[12px] p-7 max-w-[420px] w-[90%] shadow-xl text-center">
        <p class="text-sm text-slate-600 mb-6 leading-relaxed">{{ ui.confirmMessage }}</p>
        <div class="flex gap-2.5 justify-center">
          <button 
            @click="ui.resolveConfirm(false)"
            class="btn btn-secondary"
          >
            Cancelar
          </button>
          <button 
            @click="ui.resolveConfirm(true)"
            class="btn btn-primary"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

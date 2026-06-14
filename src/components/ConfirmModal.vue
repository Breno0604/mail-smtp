<!-- src/components/ConfirmModal.vue -->
<script setup lang="ts">
import { useUIStore } from '@/stores/ui';

const ui = useUIStore();
</script>

<template>
  <Teleport to="body">
    <div 
      v-if="ui.confirmOpen" 
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <p class="text-lg mb-6">{{ ui.confirmMessage }}</p>
        <div class="flex justify-end gap-3">
          <button 
            @click="ui.resolveConfirm(false)"
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button 
            @click="ui.resolveConfirm(true)"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
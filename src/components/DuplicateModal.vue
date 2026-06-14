<!-- src/components/DuplicateModal.vue -->
<script setup lang="ts">
import { ref } from 'vue';

const show = ref(false);
let resolvePromise: ((value: boolean) => void) | null = null;

function close(result: boolean) {
  show.value = false;
  if (resolvePromise) {
    resolvePromise(result);
    resolvePromise = null;
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 class="text-lg font-semibold mb-2">Reenviar E-mail</h3>
        <p class="text-gray-600 mb-6">Este registro já foi enviado. Deseja reenviar o e-mail?</p>
        <div class="flex justify-end gap-3">
          <button 
            @click="close(false)"
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button 
            @click="close(true)"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reenviar
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
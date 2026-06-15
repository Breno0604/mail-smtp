<!-- src/components/DuplicateModal.vue -->
<script setup lang="ts">
import { ref } from 'vue';

const show = ref(false);
let resolvePromise: ((value: boolean) => void) | null = null;

const title = ref('');
const body = ref('');

function close(result: boolean) {
  show.value = false;
  if (resolvePromise) {
    resolvePromise(result);
    resolvePromise = null;
  }
}

// Exposed for parent to call
function open(recordTitle: string, recordBody: string): Promise<boolean> {
  title.value = recordTitle;
  body.value = recordBody;
  show.value = true;
  return new Promise((resolve) => {
    resolvePromise = resolve;
  });
}

defineExpose({ open });
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div class="bg-white rounded-[12px] p-7 max-w-[420px] w-[90%] shadow-xl text-center">
        <p class="text-base font-bold text-slate-900 mb-3">{{ title || 'Reenviar E-mail' }}</p>
        <p class="text-sm text-slate-600 mb-6 leading-relaxed">{{ body || 'Este registro já foi enviado. Deseja reenviar o e-mail?' }}</p>
        <div class="flex gap-2.5 justify-center">
          <button 
            @click="close(false)"
            class="btn btn-secondary"
          >
            Cancelar
          </button>
          <button 
            @click="close(true)"
            class="btn btn-primary"
          >
            Reenviar
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

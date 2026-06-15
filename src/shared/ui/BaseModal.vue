<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

defineProps<{
  show: boolean
  title?: string
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Transition name="modal">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center"
      @click.self="emit('close')"
    >
      <!-- Overlay -->
      <div class="fixed inset-0 bg-black/40" />

      <!-- Card -->
      <div class="relative bg-white rounded-[12px] p-7 max-w-[420px] w-[90%] shadow-xl text-center">
        <h3 v-if="title" class="text-base font-bold text-slate-900 mb-3">
          {{ title }}
        </h3>
        <div class="text-sm text-slate-600 mb-6 leading-relaxed">
          <slot />
        </div>
        <div class="flex gap-2.5 justify-center">
          <slot name="actions">
            <button
              class="px-5 py-2.5 rounded-[10px] text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              @click="emit('close')"
              type="button"
            >
              Cancelar
            </button>
            <button
              class="px-5 py-2.5 rounded-[10px] text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              @click="emit('confirm')"
              type="button"
            >
              Confirmar
            </button>
          </slot>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>

<script setup lang="ts">
import type { ToastVariant } from '../types'

const props = withDefaults(defineProps<{
  show: boolean
  message: string
  variant?: ToastVariant
  duration?: number
}>(), {
  variant: 'success',
  duration: 3500,
})

const emit = defineEmits<{
  close: []
}>()

// Auto-hide após duration
let timer: ReturnType<typeof setTimeout> | null = null

import { watch, onUnmounted } from 'vue'

watch(() => props.show, (val) => {
  if (val && props.duration > 0) {
    timer = setTimeout(() => emit('close'), props.duration)
  }
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})

const variantClasses: Record<ToastVariant, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
}

const variantIcons: Record<ToastVariant, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
}
</script>

<template>
  <Transition name="toast">
    <div
      v-if="show"
      :class="[
        'fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-[12px] shadow-lg text-white text-sm font-semibold transition-all duration-300',
        variantClasses[variant],
      ]"
      role="alert"
    >
      <span class="text-lg">{{ variantIcons[variant] }}</span>
      <span>{{ message }}</span>
      <button
        class="ml-2 text-white/80 hover:text-white text-lg leading-none"
        @click="emit('close')"
        type="button"
        aria-label="Fechar"
      >
        &times;
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>

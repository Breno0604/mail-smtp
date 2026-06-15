<script setup lang="ts">
defineProps<{
  message: string | null
}>()

const emit = defineEmits<{
  dismiss: []
}>()
</script>

<template>
  <Transition name="error-bar">
    <div
      v-if="message"
      class="bg-red-50 text-red-600 px-4 py-3 rounded-[10px] text-xs font-semibold border border-red-200 flex items-center justify-between gap-2"
      role="alert"
    >
      <span>{{ message }}</span>
      <button
        class="text-red-400 hover:text-red-600 text-lg leading-none shrink-0"
        @click="emit('dismiss')"
        type="button"
        aria-label="Fechar"
      >
        &times;
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.error-bar-enter-active,
.error-bar-leave-active {
  transition: all 0.25s ease;
}
.error-bar-enter-from,
.error-bar-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>

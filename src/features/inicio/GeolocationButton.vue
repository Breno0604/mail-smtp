<script setup lang="ts">
defineProps<{
  coordinates: string
  loading: boolean
}>()

const emit = defineEmits<{
  refresh: []
}>()
</script>

<template>
  <div class="flex items-center gap-2">
    <span class="text-sm text-gray-700">{{ coordinates }}</span>
    <button
      type="button"
      :disabled="loading"
      class="inline-flex items-center justify-center rounded-[10px] border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      @click="emit('refresh')"
    >
      <svg
        class="h-4 w-4"
        :class="{ 'animate-spin': loading }"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    </button>
  </div>
</template>

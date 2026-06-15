<script setup lang="ts">
import type { Attachment } from '@/shared/types'

const props = defineProps<{
  attachment: Attachment
}>()

const emit = defineEmits<{
  remove: [id: string]
  preview: [attachment: Attachment]
}>()

function formatSize(dataUrl: string): string {
  const raw = dataUrl.split(',')[1] ?? dataUrl
  const bytes = Math.round(raw.length * 0.75)
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div class="group relative bg-slate-50 rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
    <button
      class="absolute top-1.5 right-1.5 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-black/50 text-white text-xs hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
      @click.stop="emit('remove', props.attachment.id)"
      type="button"
      aria-label="Remover anexo"
    >
      &times;
    </button>

    <button
      class="block w-full aspect-square overflow-hidden bg-slate-100"
      @click="emit('preview', props.attachment)"
      type="button"
    >
      <img
        :src="props.attachment.data"
        :alt="props.attachment.name"
        class="w-full h-full object-cover"
        loading="lazy"
      />
    </button>

    <div class="px-2.5 py-2 text-xs text-slate-600 truncate">
      <p class="font-medium truncate">{{ props.attachment.name }}</p>
      <p class="text-slate-400">{{ formatSize(props.attachment.data) }}</p>
    </div>
  </div>
</template>

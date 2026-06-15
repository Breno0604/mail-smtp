<script setup lang="ts">
import type { Attachment } from '@/shared/types'
import AnexoPreview from './AnexoPreview.vue'

defineProps<{
  items: Attachment[]
}>()

const emit = defineEmits<{
  remove: [id: string]
  preview: [attachment: Attachment]
}>()
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
    <AnexoPreview
      v-for="att in items"
      :key="att.id"
      :attachment="att"
      @remove="emit('remove', $event)"
      @preview="emit('preview', $event)"
    />
  </div>
</template>

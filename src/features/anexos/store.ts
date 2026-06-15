import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Attachment } from '@/shared/types'

export const useAnexoStore = defineStore('anexo', () => {
  const items = ref<Attachment[]>([])
  const count = computed(() => items.value.length)
  const uploadProgress = ref<number | null>(null)
  const errorMessage = ref<string | null>(null)

  function addItem(attachment: Attachment) {
    items.value.push(attachment)
  }

  function removeItem(id: string) {
    const idx = items.value.findIndex(a => a.id === id)
    if (idx !== -1) items.value.splice(idx, 1)
  }

  function setProgress(p: number | null) { uploadProgress.value = p }
  function setError(msg: string | null) { errorMessage.value = msg }

  function reset() {
    items.value = []
    uploadProgress.value = null
    errorMessage.value = null
  }

  function restore(data: Attachment[]) {
    items.value = data.map(a => ({ ...a }))
  }

  return { items, count, uploadProgress, errorMessage, addItem, removeItem, setProgress, setError, reset, restore }
})

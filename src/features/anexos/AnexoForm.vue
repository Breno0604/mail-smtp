<script setup lang="ts">
import { ref } from 'vue'
import type { Attachment } from '@/shared/types'
import { useAnexoStore } from './store'
import { useImageCompression } from './composables/useImageCompression'
import AnexoLista from './AnexoLista.vue'

const emit = defineEmits<{
  preview: [attachment: Attachment]
  error: [message: string]
}>()

const store = useAnexoStore()
const { compressImage } = useImageCompression()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)
const isProcessing = ref(false)

const MAX_ATTACHMENTS = 12
const MAX_FILE_SIZE = 8 * 1024 * 1024
const isDisabled = () => store.items.length >= MAX_ATTACHMENTS || isProcessing.value

function onDrop(e: DragEvent) {
  isDragOver.value = false
  const files = Array.from(e.dataTransfer?.files ?? [])
  processFiles(files)
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  processFiles(files)
  input.value = ''
}

function processFiles(files: File[]) {
  for (const file of files) {
    if (store.items.length >= MAX_ATTACHMENTS) {
      emit('error', `Máximo de ${MAX_ATTACHMENTS} anexos atingido`)
      break
    }
    if (!file.type.startsWith('image/')) {
      emit('error', `"${file.name}" não é uma imagem válida`)
      continue
    }
    uploadAttachment(file)
  }
}

async function uploadAttachment(file: File) {
  isProcessing.value = true
  store.setProgress(0)
  store.setError(null)

  try {
    const { dataUrl, blob } = await compressImage(file)
    store.setProgress(60)

    if (blob.size > MAX_FILE_SIZE) {
      store.setError(`"${file.name}" excede 8MB mesmo após compressão`)
      store.setProgress(null)
      isProcessing.value = false
      return
    }

    const attachment: Attachment = {
      id: crypto.randomUUID(),
      uuid: '',
      index: store.items.length,
      name: file.name.replace(/\.[^.]+$/, '.jpg'),
      type: 'image/jpeg',
      data: dataUrl,
    }

    store.addItem(attachment)
    store.setProgress(100)
  } catch (err) {
    store.setError(err instanceof Error ? err.message : 'Erro ao processar imagem')
  } finally {
    setTimeout(() => {
      isProcessing.value = false
      store.setProgress(null)
    }, 400)
  }
}

function onRemove(id: string) {
  store.removeItem(id)
}
</script>

<template>
  <section class="bg-white rounded-[20px] shadow-sm border border-slate-200/50 p-5">
    <h2 class="text-base font-bold text-slate-800 mb-4 uppercase tracking-wide">
      ANEXOS
    </h2>

    <!-- Dropzone -->
    <div
      class="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
      :class="[
        isDragOver
          ? 'border-blue-400 bg-blue-50'
          : 'border-slate-300',
        isDisabled()
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:border-blue-300 hover:bg-slate-50',
      ]"
      @click="!isDisabled() ? fileInput?.click() : undefined"
      @dragover.prevent="onDragOver"
      @drop.prevent="onDrop"
      @dragleave="onDragLeave"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        multiple
        hidden
        :disabled="isDisabled()"
        @change="onFileSelect"
      />

      <svg
        class="mx-auto h-10 w-10 text-slate-400 mb-2"
        stroke="currentColor"
        fill="none"
        viewBox="0 0 48 48"
        aria-hidden="true"
      >
        <path
          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>

      <p class="text-sm text-slate-600">
        <span class="font-semibold text-blue-600">Clique</span> para selecionar ou arraste imagens
      </p>
      <p class="text-xs text-slate-400 mt-1">
        {{ store.items.length }} / {{ MAX_ATTACHMENTS }}
      </p>
    </div>

    <!-- Progress bar -->
    <div
      v-if="store.uploadProgress !== null"
      class="mt-4"
    >
      <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div
          class="bg-blue-500 h-2 rounded-full transition-all duration-300"
          :style="{ width: Math.min(store.uploadProgress, 100) + '%' }"
        />
      </div>
      <p class="text-xs text-slate-400 mt-1 text-center">Comprimindo imagem...</p>
    </div>

    <!-- Error message inline -->
    <p
      v-if="store.errorMessage"
      class="mt-3 text-xs text-red-500 text-center"
    >
      {{ store.errorMessage }}
    </p>

    <!-- Preview grid -->
    <AnexoLista
      v-if="store.items.length > 0"
      class="mt-4"
      :items="store.items"
      @remove="onRemove"
      @preview="emit('preview', $event)"
    />
  </section>
</template>

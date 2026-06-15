<!-- src/components/SecaoAnexos.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useFormStore } from '@/stores/form';
import { compressAttachment } from '@/utils/compress';
import Lightbox from './Lightbox.vue';

const form = useFormStore();
const previews = ref<string[]>([]);
const maxSize = 8 * 1024 * 1024; // 8MB

const lightboxOpen = ref(false);
const lightboxImage = ref<string | null>(null);

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files) return;

  Array.from(input.files).forEach(async (file) => {
    if (file.size > maxSize) {
      alert(`Arquivo ${file.name} excede o limite de 8MB`);
      return;
    }

    try {
      const compressed = await compressAttachment(file, 1920, 0.8);
      const base64 = await fileToBase64(compressed);
      
      const attachment = {
        uuid: form.currentUUID || 'temp',
        index: form.attachments.length,
        name: file.name,
        type: file.type,
        data: base64,
      };

      form.attachments.push(attachment);
      form.markAttachmentsDirty();
      
      // Create preview URL
      const url = URL.createObjectURL(compressed);
      previews.value.push(url);
    } catch (err) {
      console.error('Erro ao processar anexo:', err);
      alert('Erro ao processar o arquivo');
    }
  });

  input.value = '';
}

function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function removeAttachment(index: number) {
  form.attachments.splice(index, 1);
  if (previews.value[index]) {
    URL.revokeObjectURL(previews.value[index]);
  }
  previews.value.splice(index, 1);
  form.markAttachmentsDirty();
}

function openLightbox(imageUrl: string) {
  lightboxImage.value = imageUrl;
  lightboxOpen.value = true;
}

function closeLightbox() {
  lightboxOpen.value = false;
  lightboxImage.value = null;
}
</script>

<template>
  <section class="bg-white rounded-lg shadow-sm p-6" id="sec-anexos">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">4. Anexos</h2>
    
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Adicionar fotos/anexos (máx. 8MB cada)
      </label>
      <input 
        type="file" 
        ref="fileInput"
        multiple 
        accept="image/*,application/pdf"
        @change="handleFileSelect"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>

    <div v-if="form.attachments.length === 0" class="text-gray-500 text-sm text-center py-8">
      Nenhum anexo adicionado.
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div 
        v-for="(attachment, index) in form.attachments" 
        :key="index"
        class="relative group"
      >
        <div class="aspect-square bg-gray-100 rounded-md overflow-hidden relative">
          <img 
            v-if="previews[index]" 
            :src="previews[index]" 
            alt="Preview"
            class="w-full h-full object-cover cursor-zoom-in"
            @click="openLightbox(previews[index])"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
            <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          
          <button 
            @click="removeAttachment(index)"
            class="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <p class="mt-1 text-xs text-gray-500 truncate">{{ attachment.name }}</p>
      </div>
    </div>

    <Lightbox 
      v-model:isOpen="lightboxOpen" 
      :imageUrl="lightboxImage || ''" 
      @close="closeLightbox" 
    />
  </section>
</template>

<style scoped>
.lightbox-close:hover {
  opacity: 0.7;
}
</style>
<!-- src/components/SecaoAnexos.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useFormStore } from '@/stores/form';
import { compressAttachment } from '@/utils/compress';

const form = useFormStore();
const previews = ref<string[]>([]);
const maxSize = 8 * 1024 * 1024; // 8MB
const fileInput = ref<HTMLInputElement | null>(null);

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

function triggerFileInput() {
  fileInput.value?.click();
}
</script>

<template>
  <section class="sec-card mx-2.5 mt-4" id="sec-anexos">
    <div class="sec-head">
      <span class="sec-num">4</span> Anexos
    </div>
    <div class="sec-body">
      <!-- Drop zone -->
      <div 
        class="file-upload-area border-2 border-dashed border-slate-200 rounded-[12px] py-8 px-5 text-center cursor-pointer transition-all duration-200 hover:border-blue-500 hover:bg-blue-50/30 bg-slate-50/50"
        @click="triggerFileInput"
      >
        <span class="text-3xl block mb-2">📎</span>
        <span class="text-sm text-slate-600 font-semibold">Clique para selecionar imagens</span>
        <span class="block mt-1.5 text-xs text-slate-400 font-medium">
          {{ form.attachments.length }} / 12
        </span>
      </div>
      
      <input 
        type="file" 
        ref="fileInput"
        accept="image/*" 
        multiple 
        class="hidden"
        @change="handleFileSelect"
      />

      <!-- Preview grid -->
      <div v-if="form.attachments.length > 0" class="grid grid-cols-4 gap-2 mt-4 preview-grid">
        <div 
          v-for="(attachment, index) in form.attachments" 
          :key="index"
          class="preview-item relative border-2 border-slate-300 rounded-[10px] overflow-hidden bg-slate-100 aspect-square group"
        >
          <img 
            v-if="previews[index]" 
            :src="previews[index]" 
            alt="Preview"
            class="w-full h-full object-cover cursor-zoom-in"
            @click="openLightbox(previews[index])"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-slate-400 text-sm">
            {{ attachment.name?.substring(0, 8) }}
          </div>
          
          <button 
            @click.stop="removeAttachment(index)"
            class="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-red-600 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Lightbox -->
      <Teleport to="body">
        <div 
          v-if="lightboxOpen" 
          class="fixed inset-0 bg-black/90 z-[1001] flex items-center justify-center"
          @click="closeLightbox"
        >
          <button 
            @click.stop="closeLightbox"
            class="absolute top-5 right-7 bg-none border-none text-white text-3xl cursor-pointer hover:opacity-70"
          >
            ✕
          </button>
          <img 
            v-if="lightboxImage" 
            :src="lightboxImage" 
            alt="Preview ampliado" 
            class="max-w-[90vw] max-h-[90vh] rounded-[10px] shadow-2xl"
            @click.stop
          >
        </div>
      </Teleport>
    </div>
  </section>
</template>

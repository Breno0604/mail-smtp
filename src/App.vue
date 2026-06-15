<!-- src/App.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useUIStore } from '@/stores/ui';
import { useFormStore } from '@/stores/form';
import Sidebar from '@/components/Sidebar.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import UpdateModal from '@/components/UpdateModal.vue';
import DuplicateModal from '@/components/DuplicateModal.vue';
import OrientationOverlay from '@/components/OrientationOverlay.vue';

const ui = useUIStore();
const form = useFormStore();
const sidebarOpen = ref(false);

function handleNewRecord() {
  form.newRecord();
}
</script>

<template>
  <div class="bg-gradient-to-br from-slate-100 to-blue-50 min-h-screen flex justify-center items-start p-0">
    <!-- Main container -->
    <div class="container bg-white rounded-[20px] border-2 border-slate-200/50 w-full max-w-[640px] relative shadow-sm">
      
      <!-- Header -->
      <div class="flex justify-between items-center px-5 pt-3.5 pb-2.5">
        <button class="hamburger" @click="sidebarOpen = true">
          &#9776;
        </button>
        <h1 class="text-xl text-slate-900 font-bold m-0 tracking-tight">Retorno de Ordens</h1>
        <button class="btn-new-form" @click="handleNewRecord" title="Novo formulário">+</button>
      </div>

      <!-- Error banner -->
      <div 
        v-if="ui.errorVisible" 
        class="bg-red-50 text-red-600 px-4 py-3 rounded-[10px] text-xs font-semibold border border-red-200 mx-2.5 mt-3"
      >
        {{ ui.errorMessage }}
      </div>

      <!-- Form sections -->
      <router-view />

      <!-- Sidebar panel (teleported to body) -->
      <Sidebar :isOpen="sidebarOpen" @close="sidebarOpen = false" />

      <!-- Toast notification -->
      <Teleport to="body">
        <div 
          class="toast"
          :class="{ show: ui.toastVisible, success: ui.toastSuccess }"
        >
          {{ ui.toastMessage }}
        </div>
      </Teleport>

      <!-- Global modals -->
      <ConfirmModal />
      <UpdateModal />
      <DuplicateModal />
      <OrientationOverlay />

    </div>
  </div>
</template>

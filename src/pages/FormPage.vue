<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Attachment, FormRecord } from '@/shared/types'
import { useInicioStore } from '@/features/inicio/store'
import { useRetornoStore } from '@/features/retorno/store'
import { useEquipamentoStore } from '@/features/equipamentos/store'
import { useAnexoStore } from '@/features/anexos/store'

import InicioForm from '@/features/inicio/InicioForm.vue'
import RetornoForm from '@/features/retorno/RetornoForm.vue'
import EquipamentoForm from '@/features/equipamentos/EquipamentoForm.vue'
import AnexoForm from '@/features/anexos/AnexoForm.vue'
import RevisaoForm from '@/features/email/RevisaoForm.vue'
import SidebarPanel from '@/features/sidebar/SidebarPanel.vue'
import BaseToast from '@/shared/ui/BaseToast.vue'
import BaseErrorBar from '@/shared/ui/BaseErrorBar.vue'

// ── Stores ────────────────────────────────────────────────────────────────────
const inicioStore = useInicioStore()
const retornoStore = useRetornoStore()
const equipamentoStore = useEquipamentoStore()
const anexoStore = useAnexoStore()

// ── Estado local ──────────────────────────────────────────────────────────────
const sidebarOpen = ref(false)
const lightboxSrc = ref('')
const lightboxOpen = ref(false)
const errorMessage = ref<string | null>(null)
const toastMessage = ref('')
const toastVariant = ref<'success' | 'error' | 'warning'>('success')
const toastShow = ref(false)

// ── Sincroniza tipo de ordem → retorno ────────────────────────────────────────
watch(() => inicioStore.data.tipoOrdem, (newTipo) => {
  if (newTipo) {
    retornoStore.setTipoOrdem(newTipo)
  }
})

// ── Handlers ──────────────────────────────────────────────────────────────────
function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function novoForm() {
  inicioStore.reset()
  retornoStore.reset()
  equipamentoStore.reset()
  anexoStore.reset()
  errorMessage.value = null
}

function onRestoreRecord(record: FormRecord) {
  // Restaura dados do registro no formulário
  inicioStore.data.uc = record.iniciais.uc
  inicioStore.data.os = record.iniciais.os
  inicioStore.data.tipoOrdem = record.iniciais.tipoOrdem
  inicioStore.data.parceiroLider = record.iniciais.parceiroLider
  inicioStore.data.municipio = record.iniciais.municipio
  inicioStore.data.placa = record.iniciais.placa
  inicioStore.data.data = record.iniciais.data
  inicioStore.data.horaInicio = record.iniciais.horaInicio
  inicioStore.data.horaFim = record.iniciais.horaFim
  inicioStore.data.coordenadas = record.iniciais.coordenadas
  inicioStore.data.notificado = record.iniciais.notificado
  inicioStore.data.complemento = record.iniciais.complemento

  // Retorno
  retornoStore.restoreData(record.retorno)

  // Equipamentos
  equipamentoStore.restore(record.equipamentos)

  // Anexos (serão carregados separadamente via IndexedDB)
  // TODO: carregar anexos do registro ao restaurar
}

function onPreviewAnexo(attachment: Attachment) {
  lightboxSrc.value = attachment.data
  lightboxOpen.value = true
}

function onAnexoError(message: string) {
  showToast(message, 'error')
}

function showToast(message: string, variant: 'success' | 'error' | 'warning' = 'success') {
  toastMessage.value = message
  toastVariant.value = variant
  toastShow.value = true
}

function closeToast() {
  toastShow.value = false
}

function dismissError() {
  errorMessage.value = null
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50">
    <div class="container mx-auto max-w-[640px] py-4 relative">
      <!-- Header -->
      <header class="flex justify-between items-center px-5 pb-2.5">
        <button
          class="hamburger text-2xl text-slate-700 hover:text-slate-900 transition-colors"
          @click="toggleSidebar"
          title="Registros"
          type="button"
        >
          &#9776;
        </button>
        <h1 class="text-xl text-slate-900 font-bold tracking-tight">Retorno de Ordens</h1>
        <button
          class="btn-new-form text-2xl text-slate-700 hover:text-slate-900 transition-colors"
          @click="novoForm"
          title="Novo formulário"
          type="button"
        >
          +
        </button>
      </header>

      <!-- Error bar -->
      <div class="px-2.5 mb-2">
        <BaseErrorBar :message="errorMessage" @dismiss="dismissError" />
      </div>

      <!-- Sections -->
      <main class="space-y-3 px-2.5">
        <!-- Section 1: Início -->
        <section class="sec-card bg-white rounded-[20px] shadow-sm border border-slate-200/50 p-5">
          <InicioForm />
        </section>

        <!-- Section 2: Retorno -->
        <section class="sec-card bg-white rounded-[20px] shadow-sm border border-slate-200/50 p-5">
          <RetornoForm />
        </section>

        <!-- Section 3: Equipamentos -->
        <section class="sec-card bg-white rounded-[20px] shadow-sm border border-slate-200/50 p-5">
          <EquipamentoForm />
        </section>

        <!-- Section 4: Anexos -->
        <section class="sec-card bg-white rounded-[20px] shadow-sm border border-slate-200/50 p-5">
          <AnexoForm
            @preview="onPreviewAnexo"
            @error="onAnexoError"
          />
        </section>

        <!-- Section 5: Revisão -->
        <section class="sec-card bg-white rounded-[20px] shadow-sm border border-slate-200/50 p-5">
          <RevisaoForm />
        </section>

        <!-- Send button (extra, RevisaoForm também tem) -->
        <div class="text-center pb-6">
          <button
            class="btn-enviar w-full max-w-xs py-3.5 px-8 rounded-[12px] bg-gradient-to-r from-green-500 to-emerald-600 text-white text-base font-bold shadow-md hover:shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 active:scale-[0.98]"
            type="button"
          >
            📨 Enviar
          </button>
        </div>
      </main>
    </div>

    <!-- Sidebar -->
    <SidebarPanel
      :open="sidebarOpen"
      @close="sidebarOpen = false"
      @restore="onRestoreRecord"
    />

    <!-- Toast -->
    <BaseToast
      :show="toastShow"
      :message="toastMessage"
      :variant="toastVariant"
      @close="closeToast"
    />

    <!-- Lightbox -->
    <Transition name="modal">
      <div
        v-if="lightboxOpen"
        class="fixed inset-0 z-[1001] flex items-center justify-center bg-black/90"
        @click="lightboxOpen = false"
      >
        <button
          class="absolute top-5 right-7 text-white text-3xl cursor-pointer bg-transparent border-none hover:text-slate-300 transition-colors"
          @click="lightboxOpen = false"
          type="button"
          aria-label="Fechar"
        >
          ✕
        </button>
        <img
          :src="lightboxSrc"
          alt="Preview ampliado"
          class="max-w-[90vw] max-h-[90vh] rounded-[10px] shadow-2xl"
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.sec-card {
  transition: box-shadow 0.2s ease;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useEquipamentoStore } from './store'
import EquipamentoRow from './EquipamentoRow.vue'

const store = useEquipamentoStore()

const hasErrors = computed(() => Object.keys(store.validationErrors).length > 0)

function addItem() {
  store.addItem()
}
</script>

<template>
  <section class="space-y-4">
    <h2 class="text-lg font-bold uppercase text-gray-800">EQUIPAMENTOS</h2>

    <div
      v-if="hasErrors"
      class="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600"
      role="alert"
    >
      Verifique os campos obrigatórios abaixo.
    </div>

    <div class="space-y-3">
      <EquipamentoRow
        v-for="(item, index) in store.items"
        :key="index"
        :item="item"
        :index="index"
        :errors="store.validationErrors"
        @update="store.updateItem"
        @remove="store.removeItem"
      />
    </div>

    <button
      type="button"
      class="flex w-full items-center justify-center gap-2 rounded-[10px] border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-semibold text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
      @click="addItem"
    >
      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Adicionar Equipamento
    </button>
  </section>
</template>

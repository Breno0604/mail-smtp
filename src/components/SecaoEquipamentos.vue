<!-- src/components/SecaoEquipamentos.vue -->
<script setup lang="ts">
import { useFormStore } from '@/stores/form';

const form = useFormStore();

function addEquipamento() {
  form.equipamentos.push({ status: '', categoria: '', numero: '' });
}

function removeEquipamento(index: number) {
  form.equipamentos.splice(index, 1);
}
</script>

<template>
  <section class="bg-white rounded-lg shadow-sm p-6" id="sec-equipamentos">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold text-gray-900">3. Equipamentos</h2>
      <button 
        @click="addEquipamento"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
      >
        + Adicionar Equipamento
      </button>
    </div>

    <div v-if="form.equipamentos.length === 0" class="text-gray-500 text-sm text-center py-8">
      Nenhum equipamento adicionado. Clique em "Adicionar Equipamento" para começar.
    </div>

    <div v-else class="space-y-4">
      <div 
        v-for="(_, index) in form.equipamentos" 
        :key="index"
        class="flex flex-wrap gap-4 p-4 border border-gray-200 rounded-md bg-gray-50"
      >
        <div class="flex-1 min-w-[150px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <input 
            type="text"
            v-model="form.equipamentos[index].status"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: OK, FALHA"
          />
        </div>

        <div class="flex-1 min-w-[150px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
          <input 
            type="text"
            v-model="form.equipamentos[index].categoria"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: MEDIDOR, DISPLAY"
          />
        </div>

        <div class="flex-1 min-w-[150px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">Número</label>
          <input 
            type="text"
            v-model="form.equipamentos[index].numero"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: 12345"
          />
        </div>

        <div class="flex items-end">
          <button 
            @click="removeEquipamento(index)"
            class="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
          >
            Remover
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
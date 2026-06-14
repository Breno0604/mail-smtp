<!-- src/components/SecaoRetorno.vue -->
<script setup lang="ts">
import { computed, watch } from 'vue';
import { useFormStore } from '@/stores/form';
import { getRetornoFields } from '@/constants/fields';

const form = useFormStore();

const activeRetornoFields = computed(() => {
  const tipo = form.tipoOrdem || form.iniciais['tipo-ordem'] || '';
  if (!tipo) return [];
  return getRetornoFields(tipo);
});

watch(() => form.tipoOrdem, (newVal) => {
  if (newVal) {
    form.retorno = {};
  }
});

watch(() => form.iniciais['tipo-ordem'], (newVal) => {
  if (newVal) {
    form.retorno = {};
  }
});
</script>

<template>
  <section class="bg-white rounded-lg shadow-sm p-6" id="sec-retorno">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">2. Retorno</h2>
    
    <div v-if="activeRetornoFields.length === 0" class="text-gray-500 text-sm">
      Selecione um Tipo de Ordem na seção Iniciais para ver os campos de retorno.
    </div>
    
    <div v-else class="space-y-4">
      <div 
        v-for="field in activeRetornoFields" 
        :key="field.nome"
        class="flex-1 min-w-[200px]"
      >
        <label :for="field.nome" class="block text-sm font-medium text-gray-700 mb-1">
          {{ field.label }}
          <span v-if="field.obrigatorio" class="text-red-500 ml-1">*</span>
        </label>
        
        <!-- Textarea -->
        <textarea 
          v-if="field.tipo === 'textarea'" 
          :id="field.nome"
          v-model="form.retorno[field.nome]"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        
        <!-- Select -->
        <select 
          v-else-if="field.tipo === 'select'" 
          :id="field.nome"
          v-model="form.retorno[field.nome]"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Selecione</option>
          <option v-for="opt in field.opcoes" :key="opt" :value="opt">{{ opt }}</option>
        </select>

        <!-- Text/Number -->
        <input 
          v-else 
          :id="field.nome"
          :type="field.tipo === 'number' ? 'number' : 'text'"
          v-model="form.retorno[field.nome]"
          :inputmode="field.tipo === 'number' ? 'numeric' : 'text'"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  </section>
</template>
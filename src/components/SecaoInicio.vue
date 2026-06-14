<!-- src/components/SecaoInicio.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useFormStore } from '@/stores/form';
import { iniciaisFields } from '@/constants/fields';
import { captureCoordinates } from '@/utils/coordinates';

const form = useFormStore();

const fieldsByLinha = computed(() => {
  const grouped: Record<number, typeof iniciaisFields> = {};
  iniciaisFields.forEach((field) => {
    const linha = field.linha ?? 0;
    if (!grouped[linha]) grouped[linha] = [];
    grouped[linha].push(field);
  });
  return grouped;
});

const linhas = computed(() => Object.keys(fieldsByLinha.value).map(Number).sort((a, b) => a - b));

async function handleCoordinates() {
  const coords = await captureCoordinates();
  form.iniciais.coordenadas = coords;
}
</script>

<template>
  <section class="bg-white rounded-lg shadow-sm p-6" id="sec-inicio">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">1. Iniciais</h2>
    
    <div v-for="linha in linhas" :key="linha" class="flex flex-wrap gap-4 mb-4">
      <div 
        v-for="field in fieldsByLinha[linha]" 
        :key="field.nome" 
        class="flex-1 min-w-[200px]"
      >
        <label :for="field.nome" class="block text-sm font-medium text-gray-700 mb-1">
          {{ field.label }}
          <span v-if="field.obrigatorio" class="text-red-500 ml-1">*</span>
        </label>
        
        <!-- Select -->
        <select 
          v-if="field.tipo === 'select'" 
          :id="field.nome"
          :value="form.iniciais[field.nome]"
          @change="($event) => { form.iniciais[field.nome] = ($event.target as HTMLSelectElement).value; if (field.nome === 'tipo-ordem') form.setTipoOrdem(($event.target as HTMLSelectElement).value); }"
          :disabled="field.readonly"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Selecione</option>
          <option v-for="opt in field.opcoes" :key="opt" :value="opt">{{ opt }}</option>
        </select>

        <!-- Text/Number -->
        <input 
          v-else-if="field.tipo === 'text' || field.tipo === 'number'" 
          :id="field.nome"
          :type="field.tipo === 'number' ? 'number' : 'text'"
          v-model="form.iniciais[field.nome]"
          :disabled="field.readonly"
          :inputmode="field.tipo === 'number' ? 'numeric' : 'text'"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        <!-- Date -->
        <input 
          v-else-if="field.tipo === 'date'" 
          :id="field.nome"
          type="date"
          v-model="form.iniciais[field.nome]"
          :disabled="field.readonly"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        <!-- Time -->
        <input 
          v-else-if="field.tipo === 'time'" 
          :id="field.nome"
          type="time"
          v-model="form.iniciais[field.nome]"
          step="300"
          :disabled="field.readonly"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        <!-- Coordinates -->
        <div v-else-if="field.tipo === 'coordinates'" class="flex gap-2">
          <input 
            :id="field.nome"
            type="text"
            v-model="form.iniciais[field.nome]"
            readonly
            class="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
          />
          <button 
            @click="handleCoordinates"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            GPS
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
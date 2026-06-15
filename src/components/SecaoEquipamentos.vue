<!-- src/components/SecaoEquipamentos.vue -->
<script setup lang="ts">
import { reactive } from 'vue';
import { useFormStore } from '@/stores/form';
import type { EquipamentoData } from '@/types';

const form = useFormStore();

const touched = reactive<Record<string, boolean>>({});

function getFieldState(index: number, field: keyof EquipamentoData): string {
  const key = `${index}-${field}`;
  const equip = form.equipamentos[index];
  if (!equip) return '';
  const value = equip[field];
  if (!value || value.toString().trim() === '') {
    if (touched[key]) return 'error';
    return '';
  }
  return 'is-filled';
}

function markTouched(index: number, field: string) {
  touched[`${index}-${field}`] = true;
}

function addEquipamento() {
  form.equipamentos.push({ status: '', categoria: '', numero: '' });
}

function removeEquipamento(index: number) {
  form.equipamentos.splice(index, 1);
}
</script>

<template>
  <section class="sec-card mx-2.5 mt-4" id="sec-equipamentos">
    <div class="sec-head">
      <span class="sec-num">3</span> Equipamentos
    </div>
    <div class="sec-body">
      <div v-if="form.equipamentos.length === 0" class="text-gray-500 text-sm text-center py-8">
        Nenhum equipamento adicionado.
      </div>

      <div v-else class="space-y-3 mb-3">
        <div 
          v-for="(_, index) in form.equipamentos" 
          :key="index"
          class="equip-row p-3 border-2 border-slate-300 rounded-[10px] bg-slate-50/30"
        >
          <div class="flex flex-wrap gap-2">
            <div class="flex-1 min-w-[120px]">
              <label class="block text-xs mb-0.5 font-bold">Status</label>
              <select 
                v-model="form.equipamentos[index].status"
                @blur="markTouched(index, 'status')"
                :class="['w-full px-3.5 py-3 rounded-[10px] text-[15px] border-2.5 outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10 equip-tipo', getFieldState(index, 'status')]"
              >
                <option value="">Selecione...</option>
                <option value="Instalado">Instalado</option>
                <option value="Retirado">Retirado</option>
              </select>
            </div>

            <div class="flex-1 min-w-[120px]">
              <label class="block text-xs mb-0.5 font-bold">Categoria</label>
              <select 
                v-model="form.equipamentos[index].categoria"
                @blur="markTouched(index, 'categoria')"
                :class="['w-full px-3.5 py-3 rounded-[10px] text-[15px] border-2.5 outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10 equip-categoria', getFieldState(index, 'categoria')]"
              >
                <option value="">Selecione...</option>
                <option value="Medidor">Medidor</option>
                <option value="Display">Display</option>
                <option value="Conjunto">Conjunto</option>
                <option value="TC">TC</option>
                <option value="TP">TP</option>
              </select>
            </div>

            <div class="flex-1 min-w-[120px]">
              <label class="block text-xs mb-0.5 font-bold">Número</label>
              <input 
                type="number"
                v-model="form.equipamentos[index].numero"
                @blur="markTouched(index, 'numero')"
                :class="['w-full px-3.5 py-3 rounded-[10px] text-[15px] border-2.5 outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10 equip-numero', getFieldState(index, 'numero')]"
                placeholder="Ex: 12345"
              />
            </div>

            <div class="flex items-end">
              <button 
                @click="removeEquipamento(index)"
                class="px-4 py-3 bg-red-100 text-red-700 rounded-[10px] hover:bg-red-200 text-sm font-semibold transition-all"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Add button: dashed style -->
      <button 
        @click="addEquipamento"
        class="w-full py-3 px-4 border-2 border-dashed border-slate-200 rounded-[10px] bg-slate-50/30 text-slate-600 text-sm font-semibold cursor-pointer transition-all duration-200 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50/30"
        type="button"
      >
        + Adicionar equipamento
      </button>
    </div>
  </section>
</template>

<!-- src/components/SecaoRetorno.vue -->
<script setup lang="ts">
import { computed, watch, reactive } from 'vue';
import { useFormStore } from '@/stores/form';
import { getRetornoFields } from '@/constants/fields';

const form = useFormStore();

const activeRetornoFields = computed(() => {
  const tipo = form.tipoOrdem || form.iniciais['tipo-ordem'] || '';
  if (!tipo) return [];
  return getRetornoFields(tipo);
});

// Blur validation tracking
const touched = reactive<Record<string, boolean>>({});

function markTouched(fieldName: string) {
  touched[fieldName] = true;
}

function isFieldError(fieldName: string): boolean {
  const field = activeRetornoFields.value.find(f => f.nome === fieldName);
  if (!field?.obrigatorio) return false;
  if (!touched[fieldName]) return false;
  const value = form.retorno[fieldName];
  return !value || value.trim() === '';
}

function getFieldStateClass(fieldName: string): string {
  const field = activeRetornoFields.value.find(f => f.nome === fieldName);
  if (!field?.obrigatorio) return '';
  const value = form.retorno[fieldName];
  if (!value || value.trim() === '') {
    if (isFieldError(fieldName)) return 'error';
    return '';
  }
  return 'is-filled';
}

watch(() => form.tipoOrdem, () => {
  form.retorno = {};
});

watch(() => form.iniciais['tipo-ordem'], () => {
  form.retorno = {};
});
</script>

<template>
  <section class="sec-card mx-2.5 mt-4" id="sec-retorno">
    <div class="sec-head">
      <span class="sec-num">2</span> Retorno
    </div>
    <div class="sec-body">
      <p class="text-base font-bold text-slate-900 mb-4" id="retorno-desc">
        {{ form.tipoOrdem || form.iniciais['tipo-ordem'] || '—' }}
      </p>
      
      <div v-if="activeRetornoFields.length === 0" class="ret-placeholder">
        <span class="ret-icon">👆</span>
        Selecione o Tipo de Ordem na seção "Início" para exibir os campos de Retorno
      </div>
      
      <div v-else class="flex flex-wrap gap-2">
        <div 
          v-for="field in activeRetornoFields" 
          :key="field.nome"
          class="flex-1 min-w-[160px]"
        >
          <label :for="field.nome" class="block text-xs mb-0.5 font-bold">
            {{ field.label }}
            <span v-if="field.obrigatorio" class="text-red-500 ml-0.5">*</span>
          </label>
          
          <!-- Textarea -->
          <textarea 
            v-if="field.tipo === 'textarea'" 
            :id="field.nome"
            :value="form.retorno[field.nome]"
            @input="($event) => { form.retorno[field.nome] = ($event.target as HTMLTextAreaElement).value; }"
            @blur="markTouched(field.nome)"
            rows="3"
            :class="['w-full px-3.5 py-3 rounded-[10px] text-[15px] border-2.5 outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10 resize-y min-h-[80px]', getFieldStateClass(field.nome)]"
          />
          <span v-if="field.obrigatorio" class="field-error" :class="{ show: isFieldError(field.nome) }">
            {{ field.label }} é obrigatório
          </span>
          
          <!-- Select -->
          <select 
            v-else-if="field.tipo === 'select'" 
            :id="field.nome"
            :value="form.retorno[field.nome]"
            @change="($event) => { form.retorno[field.nome] = ($event.target as HTMLSelectElement).value; }"
            @blur="markTouched(field.nome)"
            :class="['w-full px-3.5 py-3 rounded-[10px] text-[15px] border-2.5 outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10', getFieldStateClass(field.nome)]"
          >
            <option value="">Selecione</option>
            <option v-for="opt in field.opcoes" :key="opt" :value="opt">{{ opt }}</option>
          </select>
          <span v-if="field.obrigatorio" class="field-error" :class="{ show: isFieldError(field.nome) }">
            {{ field.label }} é obrigatório
          </span>

          <!-- Text/Number -->
          <input 
            v-else 
            :id="field.nome"
            :type="field.tipo === 'number' ? 'number' : 'text'"
            :value="form.retorno[field.nome]"
            @input="($event) => { form.retorno[field.nome] = ($event.target as HTMLInputElement).value; }"
            @blur="markTouched(field.nome)"
            :inputmode="field.tipo === 'number' ? 'numeric' : 'text'"
            :class="['w-full px-3.5 py-3 rounded-[10px] text-[15px] border-2.5 outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10', getFieldStateClass(field.nome)]"
          />
          <span v-if="field.obrigatorio" class="field-error" :class="{ show: isFieldError(field.nome) }">
            {{ field.label }} é obrigatório
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

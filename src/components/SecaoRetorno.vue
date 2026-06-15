<!-- src/components/SecaoRetorno.vue -->
<script setup lang="ts">
import { computed, watch, reactive } from 'vue';
import { useFormStore } from '@/stores/form';
import { getRetornoFields } from '@/constants/fields';

const form = useFormStore();

// Get all fields for the current tipo (including conditional ones)
const allRetornoFields = computed(() => {
  const tipo = form.tipoOrdem || form.iniciais['tipo-ordem'] || '';
  if (!tipo) return [];
  return getRetornoFields(tipo);
});

// Filter fields based on conditional visibility
const activeRetornoFields = computed(() => {
  const fields = allRetornoFields.value;
  return fields.filter(field => {
    if (!field.condicional) return true;
    
    const controlValue = form.retorno[field.condicional.campoRef];
    if (!controlValue) return false;
    
    const valores = Array.isArray(field.condicional.valor)
      ? field.condicional.valor
      : [field.condicional.valor];
    const match = valores.includes(controlValue);
    return field.condicional.negado ? !match : match;
  });
});

// Group fields by linha, preserving order. Fields with no linha are each in their own row.
const retornoLinhas = computed(() => {
  const fields = activeRetornoFields.value;
  const groups: { linha: number; fields: typeof fields }[] = [];
  const map = new Map<number, typeof fields>();
  
  fields.forEach(f => {
    const l = f.linha ?? 999; // fields without linha each get a unique row
    // If no linha, give each field a unique number so they're alone
    if (f.linha === undefined) {
      const unique = 1000 + groups.length;
      map.set(unique, [f]);
    } else {
      if (!map.has(l)) map.set(l, []);
      map.get(l)!.push(f);
    }
  });
  
  // Sort by linha number
  const sorted = [...map.entries()].sort(([a], [b]) => a - b);
  return sorted.map(([linha, fields]) => ({ linha, fields }));
});

// Blur validation tracking
const touched = reactive<Record<string, boolean>>({});

function markTouched(fieldName: string) {
  touched[fieldName] = true;
}

function isFieldError(fieldName: string): boolean {
  if (!touched[fieldName]) return false;
  const value = form.retorno[fieldName];
  return !value || value.trim() === '';
}

function getFieldStateClass(fieldName: string): string {
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

// Clear conditional field values when they become hidden
watch(activeRetornoFields, (newFields, oldFields) => {
  const newFieldNames = new Set(newFields.map(f => f.nome));
  const oldFieldNames = new Set(oldFields.map(f => f.nome));
  
  // Find fields that were visible but are now hidden
  const hiddenFields = [...oldFieldNames].filter(name => !newFieldNames.has(name));
  
  hiddenFields.forEach(fieldName => {
    if (form.retorno[fieldName]) {
      form.retorno[fieldName] = '';
    }
  });
}, { deep: true });
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
      
      <div v-else class="space-y-3">
        <div 
          v-for="linhaGroup in retornoLinhas" 
          :key="linhaGroup.linha"
          :class="linhaGroup.fields.length > 1 ? 'flex flex-wrap gap-2' : ''"
        >
          <div 
            v-for="field in linhaGroup.fields" 
            :key="field.nome"
            :class="linhaGroup.fields.length > 1 ? 'flex-1 min-w-[160px]' : 'w-full'"
          >
            <label :for="field.nome" class="block text-xs mb-0.5 font-bold">
              {{ field.label }} <span class="text-red-500 ml-0.5">*</span>
            </label>
            
            <!-- Textarea -->
            <template v-if="field.tipo === 'textarea'">
              <textarea 
                :id="field.nome"
                :value="form.retorno[field.nome]"
                @input="($event) => { form.retorno[field.nome] = ($event.target as HTMLTextAreaElement).value; }"
                @blur="markTouched(field.nome)"
                rows="3"
                :class="['w-full px-3.5 py-3 rounded-[10px] text-[15px] border-2.5 outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10 resize-y min-h-[80px]', getFieldStateClass(field.nome)]"
              />
              <span class="field-error" :class="{ show: isFieldError(field.nome) }">
                {{ field.label }} é obrigatório
              </span>
            </template>
            
            <!-- Select -->
            <template v-else-if="field.tipo === 'select'">
              <select 
                :id="field.nome"
                :value="form.retorno[field.nome]"
                @change="($event) => { form.retorno[field.nome] = ($event.target as HTMLSelectElement).value; }"
                @blur="markTouched(field.nome)"
                :class="['w-full px-3.5 py-3 rounded-[10px] text-[15px] border-2.5 outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10', getFieldStateClass(field.nome)]"
              >
                <option value="">Selecione</option>
                <option v-for="opt in field.opcoes" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <span class="field-error" :class="{ show: isFieldError(field.nome) }">
                {{ field.label }} é obrigatório
              </span>
            </template>

            <!-- Text/Number -->
            <template v-else>
              <input 
                :id="field.nome"
                :type="field.tipo === 'number' ? 'number' : 'text'"
                :value="form.retorno[field.nome]"
                @input="($event) => { form.retorno[field.nome] = ($event.target as HTMLInputElement).value; }"
                @blur="markTouched(field.nome)"
                :inputmode="field.tipo === 'number' ? 'numeric' : 'text'"
                :class="['w-full px-3.5 py-3 rounded-[10px] text-[15px] border-2.5 outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10', getFieldStateClass(field.nome)]"
              />
              <span class="field-error" :class="{ show: isFieldError(field.nome) }">
                {{ field.label }} é obrigatório
              </span>
            </template>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

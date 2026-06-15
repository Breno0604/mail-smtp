<!-- src/components/SecaoInicio.vue -->
<script setup lang="ts">
import { computed, reactive } from 'vue';
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

// Blur validation tracking
const touched = reactive<Record<string, boolean>>({});

function markTouched(fieldName: string) {
  touched[fieldName] = true;
}

function isFieldError(fieldName: string): boolean {
  const field = iniciaisFields.find(f => f.nome === fieldName);
  if (!field?.obrigatorio) return false;
  if (!touched[fieldName]) return false;
  const value = form.iniciais[fieldName];
  return !value || value.trim() === '';
}

function getFieldStateClass(fieldName: string): string {
  const value = form.iniciais[fieldName];
  if (!value || value.trim() === '') {
    if (isFieldError(fieldName)) return 'error';
    return '';
  }
  return 'is-filled';
}

async function handleCoordinates() {
  const coords = await captureCoordinates();
  form.iniciais.coordenadas = coords;
}
</script>

<template>
  <section class="sec-card mx-2.5 mt-4" id="sec-inicio">
    <div class="sec-head">
      <span class="sec-num">1</span> Início
    </div>
    <div class="sec-body" id="iniciais-campos">
      <div v-for="linha in linhas" :key="linha" class="mb-4">
        <!-- Linha 4 e 5: Grid 2 colunas (UC/OS, Notificado/Placa) -->
        <div 
          v-if="linha === 4 || linha === 5" 
          class="linha-grid"
        >
          <div 
            v-for="field in fieldsByLinha[linha]" 
            :key="field.nome"
            class="px-1"
          >
            <label :for="field.nome" class="block text-xs mb-0.5">
              {{ field.label }}
              <span v-if="field.obrigatorio" class="text-red-500 ml-0.5">*</span>
            </label>
            
            <!-- Select -->
            <select 
              v-if="field.tipo === 'select'" 
              :id="field.nome"
              :value="form.iniciais[field.nome]"
              @change="($event) => { const val = ($event.target as HTMLSelectElement).value; form.iniciais[field.nome] = val; if (field.nome === 'tipo-ordem') form.setTipoOrdem(val); }"
              @blur="markTouched(field.nome)"
              :class="['w-full px-3.5 py-3 rounded-[10px] text-[15px] border-2.5 outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10', getFieldStateClass(field.nome)]"
              :disabled="field.readonly"
            >
              <option value="">Selecione</option>
              <option v-for="opt in field.opcoes" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            <span v-if="field.obrigatorio" class="field-error" :class="{ show: isFieldError(field.nome) }">
              {{ field.label }} é obrigatório
            </span>

            <!-- Text/Number -->
            <input 
              v-else-if="field.tipo === 'text' || field.tipo === 'number'" 
              :id="field.nome"
              :type="field.tipo === 'number' ? 'number' : 'text'"
              :value="form.iniciais[field.nome]"
              @input="($event) => { form.iniciais[field.nome] = ($event.target as HTMLInputElement).value; }"
              @blur="markTouched(field.nome)"
              :disabled="field.readonly"
              :inputmode="field.tipo === 'number' ? 'numeric' : 'text'"
              :class="['w-full px-3.5 py-3 rounded-[10px] text-[15px] border-2.5 outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10', getFieldStateClass(field.nome)]"
            />
            <span v-if="field.obrigatorio" class="field-error" :class="{ show: isFieldError(field.nome) }">
              {{ field.label }} é obrigatório
            </span>
          </div>
        </div>

        <!-- Linha 6: Grid 3 colunas (Data/Início/Fim) -->
        <div 
          v-else-if="linha === 6" 
          class="linha-data"
        >
          <div 
            v-for="field in fieldsByLinha[linha]" 
            :key="field.nome"
            class="px-1"
          >
            <label :for="field.nome" class="block text-xs mb-0.5">
              {{ field.label }}
              <span v-if="field.obrigatorio" class="text-red-500 ml-0.5">*</span>
            </label>
            
            <!-- Date -->
            <input 
              v-if="field.tipo === 'date'" 
              :id="field.nome"
              type="date"
              :value="form.iniciais[field.nome]"
              @input="($event) => { form.iniciais[field.nome] = ($event.target as HTMLInputElement).value; }"
              @blur="markTouched(field.nome)"
              :class="['w-full px-3.5 py-3 rounded-[10px] text-[15px] border-2.5 outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10', getFieldStateClass(field.nome)]"
              :disabled="field.readonly"
            />
            <span v-if="field.obrigatorio" class="field-error" :class="{ show: isFieldError(field.nome) }">
              {{ field.label }} é obrigatório
            </span>

            <!-- Time -->
            <input 
              v-else-if="field.tipo === 'time'" 
              :id="field.nome"
              type="time"
              :value="form.iniciais[field.nome]"
              @input="($event) => { form.iniciais[field.nome] = ($event.target as HTMLInputElement).value; }"
              @blur="markTouched(field.nome)"
              step="300"
              :class="['w-full px-3.5 py-3 rounded-[10px] text-[15px] border-2.5 outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10', getFieldStateClass(field.nome)]"
              :disabled="field.readonly"
            />
            <span v-if="field.obrigatorio" class="field-error" :class="{ show: isFieldError(field.nome) }">
              {{ field.label }} é obrigatório
            </span>
          </div>
        </div>

        <!-- Linhas 0, 1, 2, 3, 7: Layout normal (um campo por linha, empilhados verticalmente) -->
        <div v-else>
          <div 
            v-for="field in fieldsByLinha[linha]" 
            :key="field.nome"
            class="w-full"
          >
            <label :for="field.nome" class="block text-xs mb-0.5 font-bold">
              {{ field.label }}
              <span v-if="field.obrigatorio" class="text-red-500 ml-0.5">*</span>
            </label>
            
            <!-- Select -->
            <select 
              v-if="field.tipo === 'select'" 
              :id="field.nome"
              :value="form.iniciais[field.nome]"
              @change="($event) => { const val = ($event.target as HTMLSelectElement).value; form.iniciais[field.nome] = val; if (field.nome === 'tipo-ordem') form.setTipoOrdem(val); }"
              @blur="markTouched(field.nome)"
              :class="['w-full px-3.5 py-3 rounded-[10px] text-[15px] border-2.5 outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10', getFieldStateClass(field.nome)]"
              :disabled="field.readonly"
            >
              <option value="">Selecione</option>
              <option v-for="opt in field.opcoes" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            <span v-if="field.obrigatorio" class="field-error" :class="{ show: isFieldError(field.nome) }">
              {{ field.label }} é obrigatório
            </span>

            <!-- Text/Number -->
            <input 
              v-else-if="field.tipo === 'text' || field.tipo === 'number'" 
              :id="field.nome"
              :type="field.tipo === 'number' ? 'number' : 'text'"
              :value="form.iniciais[field.nome]"
              @input="($event) => { form.iniciais[field.nome] = ($event.target as HTMLInputElement).value; }"
              @blur="markTouched(field.nome)"
              :disabled="field.readonly"
              :inputmode="field.tipo === 'number' ? 'numeric' : 'text'"
              :class="['w-full px-3.5 py-3 rounded-[10px] text-[15px] border-2.5 outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10', getFieldStateClass(field.nome)]"
            />
            <span v-if="field.obrigatorio" class="field-error" :class="{ show: isFieldError(field.nome) }">
              {{ field.label }} é obrigatório
            </span>

            <!-- Coordinates (linha 0) -->
            <div v-else-if="field.tipo === 'coordinates'" class="relative">
              <input 
                :id="field.nome"
                type="text"
                :value="form.iniciais[field.nome]"
                readonly
                class="w-full px-3.5 py-3 rounded-[10px] text-[15px] border-2.5 bg-gray-100 outline-none transition-all duration-200 pr-12"
                placeholder="Coordenadas GPS"
              />
              <button 
                @click="handleCoordinates"
                class="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-[8px] bg-blue-600 text-white hover:bg-blue-700 text-lg transition-all"
                title="Capturar coordenadas"
                type="button"
              >
                &#8635;
              </button>
            </div>
            <span v-if="field.obrigatorio" class="field-error" :class="{ show: isFieldError(field.nome) }">
              {{ field.label }} é obrigatório
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

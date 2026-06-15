<script setup lang="ts">
import { computed } from 'vue'
import type { FieldDefinition } from '@/shared/types'
import GeolocationButton from './GeolocationButton.vue'

const props = defineProps<{
  field: FieldDefinition
  modelValue: string
  error: string | null
  geoLoading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: []
}>()

const inputId = computed(() => `campo-${props.field.nome}`)

const inputClasses = computed(() => [
  'w-full rounded-[10px] border bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
  props.error ? 'border-red-500' : 'border-gray-300',
].join(' '))

function onInput(e: Event) {
  const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  emit('update:modelValue', target.value)
}

function onChange(e: Event) {
  const target = e.target as HTMLSelectElement
  emit('update:modelValue', target.value)
  emit('change')
}
</script>

<template>
  <div>
    <label
      :for="inputId"
      class="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600"
    >
      {{ field.label }}
      <span v-if="field.obrigatorio" class="text-red-500">*</span>
    </label>

    <div v-if="field.tipo === 'coordinates'">
      <GeolocationButton
        :coordinates="modelValue"
        :loading="geoLoading ?? false"
        @refresh="emit('change')"
      />
    </div>

    <select
      v-else-if="field.tipo === 'select'"
      :id="inputId"
      :value="modelValue"
      :class="inputClasses"
      @change="onChange"
    >
      <option value="" disabled>Selecione</option>
      <option
        v-for="opt in field.opcoes"
        :key="opt"
        :value="opt"
      >
        {{ opt }}
      </option>
    </select>

    <textarea
      v-else-if="field.tipo === 'textarea'"
      :id="inputId"
      :value="modelValue"
      :class="inputClasses"
      rows="3"
      @input="onInput"
    ></textarea>

    <input
      v-else
      :id="inputId"
      :type="field.tipo === 'number' ? 'text' : field.tipo"
      :value="modelValue"
      :class="inputClasses"
      :inputmode="field.tipo === 'number' ? 'numeric' : undefined"
      :readonly="field.readonly ?? false"
      @input="onInput"
    />

    <p v-if="error" class="mt-1 text-xs text-red-500">{{ error }}</p>
  </div>
</template>

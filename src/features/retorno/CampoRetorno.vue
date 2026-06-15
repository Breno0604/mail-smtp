<script setup lang="ts">
import type { RetornoField } from '@/shared/types'

defineProps<{
  field: RetornoField
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onInput(event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div v-if="field.tipo === 'description'" class="text-sm text-slate-500 italic">
    {{ field.label }}
  </div>

  <label
    v-else
    class="flex flex-col gap-1 text-sm font-semibold text-slate-700"
  >
    {{ field.label }}
    <select
      v-if="field.tipo === 'select'"
      :value="modelValue"
      class="rounded-[10px] border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
      @input="onInput"
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
      :value="modelValue"
      class="rounded-[10px] border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-y min-h-[80px]"
      @input="onInput"
    ></textarea>

    <input
      v-else
      :type="field.tipo === 'number' ? 'text' : field.tipo"
      :inputmode="field.tipo === 'number' ? 'numeric' : undefined"
      :value="modelValue"
      class="rounded-[10px] border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
      @input="onInput"
    />
  </label>
</template>

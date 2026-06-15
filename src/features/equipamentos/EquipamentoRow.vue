<script setup lang="ts">
import type { Equipment } from '@/shared/types'
import { CATEGORIAS_EQUIPAMENTO, STATUS_EQUIPAMENTO } from '@/shared/types'

const props = defineProps<{
  item: Equipment
  index: number
  errors: Record<string, string>
}>()

const emit = defineEmits<{
  update: [index: number, field: keyof Equipment, value: string]
  remove: [index: number]
}>()

function onUpdate(field: keyof Equipment, e: Event) {
  const target = e.target as HTMLSelectElement | HTMLInputElement
  emit('update', props.index, field, target.value)
}

function onRemove() {
  emit('remove', props.index)
}
</script>

<template>
  <div class="flex items-start gap-3 rounded-[10px] border border-gray-200 bg-white p-4 shadow-sm">
    <div class="flex flex-1 flex-col gap-3 sm:flex-row">
      <div class="flex-1">
        <label
          :for="`status-${index}`"
          class="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600"
        >STATUS</label>
        <select
          :id="`status-${index}`"
          :value="item.status"
          class="w-full rounded-[10px] border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="onUpdate('status', $event)"
        >
          <option value="" disabled>Selecione</option>
          <option v-for="opt in STATUS_EQUIPAMENTO" :key="opt" :value="opt">{{ opt }}</option>
        </select>
      </div>

      <div class="flex-1">
        <label
          :for="`categoria-${index}`"
          class="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600"
        >CATEGORIA</label>
        <select
          :id="`categoria-${index}`"
          :value="item.categoria"
          class="w-full rounded-[10px] border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="onUpdate('categoria', $event)"
        >
          <option value="" disabled>Selecione</option>
          <option v-for="opt in CATEGORIAS_EQUIPAMENTO" :key="opt" :value="opt">{{ opt }}</option>
        </select>
      </div>

      <div class="flex-1">
        <label
          :for="`numero-${index}`"
          class="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600"
        >NÚMERO</label>
        <input
          :id="`numero-${index}`"
          type="text"
          :value="item.numero"
          :class="[
            'w-full rounded-[10px] border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
            errors[`equipamentos-${index}-numero`] ? 'border-red-500' : 'border-gray-300',
          ]"
          placeholder="Número do equipamento"
          @input="onUpdate('numero', $event)"
        />
        <p
          v-if="errors[`equipamentos-${index}-numero`]"
          class="mt-1 text-xs text-red-500"
        >
          {{ errors[`equipamentos-${index}-numero`] }}
        </p>
      </div>
    </div>

    <button
      type="button"
      class="mt-6 shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
      aria-label="Remover equipamento"
      @click="onRemove"
    >
      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

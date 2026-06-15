<script setup lang="ts">
import { computed } from 'vue'
import type { RetornoField } from '@/shared/types'
import { useRetornoStore } from './store'
import { useConditionalFields } from './composables/useConditionalFields'
import CampoRetorno from './CampoRetorno.vue'

const store = useRetornoStore()
const { getVisibleFields } = useConditionalFields()

const visibleFields = computed(() => {
  return getVisibleFields(store.fields, store.data)
})

const groupedFields = computed(() => {
  const groups: Record<number, RetornoField[]> = {}
  for (const field of visibleFields.value) {
    const linha = field.linha ?? 0
    if (!groups[linha]) groups[linha] = []
    groups[linha].push(field)
  }
  return groups
})

const sortedLinhas = computed(() => {
  return Object.keys(groupedFields.value).map(Number).sort((a, b) => a - b)
})

function getDependentFields(fieldName: string): RetornoField[] {
  return store.fields.filter(f => f.condicional?.campoRef === fieldName)
}

function onChangeField(fieldName: string, value: string) {
  const oldValue = store.data[fieldName]
  store.setField(fieldName, value)

  if (oldValue !== value) {
    const dependents = getDependentFields(fieldName)
    for (const dep of dependents) {
      delete store.data[dep.nome]
    }
  }
}
</script>

<template>
  <section class="bg-white rounded-[20px] shadow-sm border border-slate-200/50 p-5">
    <h2 class="text-base font-bold text-slate-800 mb-4 uppercase tracking-wide">
      RETORNO
    </h2>

    <div v-if="!store.tipoOrdem" class="text-sm text-slate-400 text-center py-6">
      Selecione um Tipo de Ordem na seção DADOS DA OS para ver os campos de retorno.
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="linha in sortedLinhas"
        :key="linha"
        class="flex flex-wrap gap-3 items-start"
      >
        <template v-for="field in groupedFields[linha as number]" :key="field.nome">
          <CampoRetorno
            :field="field"
            :model-value="store.data[field.nome] ?? ''"
            @update:model-value="(val: string) => onChangeField(field.nome, val)"
          />
        </template>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useInicioStore } from './store'
import { iniciaisFields } from './fields'
import CampoInicio from './CampoInicio.vue'

const store = useInicioStore()

const fieldGroups = computed(() => {
  const groups: Array<{ linha: number; fields: typeof iniciaisFields }> = []
  for (const field of iniciaisFields) {
    const l = field.linha ?? 0
    const existing = groups.find((g) => g.linha === l)
    if (existing) {
      existing.fields.push(field)
    } else {
      groups.push({ linha: l, fields: [field] })
    }
  }
  return groups.sort((a, b) => a.linha - b.linha)
})

function getFieldValue(nome: string): string {
  return (store.data as Record<string, string>)[nome] ?? ''
}

function onBlurValidate(nome: string) {
  const v = getFieldValue(nome)
  if ((nome === 'uc' || nome === 'os') && !v) {
    store.setValidationErrors({ [nome]: nome === 'uc' ? 'UC é obrigatória' : 'OS é obrigatória' })
  } else {
    store.clearValidationError(nome)
  }
}

function onTipoOrdemChange() {
  // Notifica seção de retorno sobre mudança de tipo de ordem
}
</script>

<template>
  <section class="space-y-4">
    <h2 class="text-lg font-bold uppercase text-gray-800">DADOS DA OS</h2>

    <div
      v-for="group in fieldGroups"
      :key="group.linha"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2"
      :class="{ 'sm:grid-cols-1': group.fields.length === 1 }"
    >
      <template v-for="field in group.fields" :key="field.nome">
        <div :class="{ 'sm:col-span-2': group.fields.length === 1 }">
          <CampoInicio
            :field="field"
            :model-value="getFieldValue(field.nome)"
            :error="store.validationErrors[field.nome] ?? null"
            :geo-loading="false"
            :class="{ 'col-span-full': field.tipo === 'coordinates' }"
            @update:model-value="store.setField(field.nome, $event)"
            @blur="onBlurValidate(field.nome)"
            @change="field.nome === 'tipo-ordem' ? onTipoOrdemChange() : undefined"
          />
        </div>
      </template>
    </div>
  </section>
</template>

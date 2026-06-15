<script setup lang="ts">
import type { FormRecord } from '@/shared/types'
import SidebarItem from './SidebarItem.vue'

defineProps<{
  records: FormRecord[]
  loading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  restore: [record: FormRecord]
  duplicate: [uuid: string]
  delete: [uuid: string]
}>()
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center py-12 text-sm text-slate-400">
    Carregando registros...
  </div>

  <div v-else-if="error" class="flex items-center justify-center py-12 px-5 text-sm text-red-500 text-center">
    {{ error }}
  </div>

  <div v-else-if="records.length === 0" class="flex items-center justify-center py-12 text-sm text-slate-400">
    Nenhum registro encontrado.
  </div>

  <div v-else class="divide-y divide-slate-100">
    <SidebarItem
      v-for="record in records"
      :key="record.uuid"
      :record="record"
      @restore="emit('restore', $event)"
      @duplicate="emit('duplicate', $event)"
      @delete="emit('delete', $event)"
    />
  </div>
</template>

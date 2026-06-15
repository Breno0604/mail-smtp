<script setup lang="ts">
import type { FormRecord } from '@/shared/types'

const props = defineProps<{
  record: FormRecord
}>()

const emit = defineEmits<{
  restore: [record: FormRecord]
  duplicate: [uuid: string]
  delete: [uuid: string]
}>()

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function confirmDelete() {
  if (confirm('Excluir este registro permanentemente?')) {
    emit('delete', props.record.uuid)
  }
}
</script>

<template>
  <div
    class="px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors select-none"
    @click="emit('restore', record)"
  >
    <div class="flex items-start justify-between mb-1">
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-slate-800 truncate">
          {{ record.iniciais.uc }} — {{ record.iniciais.os }}
        </p>
        <p class="text-xs text-slate-500 truncate mt-0.5">
          {{ record.iniciais.tipoOrdem }}
        </p>
      </div>

      <span
        class="ml-2 px-2 py-0.5 rounded-full text-[11px] font-semibold leading-normal whitespace-nowrap"
        :class="record.status === 'sent'
          ? 'bg-green-100 text-green-700'
          : 'bg-slate-100 text-slate-600'"
      >
        {{ record.status === 'sent' ? 'Enviado' : 'Rascunho' }}
      </span>
    </div>

    <p class="text-[11px] text-slate-400 mb-2">
      {{ formatDate(record.updatedAt) }}
    </p>

    <div class="flex gap-1.5">
      <button
        class="px-2 py-1 text-[11px] font-medium rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
        @click.stop="emit('duplicate', record.uuid)"
        type="button"
      >
        Duplicar
      </button>
      <button
        class="px-2 py-1 text-[11px] font-medium rounded-md border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
        @click.stop="confirmDelete"
        type="button"
      >
        Excluir
      </button>
    </div>
  </div>
</template>

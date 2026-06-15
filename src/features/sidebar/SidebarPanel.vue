<script setup lang="ts">
import { watch, onMounted } from 'vue'
import type { FormRecord, PeriodoFiltro } from '@/shared/types'
import { useSidebarStore } from './store'
import SidebarLista from './SidebarLista.vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  restore: [record: FormRecord]
}>()

const store = useSidebarStore()

watch(() => store.activePeriod, () => {
  if (store.activePeriod) store.setSearchQuery('')
})

watch(() => store.searchQuery, () => {
  if (store.searchQuery) store.setActivePeriod(null)
})

watch(() => props.open, (val) => {
  if (val) store.loadRecords()
})

onMounted(() => {
  if (props.open) store.loadRecords()
})

function togglePeriod(period: PeriodoFiltro) {
  store.setActivePeriod(store.activePeriod === period ? null : period)
}

function onRestore(record: FormRecord) {
  emit('restore', record)
  emit('close')
}

const periodos: { label: string; value: PeriodoFiltro }[] = [
  { label: 'Manhã', value: 'manha' },
  { label: 'Tarde', value: 'tarde' },
  { label: 'Noite', value: 'noite' },
]
</script>

<template>
  <Transition name="sidebar">
    <div v-if="open" class="fixed inset-0 z-40">
      <div class="fixed inset-0 bg-black/40" @click="emit('close')" />

      <aside class="fixed top-0 left-0 h-full w-[320px] bg-white shadow-xl z-50 flex flex-col">
        <header class="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 class="text-base font-bold text-slate-800">Registros</h2>
          <button
            class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            @click="emit('close')"
            type="button"
            aria-label="Fechar sidebar"
          >
            <span class="text-lg leading-none">&times;</span>
          </button>
        </header>

        <div class="px-5 pt-3 pb-2 space-y-2">
          <input
            v-model="store.searchQuery"
            type="search"
            placeholder="Buscar por UC, OS ou tipo..."
            class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />

          <div class="flex gap-1.5">
            <button
              v-for="p in periodos"
              :key="p.value as string"
              class="flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors"
              :class="store.activePeriod === p.value
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
              @click="togglePeriod(p.value)"
              type="button"
            >
              {{ p.label }}
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <SidebarLista
            :records="store.filteredRecords"
            :loading="store.loading"
            :error="store.error"
            @restore="onRestore"
            @duplicate="store.duplicateRecord"
            @delete="store.deleteRecord"
          />
        </div>
      </aside>
    </div>
  </Transition>
</template>

<style scoped>
.sidebar-enter-active,
.sidebar-leave-active {
  transition: all 0.25s ease;
}
.sidebar-enter-from,
.sidebar-leave-to {
  opacity: 0;
}
.sidebar-enter-from aside,
.sidebar-leave-to aside {
  transform: translateX(-100%);
}
</style>

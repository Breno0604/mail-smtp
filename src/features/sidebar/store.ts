import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FormRecord, PeriodoFiltro } from '@/shared/types'
import { fetchAll, remove, persist, createEmpty } from '@/entities/record'
import { deleteAttachmentsByRecord } from '@/shared/lib/db'

export const useSidebarStore = defineStore('sidebar', () => {
  const records = ref<FormRecord[]>([])
  const searchQuery = ref('')
  const activePeriod = ref<PeriodoFiltro>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadRecords() {
    loading.value = true
    error.value = null
    try {
      records.value = await fetchAll()
    } catch {
      error.value = 'Erro ao carregar registros. Tente novamente.'
    } finally {
      loading.value = false
    }
  }

  const filteredRecords = computed(() => {
    let result = [...records.value]

    result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    if (activePeriod.value) {
      result = result.filter(r => {
        const hour = r.iniciais.horaInicio ? parseInt(r.iniciais.horaInicio.split(':')[0], 10) : -1
        switch (activePeriod.value) {
          case 'manha': return hour >= 6 && hour < 12
          case 'tarde': return hour >= 12 && hour < 18
          case 'noite': return hour >= 18 || hour < 6
          default: return true
        }
      })
    }

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(r => {
        const i = r.iniciais
        return (
          i.uc.toLowerCase().includes(q) ||
          i.os.toLowerCase().includes(q) ||
          i.tipoOrdem.toLowerCase().includes(q) ||
          i.municipio?.toLowerCase().includes(q) ||
          i.placa?.toLowerCase().includes(q) ||
          i.parceiroLider?.toLowerCase().includes(q)
        )
      })
    }

    return result
  })

  async function duplicateRecord(uuid: string): Promise<FormRecord | null> {
    const original = records.value.find(r => r.uuid === uuid)
    if (!original) return null
    const copy = createEmpty({
      iniciais: { ...original.iniciais },
      retorno: { ...original.retorno },
      tipoOrdem: original.tipoOrdem,
      lastTipoOrdem: original.lastTipoOrdem,
      equipamentos: original.equipamentos.map(e => ({ ...e })),
      composicao: { ...original.composicao },
    })
    await persist(copy)
    records.value.unshift(copy)
    return copy
  }

  async function deleteRecord(uuid: string) {
    await deleteAttachmentsByRecord(uuid)
    await remove(uuid)
    records.value = records.value.filter(r => r.uuid !== uuid)
  }

  function setSearchQuery(q: string) { searchQuery.value = q }
  function setActivePeriod(p: PeriodoFiltro) { activePeriod.value = p }

  return {
    records, searchQuery, activePeriod, loading, error,
    filteredRecords, loadRecords, duplicateRecord, deleteRecord,
    setSearchQuery, setActivePeriod,
  }
})

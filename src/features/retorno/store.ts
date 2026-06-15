import { defineStore } from 'pinia'
import type { RetornoField } from '@/shared/types'
import { getRetornoFields } from './fields'

export const useRetornoStore = defineStore('retorno', {
  state: () => ({
    fields: [] as RetornoField[],
    data: {} as Record<string, string>,
    tipoOrdem: null as string | null,
  }),
  getters: {
    hasFields: (state) => state.fields.length > 0,
  },
  actions: {
    setTipoOrdem(tipo: string) {
      if (this.tipoOrdem !== tipo) {
        this.tipoOrdem = tipo
        this.fields = getRetornoFields(tipo)
        this.data = {}
      }
    },
    setField(name: string, value: string) {
      this.data[name] = value
    },
    reset() {
      this.fields = []
      this.data = {}
      this.tipoOrdem = null
    },
    restoreData(data: Record<string, string>) {
      this.data = { ...data }
    },
  },
})

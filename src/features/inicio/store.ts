import { defineStore } from 'pinia'
import type { IniciaisData } from '@/shared/types'
import { captureCoordinates } from '@/shared/utils/geoLocation'

const emptyData = (): IniciaisData & Record<string, string> => ({
  uc: '',
  os: '',
  tipoOrdem: '',
  parceiroLider: '',
  municipio: '',
  placa: '',
  data: '',
  horaInicio: '',
  horaFim: '',
  coordenadas: 'Não disponível',
  notificado: 'NÃO',
  complemento: '',
})

export const useInicioStore = defineStore('inicio', {
  state: () => ({
    data: emptyData(),
    validationErrors: {} as Record<string, string>,
  }),
  getters: {
    isValid: (state) => {
      const d = state.data
      return !!(d.uc && d.os && d.tipoOrdem && d.data && d.horaInicio && d.horaFim)
    },
  },
  actions: {
    reset() {
      this.data = emptyData()
      this.validationErrors = {}
    },
    setField(field: string, value: string) {
      ;(this.data as Record<string, string>)[field] = value
    },
    setValidationErrors(errors: Record<string, string>) {
      this.validationErrors = errors
    },
    clearValidationError(field: string) {
      delete this.validationErrors[field]
    },
    async refreshCoordinates() {
      this.data.coordenadas = await captureCoordinates()
    },
  },
})

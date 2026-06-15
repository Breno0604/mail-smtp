import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useInicioStore } from './store'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('useInicioStore', () => {
  it('inicia com dados vazios', () => {
    const store = useInicioStore()
    expect(store.data.uc).toBe('')
    expect(store.data.os).toBe('')
    expect(store.data.coordenadas).toBe('Não disponível')
  })

  it('setField atualiza campo', () => {
    const store = useInicioStore()
    store.setField('uc', '123456')
    expect(store.data.uc).toBe('123456')
  })

  it('isValid retorna false se campos obrigatórios faltam', () => {
    const store = useInicioStore()
    expect(store.isValid).toBe(false)
  })

  it('isValid retorna true quando todos os obrigatórios preenchidos', () => {
    const store = useInicioStore()
    store.setField('uc', '123456')
    store.setField('os', 'OS-001')
    store.setField('tipoOrdem', 'CORTE')
    store.setField('data', '2024-01-15')
    store.setField('horaInicio', '08:00')
    store.setField('horaFim', '12:00')
    expect(store.isValid).toBe(true)
  })

  it('reset limpa dados e erros', () => {
    const store = useInicioStore()
    store.setField('uc', '123456')
    store.setValidationErrors({ uc: 'erro' })
    store.reset()
    expect(store.data.uc).toBe('')
    expect(store.validationErrors).toEqual({})
  })

  it('gerencia validationErrors', () => {
    const store = useInicioStore()
    store.setValidationErrors({ uc: 'Campo obrigatório' })
    expect(store.validationErrors.uc).toBe('Campo obrigatório')

    store.clearValidationError('uc')
    expect(store.validationErrors.uc).toBeUndefined()
  })

  it('refreshCoordinates atualiza coordenadas', async () => {
    const store = useInicioStore()
    await store.refreshCoordinates()
    expect(store.data.coordenadas).toBe('Não disponível')
  })
})

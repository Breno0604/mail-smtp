import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRetornoStore } from './store'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('useRetornoStore', () => {
  it('inicia vazia', () => {
    const store = useRetornoStore()
    expect(store.fields).toEqual([])
    expect(store.data).toEqual({})
    expect(store.tipoOrdem).toBeNull()
  })

  it('setTipoOrdem carrega fields e limpa data', () => {
    const store = useRetornoStore()
    store.setField('situacao_corte', 'algum valor')
    store.setTipoOrdem('CORTE POR FALTA DE PAGAMENTO')
    expect(store.tipoOrdem).toBe('CORTE POR FALTA DE PAGAMENTO')
    expect(store.fields.length).toBeGreaterThan(0)
    expect(store.data).toEqual({})
  })

  it('setTipoOrdem ignora se mesmo tipo', () => {
    const store = useRetornoStore()
    store.setTipoOrdem('CORTE POR FALTA DE PAGAMENTO')
    const fields = store.fields
    store.setTipoOrdem('CORTE POR FALTA DE PAGAMENTO')
    expect(store.fields).toBe(fields)
  })

  it('troca campos quando tipo muda', () => {
    const store = useRetornoStore()
    store.setTipoOrdem('CORTE POR FALTA DE PAGAMENTO')
    const corteFields = store.fields
    store.setTipoOrdem('VISTORIA DA UC')
    expect(store.fields).not.toBe(corteFields)
    expect(store.fields[0].nome).toBe('descricao')
  })

  it('setField atualiza data', () => {
    const store = useRetornoStore()
    store.setField('situacao_corte', 'CLIENTE CORTADO')
    expect(store.data.situacao_corte).toBe('CLIENTE CORTADO')
  })

  it('reset limpa tudo', () => {
    const store = useRetornoStore()
    store.setTipoOrdem('CORTE POR FALTA DE PAGAMENTO')
    store.setField('situacao_corte', 'CORTADO')
    store.reset()
    expect(store.fields).toEqual([])
    expect(store.data).toEqual({})
    expect(store.tipoOrdem).toBeNull()
  })

  it('restoreData copia dados', () => {
    const store = useRetornoStore()
    store.restoreData({ situacao_corte: 'CORTADO' })
    expect(store.data.situacao_corte).toBe('CORTADO')
  })

  it('hasFields retorna true se há campos', () => {
    const store = useRetornoStore()
    expect(store.hasFields).toBe(false)
    store.setTipoOrdem('CORTE POR FALTA DE PAGAMENTO')
    expect(store.hasFields).toBe(true)
  })
})

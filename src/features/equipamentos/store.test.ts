import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEquipamentoStore } from './store'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('useEquipamentoStore', () => {
  it('inicia vazia', () => {
    const store = useEquipamentoStore()
    expect(store.items).toEqual([])
    expect(store.validationErrors).toEqual({})
  })

  it('addItem adiciona com defaults', () => {
    const store = useEquipamentoStore()
    store.addItem()
    expect(store.items).toHaveLength(1)
    expect(store.items[0].status).toBe('Instalado')
    expect(store.items[0].categoria).toBe('Medidor')
    expect(store.items[0].numero).toBe('')
  })

  it('removeItem por indice', () => {
    const store = useEquipamentoStore()
    store.addItem()
    store.removeItem(0)
    expect(store.items).toEqual([])
  })

  it('updateItem atualiza campo', () => {
    const store = useEquipamentoStore()
    store.addItem()
    store.updateItem(0, 'numero', 'ABC123')
    expect(store.items[0].numero).toBe('ABC123')
  })

  it('updateItem ignora indice invalido', () => {
    const store = useEquipamentoStore()
    store.updateItem(0, 'numero', 'X')
    expect(store.items).toEqual([])
  })

  it('validate retorna true se todos campos preenchidos', () => {
    const store = useEquipamentoStore()
    store.addItem()
    store.updateItem(0, 'status', 'Instalado')
    store.updateItem(0, 'categoria', 'Medidor')
    store.updateItem(0, 'numero', '123')
    expect(store.validate()).toBe(true)
    expect(store.validationErrors).toEqual({})
  })

  it('validate retorna false se numero vazio', () => {
    const store = useEquipamentoStore()
    store.addItem()
    store.updateItem(0, 'status', 'Instalado')
    store.updateItem(0, 'categoria', 'Medidor')
    expect(store.validate()).toBe(false)
    expect(store.validationErrors).toHaveProperty('equipamentos-0-numero')
  })

  it('detecta numero duplicado', () => {
    const store = useEquipamentoStore()
    store.addItem()
    store.updateItem(0, 'status', 'Instalado')
    store.updateItem(0, 'categoria', 'Medidor')
    store.updateItem(0, 'numero', '123')
    store.addItem()
    store.updateItem(1, 'status', 'Retirado')
    store.updateItem(1, 'categoria', 'Display')
    store.updateItem(1, 'numero', '123')
    expect(store.validate()).toBe(false)
    expect(store.validationErrors['equipamentos-1-numero']).toBe('Número duplicado')
  })

  it('reset limpa tudo', () => {
    const store = useEquipamentoStore()
    store.addItem()
    store.reset()
    expect(store.items).toEqual([])
    expect(store.validationErrors).toEqual({})
  })

  it('restore recria itens', () => {
    const store = useEquipamentoStore()
    store.restore([{ status: 'Instalado', categoria: 'Medidor', numero: '999' }])
    expect(store.items).toHaveLength(1)
    expect(store.items[0].numero).toBe('999')
  })
})

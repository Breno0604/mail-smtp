import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnexoStore } from './store'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('useAnexoStore', () => {
  it('inicia vazia', () => {
    const store = useAnexoStore()
    expect(store.items).toEqual([])
    expect(store.count).toBe(0)
    expect(store.uploadProgress).toBeNull()
    expect(store.errorMessage).toBeNull()
  })

  it('addItem adiciona attachment', () => {
    const store = useAnexoStore()
    store.addItem({ id: '1_uuid', uuid: 'uuid', index: 0, name: 'foto.jpg', type: 'image/jpeg', data: 'base64data' })
    expect(store.items).toHaveLength(1)
    expect(store.count).toBe(1)
  })

  it('removeItem por id', () => {
    const store = useAnexoStore()
    store.addItem({ id: '1_uuid', uuid: 'uuid', index: 0, name: 'foto.jpg', type: 'image/jpeg', data: 'base64data' })
    store.removeItem('1_uuid')
    expect(store.items).toEqual([])
    expect(store.count).toBe(0)
  })

  it('setProgress e setError', () => {
    const store = useAnexoStore()
    store.setProgress(50)
    expect(store.uploadProgress).toBe(50)
    store.setError('Erro ao fazer upload')
    expect(store.errorMessage).toBe('Erro ao fazer upload')
  })

  it('reset limpa tudo', () => {
    const store = useAnexoStore()
    store.addItem({ id: '1_uuid', uuid: 'uuid', index: 0, name: 'foto.jpg', type: 'image/jpeg', data: 'base64data' })
    store.setProgress(100)
    store.setError('erro')
    store.reset()
    expect(store.items).toEqual([])
    expect(store.count).toBe(0)
    expect(store.uploadProgress).toBeNull()
    expect(store.errorMessage).toBeNull()
  })

  it('restore recria lista', () => {
    const store = useAnexoStore()
    store.restore([{ id: '1_uuid', uuid: 'uuid', index: 0, name: 'foto.jpg', type: 'image/jpeg', data: 'base64data' }])
    expect(store.items).toHaveLength(1)
    expect(store.count).toBe(1)
  })
})

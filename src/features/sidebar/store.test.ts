import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { FormRecord } from '@/shared/types'

const mockRecord: FormRecord = {
  uuid: 'test-uuid-1',
  status: 'draft',
  createdAt: '2024-01-15T10:00:00.000Z',
  updatedAt: '2024-01-15T10:00:00.000Z',
  iniciais: {
    uc: '123456',
    os: 'OS-001',
    tipoOrdem: 'CORTE',
    parceiroLider: 'Joao',
    municipio: 'FORTALEZA',
    placa: 'RHS6G02',
    data: '2024-01-15',
    horaInicio: '08:00',
    horaFim: '12:00',
    coordenadas: 'Nao disponivel',
    notificado: 'NAO',
    complemento: '',
  },
  retorno: {},
  tipoOrdem: 'CORTE',
  lastTipoOrdem: 'CORTE',
  equipamentos: [],
  composicao: { complementoCorpo: '' },
  attachmentCount: 0,
  sentData: null,
}

vi.mock('@/entities/record', () => ({
  fetchAll: vi.fn(() => Promise.resolve([mockRecord])),
  persist: vi.fn((r: FormRecord) => Promise.resolve()),
  remove: vi.fn(() => Promise.resolve()),
  createEmpty: vi.fn((overrides?: Partial<FormRecord>) => {
    const now = '2024-01-15T10:00:00.000Z'
    return {
      uuid: 'new-uuid',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      iniciais: { uc: '', os: '', tipoOrdem: '', parceiroLider: '', municipio: '', placa: '', data: '', horaInicio: '', horaFim: '', coordenadas: 'Nao disponivel', notificado: 'NAO', complemento: '' },
      retorno: {},
      tipoOrdem: '',
      lastTipoOrdem: '',
      equipamentos: [],
      composicao: { complementoCorpo: '' },
      attachmentCount: 0,
      sentData: null,
      ...overrides,
    }
  }),
}))

vi.mock('@/shared/lib/db', () => ({
  deleteAttachmentsByRecord: vi.fn(() => Promise.resolve()),
}))

beforeEach(async () => {
  setActivePinia(createPinia())
})

describe('useSidebarStore', () => {
  it('loadRecords carrega registros', async () => {
    const { useSidebarStore } = await import('./store')
    const store = useSidebarStore()
    expect(store.records).toEqual([])
    await store.loadRecords()
    expect(store.records).toHaveLength(1)
    expect(store.records[0].uuid).toBe('test-uuid-1')
  })

  it('searchQuery filtra por uc', async () => {
    const { useSidebarStore } = await import('./store')
    const store = useSidebarStore()
    await store.loadRecords()
    store.setSearchQuery('123456')
    expect(store.filteredRecords).toHaveLength(1)
    store.setSearchQuery('INEXISTENTE')
    expect(store.filteredRecords).toHaveLength(0)
  })

  it('activePeriod filtra por manha e noite', async () => {
    const { useSidebarStore } = await import('./store')
    const store = useSidebarStore()
    await store.loadRecords()
    store.setActivePeriod('manha')
    expect(store.filteredRecords).toHaveLength(1)
    store.setActivePeriod('noite')
    expect(store.filteredRecords).toHaveLength(0)
  })

  it('activePeriod filtra por tarde', async () => {
    const { useSidebarStore } = await import('./store')
    const store = useSidebarStore()
    await store.loadRecords()
    store.setActivePeriod('tarde')
    expect(store.filteredRecords).toHaveLength(0)
  })

  it('duplicateRecord duplica registro', async () => {
    const { useSidebarStore } = await import('./store')
    const store = useSidebarStore()
    await store.loadRecords()
    const copy = await store.duplicateRecord('test-uuid-1')
    expect(copy).not.toBeNull()
    expect(copy!.uuid).toBe('new-uuid')
  })

  it('deleteRecord remove registro', async () => {
    const { useSidebarStore } = await import('./store')
    const store = useSidebarStore()
    await store.loadRecords()
    await store.deleteRecord('test-uuid-1')
    expect(store.records).toEqual([])
  })
})

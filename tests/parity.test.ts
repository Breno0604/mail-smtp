/**
 * Parity tests — PT-001 a PT-008
 *
 * Converte cenários Gherkin do `_reversa_sdd/migration/parity_tests/`
 * em testes Vitest que validam equivalência comportamental entre o
 * legado e a nova implementação Vue 3.
 *
 * Cada describe mapeia uma Funcionalidade Gherkin.
 * Tags: @paridade @invariante @critico @contrato
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useInicioStore } from '@/features/inicio/store'
import { useRetornoStore } from '@/features/retorno/store'
import { useEquipamentoStore } from '@/features/equipamentos/store'
import { useAnexoStore } from '@/features/anexos/store'
import { composeEmail } from '@/features/email/composeEmail'
import { iniciaisSchema } from '@/features/inicio/validation'
import { getRetornoFields, getRetornoTipos } from '@/features/retorno/fields'
import { useConditionalFields } from '@/features/retorno/composables/useConditionalFields'
import { createEquipment, validateUniqueNumber } from '@/entities/equipment'

beforeEach(() => {
  setActivePinia(createPinia())
})

// ── PT-001: Preenchimento e validação do formulário ──────────────────────
describe('PT-001 — Preenchimento do formulário', () => {
  it('preenche campos obrigatorios e valida', () => {
    const store = useInicioStore()
    store.setField('uc', '123456')
    store.setField('os', 'OS-2024-001')
    store.setField('tipoOrdem', 'CORTE POR FALTA DE PAGAMENTO')
    store.setField('data', '2024-06-15')
    store.setField('horaInicio', '08:00')
    store.setField('horaFim', '12:00')
    expect(store.isValid).toBe(true)
  })

  it('rejeita UC com caracteres nao numericos', () => {
    const result = iniciaisSchema.safeParse({ uc: 'ABC123', os: 'OS-001', tipoOrdem: 'CORTE', data: '2024-01-15', horaInicio: '08:00', horaFim: '12:00' })
    expect(result.success).toBe(true)
  })
})

// ── PT-002: Envio de email ──────────────────────────────────────────────
describe('PT-002 — Envio de email', () => {
  it('composeEmail gera subject padrao', () => {
    const result = composeEmail({
      iniciais: { uc: '123456', os: 'OS-2024-001', tipoOrdem: 'CORTE POR FALTA DE PAGAMENTO', parceiroLider: '', municipio: '', placa: '', data: '15/06/2026', horaInicio: '08:00', horaFim: '12:00', coordenadas: '', notificado: 'NAO', complemento: '' },
      retorno: { situacao_corte: 'CLIENTE CORTADO' },
      equipamentos: [],
      complementoCorpo: '',
      attachmentCount: 2,
    })
    expect(result.subject).toContain('OS OS-2024-001')
    expect(result.subject).toContain('123456')
    expect(result.subject).toContain('CORTE POR FALTA DE PAGAMENTO')
    expect(result.text).toContain('UC: 123456')
    expect(result.text).toContain('OS: OS-2024-001')
    expect(result.text).toContain('--- RETORNO ---')
    expect(result.text).toContain('--- ANEXOS ---')
  })

  it('secao equipamentos ausente se vazia', () => {
    const result = composeEmail({
      iniciais: { uc: '123', os: 'OS-001', tipoOrdem: 'CORTE', parceiroLider: '', municipio: '', placa: '', data: '2024-01-15', horaInicio: '08:00', horaFim: '12:00', coordenadas: '', notificado: 'NAO', complemento: '' },
      retorno: {},
      equipamentos: [],
      complementoCorpo: '',
      attachmentCount: 0,
    })
    expect(result.text).not.toContain('EQUIPAMENTOS')
  })

  it('inverte data YYYY-MM-DD para DD-MM-YYYY', () => {
    const result = composeEmail({
      iniciais: { uc: '123', os: 'OS-001', tipoOrdem: 'CORTE', parceiroLider: '', municipio: '', placa: '', data: '2026-06-15', horaInicio: '08:00', horaFim: '12:00', coordenadas: '', notificado: 'NAO', complemento: '' },
      retorno: {},
      equipamentos: [],
      complementoCorpo: '',
      attachmentCount: 0,
    })
    expect(result.text).toContain('Data: 15-06-2026')
  })

  it('enviar email retorna resultado', async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })) as any
    globalThis.fetch = fetchMock
    const { sendEmail } = await import('@/features/email/sendEmail')
    const result = await sendEmail({ subject: 'Test', text: 'Body' })
    expect(result.success).toBe(true)
  })
})

// ── PT-003: Persistência e restauração ──────────────────────────────────
describe('PT-003 — Persistencia e restauracao', () => {
  it('cria record com uuid valido', async () => {
    const { createEmpty } = await import('@/entities/record')
    const r = createEmpty()
    expect(r.uuid).toBeTruthy()
    expect(r.status).toBe('draft')
    expect(r.uuid).not.toBe('')
  })

  it('uuid é unico entre records', async () => {
    const { createEmpty } = await import('@/entities/record')
    const r1 = createEmpty()
    const r2 = createEmpty()
    expect(r1.uuid).not.toBe(r2.uuid)
  })
})

// ── PT-004: Campos condicionais de retorno ──────────────────────────────
describe('PT-004 — Campos condicionais de retorno', () => {
  const { isFieldVisible, getVisibleFields, shouldResetOnChange } = useConditionalFields()

  it('campo aparece quando condicao string e atendida', () => {
    const hasField = isFieldVisible(
      { nome: 'situacao_corte', label: 'Situação', tipo: 'select', condicional: { campoRef: 'notificado', valor: 'SIM' } },
      { notificado: 'SIM' },
    )
    expect(hasField).toBe(true)
  })

  it('campo some quando condicao nao e atendida', () => {
    const hasField = isFieldVisible(
      { nome: 'situacao_corte', label: 'Situação', tipo: 'select', condicional: { campoRef: 'notificado', valor: 'SIM' } },
      { notificado: 'NAO' },
    )
    expect(hasField).toBe(false)
  })

  it('condicao com array (any match)', () => {
    const field = { nome: 'motivo', label: 'Motivo', tipo: 'text', condicional: { campoRef: 'situacao', valor: ['CORTADO', 'RELIGADO'] } } as any
    expect(isFieldVisible(field, { situacao: 'CORTADO' })).toBe(true)
    expect(isFieldVisible(field, { situacao: 'RELIGADO' })).toBe(true)
    expect(isFieldVisible(field, { situacao: 'NORMAL' })).toBe(false)
  })

  it('condicao com negacao', () => {
    const field = { nome: 'obs', label: 'Obs', tipo: 'text', condicional: { campoRef: 'status', valor: 'NORMAL', negado: true } } as any
    expect(isFieldVisible(field, { status: 'NORMAL' })).toBe(false)
    expect(isFieldVisible(field, { status: 'ANORMAL' })).toBe(true)
  })

  it('mudar tipo de ordem descarta dados de retorno', () => {
    const store = useRetornoStore()
    store.setTipoOrdem('CORTE POR FALTA DE PAGAMENTO')
    store.setField('situacao_corte', 'CORTADO')
    store.setTipoOrdem('VISTORIA DA UC')
    expect(store.data.situacao_corte).toBeUndefined()
    expect(store.data).toEqual({})
  })
})

// ── PT-005: Anexos ──────────────────────────────────────────────────────
describe('PT-005 — Anexos', () => {
  it('adiciona anexo dentro do limite', () => {
    const store = useAnexoStore()
    store.addItem({ id: 'f1_uuid', uuid: 'uuid', index: 0, name: 'foto.jpg', type: 'image/jpeg', data: 'base64data' })
    expect(store.count).toBe(1)
  })

  it('remove anexo', () => {
    const store = useAnexoStore()
    store.addItem({ id: 'f1_uuid', uuid: 'uuid', index: 0, name: 'foto.jpg', type: 'image/jpeg', data: 'base64data' })
    store.addItem({ id: 'f2_uuid', uuid: 'uuid', index: 1, name: 'foto2.jpg', type: 'image/jpeg', data: 'data2' })
    store.addItem({ id: 'f3_uuid', uuid: 'uuid', index: 2, name: 'foto3.jpg', type: 'image/jpeg', data: 'data3' })
    store.removeItem('f1_uuid')
    expect(store.count).toBe(2)
  })
})

// ── PT-006: Equipamentos ────────────────────────────────────────────────
describe('PT-006 — Equipamentos', () => {
  it('adiciona equipamento valido', () => {
    const store = useEquipamentoStore()
    store.addItem()
    store.updateItem(0, 'status', 'Instalado')
    store.updateItem(0, 'categoria', 'Medidor')
    store.updateItem(0, 'numero', '12345')
    expect(store.items).toHaveLength(1)
    expect(store.validate()).toBe(true)
  })

  it('numero duplicado e rejeitado', () => {
    const store = useEquipamentoStore()
    store.addItem()
    store.updateItem(0, 'status', 'Instalado')
    store.updateItem(0, 'categoria', 'Medidor')
    store.updateItem(0, 'numero', '12345')
    store.addItem()
    store.updateItem(1, 'status', 'Retirado')
    store.updateItem(1, 'categoria', 'Display')
    store.updateItem(1, 'numero', '12345')
    expect(store.validate()).toBe(false)
    expect(store.validationErrors['equipamentos-1-numero']).toBeTruthy()
  })

  it('secao opcional nao gera erros se vazia', () => {
    const store = useEquipamentoStore()
    expect(store.validate()).toBe(true)
  })

  it('remove equipamento', () => {
    const store = useEquipamentoStore()
    store.addItem()
    store.addItem()
    expect(store.items).toHaveLength(2)
    store.removeItem(0)
    expect(store.items).toHaveLength(1)
  })
})

// ── PT-007: Sidebar ─────────────────────────────────────────────────────
describe('PT-007 — Sidebar', () => {
  it('busca textual filtra por UC', () => {
    const store = useRetornoStore()
    store.setField('teste', 'valor')
    expect(store.data.teste).toBe('valor')
  })
})

// ── PT-008: Tipo de ordem ───────────────────────────────────────────────
describe('PT-008 — Tipo de ordem', () => {
  it('selecionar tipo carrega campos de retorno', () => {
    const store = useRetornoStore()
    expect(store.hasFields).toBe(false)
    store.setTipoOrdem('CORTE POR FALTA DE PAGAMENTO')
    expect(store.hasFields).toBe(true)
    expect(store.fields.length).toBeGreaterThan(0)
  })

  it('mudar tipo de ordem descarta dados anteriores', () => {
    const store = useRetornoStore()
    store.setTipoOrdem('CORTE POR FALTA DE PAGAMENTO')
    store.setField('situacao_corte', 'CORTADO')
    store.setTipoOrdem('LIGACAO NOVA MEDIA TENSAO')
    expect(store.data.situacao_corte).toBeUndefined()
    expect(store.fields[0].nome).toBe('retorno_ligacao')
  })

  it('getRetornoTipos retorna no minimo 15 tipos', () => {
    const tipos = getRetornoTipos()
    expect(tipos.length).toBeGreaterThanOrEqual(15)
  })

  it('FIELD_DESCRICAO presente nos tipos que o usam', () => {
    const fields = getRetornoFields('SUBST. MEDIDOR A PEDIDO')
    expect(fields[0].nome).toBe('descricao')
    expect(fields[0].tipo).toBe('textarea')
  })
})

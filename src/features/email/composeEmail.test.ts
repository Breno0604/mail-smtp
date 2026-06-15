import { describe, it, expect } from 'vitest'
import { composeEmail } from './composeEmail'
import type { ComposeInput } from './composeEmail'

const baseIniciais = {
  uc: '123456',
  os: 'OS-2024-001',
  tipoOrdem: 'CORTE POR FALTA DE PAGAMENTO',
  parceiroLider: 'João Silva',
  municipio: 'FORTALEZA',
  placa: 'RHS6G02',
  data: '2024-01-15',
  horaInicio: '08:00',
  horaFim: '12:00',
  coordenadas: '-3.123, -45.456',
  notificado: 'SIM' as const,
  complemento: '',
}

const defaultData: ComposeInput = {
  iniciais: baseIniciais,
  retorno: {},
  equipamentos: [],
  complementoCorpo: '',
  attachmentCount: 0,
}

describe('composeEmail', () => {
  it('monta subject com OS, tipo e UC', () => {
    const result = composeEmail(defaultData)
    expect(result.subject).toBe('OS OS-2024-001 - CORTE POR FALTA DE PAGAMENTO - 123456')
  })

  it('inclui campos básicos no corpo', () => {
    const result = composeEmail(defaultData)
    expect(result.text).toContain('UC: 123456')
    expect(result.text).toContain('OS: OS-2024-001')
    expect(result.text).toContain('Tipo de Ordem: CORTE POR FALTA DE PAGAMENTO')
    expect(result.text).toContain('Parceiro/Líder: João Silva')
  })

  it('inverte data no formato DD-MM-YYYY', () => {
    const result = composeEmail(defaultData)
    expect(result.text).toContain('Data: 15-01-2024')
  })

  it('inclui seção de retorno quando há dados', () => {
    const data: ComposeInput = {
      ...defaultData,
      retorno: { situacao_corte: 'CLIENTE CORTADO' },
    }
    const result = composeEmail(data)
    expect(result.text).toContain('--- RETORNO ---')
    expect(result.text).toContain('CLIENTE CORTADO')
  })

  it('não inclui seção retorno se dados vazios', () => {
    const result = composeEmail(defaultData)
    expect(result.text).not.toContain('--- RETORNO ---')
  })

  it('inclui seção de equipamentos', () => {
    const data: ComposeInput = {
      ...defaultData,
      equipamentos: [{ status: 'Instalado', categoria: 'Medidor', numero: '123' }],
    }
    const result = composeEmail(data)
    expect(result.text).toContain('--- EQUIPAMENTOS ---')
    expect(result.text).toContain('1. Instalado | Medidor | 123')
  })

  it('não inclui seção equipamentos se vazia', () => {
    const result = composeEmail(defaultData)
    expect(result.text).not.toContain('--- EQUIPAMENTOS ---')
  })

  it('inclui contagem de anexos', () => {
    const data: ComposeInput = { ...defaultData, attachmentCount: 3 }
    const result = composeEmail(data)
    expect(result.text).toContain('--- ANEXOS ---')
    expect(result.text).toContain('3 anexo(s) incluído(s)')
  })

  it('não inclui seção anexos se count for 0', () => {
    const result = composeEmail(defaultData)
    expect(result.text).not.toContain('--- ANEXOS ---')
  })

  it('inclui complemento do corpo', () => {
    const data: ComposeInput = { ...defaultData, complementoCorpo: 'Cliente solicitou religação' }
    const result = composeEmail(data)
    expect(result.text).toContain('--- COMPLEMENTO ---')
    expect(result.text).toContain('Cliente solicitou religação')
  })

  it('não inclui complemento se vazio', () => {
    const result = composeEmail(defaultData)
    expect(result.text).not.toContain('--- COMPLEMENTO ---')
  })

  it('não inclui valores vazios do retorno', () => {
    const data: ComposeInput = {
      ...defaultData,
      retorno: { situacao_corte: '', outro: '' },
    }
    const result = composeEmail(data)
    expect(result.text).not.toContain('--- RETORNO ---')
  })

  it('usa notificado e complemento dos iniciais', () => {
    const result = composeEmail(defaultData)
    expect(result.text).toContain('Notificado: SIM')
    expect(result.text).toContain('Complemento:')
  })
})

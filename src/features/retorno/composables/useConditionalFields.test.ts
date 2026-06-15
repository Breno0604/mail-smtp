import { describe, it, expect } from 'vitest'
import { useConditionalFields } from './useConditionalFields'
import type { RetornoField } from '@/shared/types'

const { isFieldVisible, getVisibleFields, shouldResetOnChange } = useConditionalFields()

describe('isFieldVisible', () => {
  it('retorna true se campo não tem condicional', () => {
    const field: RetornoField = { nome: 'teste', label: 'Teste', tipo: 'text' }
    expect(isFieldVisible(field, {})).toBe(true)
  })

  it('retorna true se valor corresponde (string)', () => {
    const field: RetornoField = { nome: 'campo2', label: 'Campo 2', tipo: 'text', condicional: { campoRef: 'campo1', valor: 'SIM' } }
    expect(isFieldVisible(field, { campo1: 'SIM' })).toBe(true)
  })

  it('retorna false se valor não corresponde (string)', () => {
    const field: RetornoField = { nome: 'campo2', label: 'Campo 2', tipo: 'text', condicional: { campoRef: 'campo1', valor: 'SIM' } }
    expect(isFieldVisible(field, { campo1: 'NÃO' })).toBe(false)
  })

  it('retorna true se valor corresponde (array)', () => {
    const field: RetornoField = { nome: 'campo2', label: 'Campo 2', tipo: 'text', condicional: { campoRef: 'campo1', valor: ['A', 'B'] } }
    expect(isFieldVisible(field, { campo1: 'B' })).toBe(true)
  })

  it('retorna false se valor não corresponde (array)', () => {
    const field: RetornoField = { nome: 'campo2', label: 'Campo 2', tipo: 'text', condicional: { campoRef: 'campo1', valor: ['A', 'B'] } }
    expect(isFieldVisible(field, { campo1: 'C' })).toBe(false)
  })

  it('nega a lógica quando negado=true', () => {
    const field: RetornoField = { nome: 'campo2', label: 'Campo 2', tipo: 'text', condicional: { campoRef: 'campo1', valor: 'SIM', negado: true } }
    expect(isFieldVisible(field, { campo1: 'SIM' })).toBe(false)
    expect(isFieldVisible(field, { campo1: 'NÃO' })).toBe(true)
  })

  it('retorna false se campoRef não existe em data', () => {
    const field: RetornoField = { nome: 'campo2', label: 'Campo 2', tipo: 'text', condicional: { campoRef: 'inexistente', valor: 'X' } }
    expect(isFieldVisible(field, {})).toBe(false)
  })
})

describe('getVisibleFields', () => {
  const fields: RetornoField[] = [
    { nome: 'sempre', label: 'Sempre visível', tipo: 'text' },
    { nome: 'condicional', label: 'Condicional', tipo: 'text', condicional: { campoRef: 'sempre', valor: 'ATIVO' } },
    { nome: 'oculto', label: 'Oculto', tipo: 'text', condicional: { campoRef: 'sempre', valor: 'INATIVO' } },
  ]

  it('filtra campos visíveis baseado nos dados', () => {
    const visible = getVisibleFields(fields, { sempre: 'ATIVO' })
    expect(visible).toHaveLength(2)
    expect(visible.map(f => f.nome)).toEqual(['sempre', 'condicional'])
  })

  it('retorna todos se nenhum condicional', () => {
    const simple = [{ nome: 'a', label: 'A', tipo: 'text' }, { nome: 'b', label: 'B', tipo: 'text' }]
    expect(getVisibleFields(simple, {})).toHaveLength(2)
  })
})

describe('shouldResetOnChange', () => {
  it('retorna false se campo não tem condicional', () => {
    const field: RetornoField = { nome: 'teste', label: 'Teste', tipo: 'text' }
    expect(shouldResetOnChange(field, {}, {})).toBe(false)
  })

  it('retorna false se o campo pai não mudou', () => {
    const field: RetornoField = { nome: 'campo2', label: 'Campo 2', tipo: 'text', condicional: { campoRef: 'campo1', valor: 'SIM' } }
    expect(shouldResetOnChange(field, { campo1: 'SIM' }, { campo1: 'SIM' })).toBe(false)
  })

  it('retorna true se o campo pai mudou', () => {
    const field: RetornoField = { nome: 'campo2', label: 'Campo 2', tipo: 'text', condicional: { campoRef: 'campo1', valor: 'SIM' } }
    expect(shouldResetOnChange(field, { campo1: 'SIM' }, { campo1: 'NÃO' })).toBe(true)
  })
})

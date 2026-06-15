import { describe, it, expect } from 'vitest'
import { getRetornoFields, getRetornoTipos } from './fields'

describe('getRetornoFields', () => {
  it('retorna fields para tipo conhecido', () => {
    const fields = getRetornoFields('CORTE POR FALTA DE PAGAMENTO')
    expect(fields.length).toBeGreaterThan(0)
    expect(fields[0].nome).toBe('situacao_corte')
  })

  it('retorna default para tipo desconhecido', () => {
    const fields = getRetornoFields('TIPO_INEXISTENTE')
    expect(fields).toHaveLength(1)
    expect(fields[0].nome).toBe('descricao')
  })

  it('UC_CORTADA_FIELDS tem 7 campos', () => {
    const fields = getRetornoFields('INSPECAO UC CORTADA I15')
    expect(fields.length).toBeGreaterThanOrEqual(7)
  })

  it('LIGACAO_NOVA_MT_FIELDS tem campos condicionais', () => {
    const fields = getRetornoFields('LIGACAO NOVA MEDIA TENSAO')
    const condicionais = fields.filter(f => f.condicional)
    expect(condicionais.length).toBeGreaterThan(0)
  })
})

describe('getRetornoTipos', () => {
  it('retorna todos os tipos exceto default', () => {
    const tipos = getRetornoTipos()
    expect(tipos).not.toContain('default')
    expect(tipos.length).toBeGreaterThanOrEqual(15)
    expect(tipos).toContain('CORTE POR FALTA DE PAGAMENTO')
    expect(tipos).toContain('INSPECAO UC CORTADA I15')
  })
})

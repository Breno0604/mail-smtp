import { describe, it, expect } from 'vitest'
import { iniciaisSchema } from './validation'

describe('iniciaisSchema', () => {
  it('valida dados corretos', () => {
    const result = iniciaisSchema.safeParse({
      uc: '123456',
      os: 'OS-001',
      tipoOrdem: 'CORTE',
      data: '2024-01-15',
      horaInicio: '08:00',
      horaFim: '12:00',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita UC vazia', () => {
    const result = iniciaisSchema.safeParse({
      uc: '',
      os: 'OS-001',
      tipoOrdem: 'CORTE',
      data: '2024-01-15',
      horaInicio: '08:00',
      horaFim: '12:00',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita OS vazia', () => {
    const result = iniciaisSchema.safeParse({
      uc: '123456',
      os: '',
      tipoOrdem: 'CORTE',
      data: '2024-01-15',
      horaInicio: '08:00',
      horaFim: '12:00',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita tipoOrdem vazio', () => {
    const result = iniciaisSchema.safeParse({
      uc: '123456',
      os: 'OS-001',
      tipoOrdem: '',
      data: '2024-01-15',
      horaInicio: '08:00',
      horaFim: '12:00',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita data vazia', () => {
    const result = iniciaisSchema.safeParse({
      uc: '123456',
      os: 'OS-001',
      tipoOrdem: 'CORTE',
      data: '',
      horaInicio: '08:00',
      horaFim: '12:00',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita horaInicio vazia', () => {
    const result = iniciaisSchema.safeParse({
      uc: '123456',
      os: 'OS-001',
      tipoOrdem: 'CORTE',
      data: '2024-01-15',
      horaInicio: '',
      horaFim: '12:00',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita horaFim vazia', () => {
    const result = iniciaisSchema.safeParse({
      uc: '123456',
      os: 'OS-001',
      tipoOrdem: 'CORTE',
      data: '2024-01-15',
      horaInicio: '08:00',
      horaFim: '',
    })
    expect(result.success).toBe(false)
  })
})

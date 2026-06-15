import { describe, it, expect } from 'vitest'
import { formatDate } from './formatDate'

describe('formatDate', () => {
  it('inverte YYYY-MM-DD para DD-MM-YYYY', () => {
    expect(formatDate('2024-01-15')).toBe('15-01-2024')
  })

  it('lida com mês e dia de um dígito', () => {
    expect(formatDate('2024-03-05')).toBe('05-03-2024')
  })

  it('retorna string vazia se entrada vazia', () => {
    expect(formatDate('')).toBe('')
  })

  it('retorna string original se não contém hífen', () => {
    expect(formatDate('15012024')).toBe('15012024')
  })

  it('retorna string original se não tem 3 partes', () => {
    expect(formatDate('2024-01')).toBe('2024-01')
  })
})

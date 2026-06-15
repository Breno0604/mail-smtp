import { describe, it, expect } from 'vitest'
import { createEquipment, validateUniqueNumber } from './index'
import type { Equipment } from '@/shared/types'

describe('createEquipment', () => {
  it('cria com valores default', () => {
    const eq = createEquipment()
    expect(eq.status).toBe('Instalado')
    expect(eq.categoria).toBe('Medidor')
    expect(eq.numero).toBe('')
  })

  it('permite sobrescrever valores', () => {
    const eq = createEquipment({ status: 'Retirado', numero: 'ABC' })
    expect(eq.status).toBe('Retirado')
    expect(eq.categoria).toBe('Medidor')
    expect(eq.numero).toBe('ABC')
  })
})

describe('validateUniqueNumber', () => {
  const items: Equipment[] = [
    { status: 'Instalado', categoria: 'Medidor', numero: '001' },
    { status: 'Instalado', categoria: 'Medidor', numero: '002' },
  ]

  it('retorna true se numero nao existe', () => {
    expect(validateUniqueNumber(items, '003')).toBe(true)
  })

  it('retorna false se numero existe em outro item', () => {
    expect(validateUniqueNumber(items, '001')).toBe(false)
  })

  it('retorna true se numero existe mas no mesmo indice', () => {
    expect(validateUniqueNumber(items, '001', 0)).toBe(true)
  })
})

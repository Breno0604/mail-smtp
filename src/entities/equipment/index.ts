import type { Equipment } from '@/shared/types'

export function validateUniqueNumber(items: Equipment[], numero: string, excludeIndex?: number): boolean {
  return !items.some((eq, i) => eq.numero === numero && i !== excludeIndex)
}

export function createEquipment(overrides?: Partial<Equipment>): Equipment {
  return {
    status: 'Instalado',
    categoria: 'Medidor',
    numero: '',
    ...overrides,
  }
}

export type { Equipment }

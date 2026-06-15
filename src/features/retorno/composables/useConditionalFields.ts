import type { RetornoField } from '@/shared/types'

export function useConditionalFields() {
  function isFieldVisible(field: RetornoField, data: Record<string, string>): boolean {
    if (!field.condicional) return true
    const { campoRef, valor, negado } = field.condicional
    const currentValue = data[campoRef] ?? ''

    const matches = Array.isArray(valor) ? valor.includes(currentValue) : currentValue === valor

    return negado ? !matches : matches
  }

  function getVisibleFields(fields: RetornoField[], data: Record<string, string>): RetornoField[] {
    return fields.filter(f => isFieldVisible(f, data))
  }

  function shouldResetOnChange(field: RetornoField, oldData: Record<string, string>, newData: Record<string, string>): boolean {
    if (!field.condicional) return false
    return oldData[field.condicional.campoRef] !== newData[field.condicional.campoRef]
  }

  return { isFieldVisible, getVisibleFields, shouldResetOnChange }
}

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Equipment } from '@/shared/types'
import { createEquipment, validateUniqueNumber } from '@/entities/equipment'

export const useEquipamentoStore = defineStore('equipamento', () => {
  const items = ref<Equipment[]>([])
  const validationErrors = ref<Record<string, string>>({})

  function addItem() {
    items.value.push(createEquipment())
  }

  function removeItem(index: number) {
    items.value.splice(index, 1)
    const keys = Object.keys(validationErrors.value).filter(k => k.startsWith(`equipamentos-${index}`))
    keys.forEach(k => delete validationErrors.value[k])
  }

  function updateItem(index: number, field: keyof Equipment, value: string) {
    if (items.value[index]) {
      (items.value[index] as Record<string, string>)[field] = value
    }
  }

  function validate(): boolean {
    validationErrors.value = {}
    let valid = true

    items.value.forEach((item, i) => {
      if (!item.status) {
        validationErrors.value[`equipamentos-${i}-status`] = 'Campo obrigatório'
        valid = false
      }
      if (!item.categoria) {
        validationErrors.value[`equipamentos-${i}-categoria`] = 'Campo obrigatório'
        valid = false
      }
      if (!item.numero) {
        validationErrors.value[`equipamentos-${i}-numero`] = 'Campo obrigatório'
        valid = false
      } else if (!validateUniqueNumber(items.value, item.numero, i)) {
        validationErrors.value[`equipamentos-${i}-numero`] = 'Número duplicado'
        valid = false
      }
    })

    return valid
  }

  function reset() {
    items.value = []
    validationErrors.value = {}
  }

  function restore(data: Equipment[]) {
    items.value = data.map(e => ({ ...e }))
  }

  return { items, validationErrors, addItem, removeItem, updateItem, validate, reset, restore }
})

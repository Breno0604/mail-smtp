// scripts/state.js
import {
  getCurrentUUID,
  setCurrentUUID as setUUID,
  clearCurrentUUID as clearUUID,
} from './uuid.js';
import { createEmptyEquipmentValues, createEmptyCheckboxes } from './equipment-keys.js';

/**
 * Global application state
 */
export const state = {
  iniciais: {},
  equipamentos: createDefaultEquipamentos(),
  attachments: [],
  lastTipoOrdem: '',
  retorno: {},
  currentUUID: getCurrentUUID(),
  iniciaisValido: false,
  _createdAt: null,
  status: 'draft',
};

/**
 * Create default equipamentos structure
 * Single source of truth for the default shape
 */
export function createDefaultEquipamentos() {
  return {
    instaladoEquip: '',
    retiradoEquip: '',
    instalados: createEmptyEquipmentValues(),
    retirados: createEmptyEquipmentValues(),
    checkboxes: {
      instalados: createEmptyCheckboxes(),
      retirados: createEmptyCheckboxes(),
    },
  };
}

/**
 * Set current UUID in both state and localStorage
 * @param {string} uuid - UUID to set
 */
export function setCurrentUUID(uuid) {
  state.currentUUID = uuid;
  setUUID(uuid);
}

/**
 * Clear current UUID from both state and localStorage
 */
export function clearCurrentUUID() {
  state.currentUUID = '';
  clearUUID();
}

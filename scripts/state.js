// scripts/state.js
import {
  getCurrentUUID,
  setCurrentUUID as setUUID,
  clearCurrentUUID as clearUUID,
} from './uuid.js';

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
};

/**
 * Create default equipamentos structure
 * Single source of truth for the default shape
 */
export function createDefaultEquipamentos() {
  return {
    instaladoEquip: 'NAO',
    retiradoEquip: 'NAO',
    instalados: {
      medidor: '',
      conjunto: '',
      display: '',
      tc_fase_a: '',
      tc_fase_b: '',
      tc_fase_c: '',
      tp_fase_a: '',
      tp_fase_b: '',
      tp_fase_c: '',
    },
    retirados: {
      medidor: '',
      conjunto: '',
      display: '',
      tc_fase_a: '',
      tc_fase_b: '',
      tc_fase_c: '',
      tp_fase_a: '',
      tp_fase_b: '',
      tp_fase_c: '',
    },
    checkboxes: {
      instalados: {
        medidor: false,
        conjunto: false,
        display: false,
        tc_fase_a: false,
        tc_fase_b: false,
        tc_fase_c: false,
        tp_fase_a: false,
        tp_fase_b: false,
        tp_fase_c: false,
      },
      retirados: {
        medidor: false,
        conjunto: false,
        display: false,
        tc_fase_a: false,
        tc_fase_b: false,
        tc_fase_c: false,
        tp_fase_a: false,
        tp_fase_b: false,
        tp_fase_c: false,
      },
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

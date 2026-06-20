// scripts/state.js
import { getCurrentUUID, setCurrentUUID as setUUID, clearCurrentUUID as clearUUID } from './uuid.js';

/**
 * Global application state
 */
export const state = {
  iniciais: {},
  equipamentos: [],
  attachments: [],
  lastTipoOrdem: '',
  retorno: {},
  currentUUID: getCurrentUUID(),
  iniciaisValido: false,
  _createdAt: null,
};

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

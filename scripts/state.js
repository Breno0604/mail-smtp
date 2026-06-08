import { getCurrentUUID as _getCurrentUUID } from "./persistence.js";

export { setCurrentUUID, clearCurrentUUID, saveState, debouncedSave, getCurrentUUID } from "./persistence.js";

export const state = {
  currentSection: 1,
  totalSections: 5,
  iniciais: {},
  equipamentos: [],
  attachments: [],
  lastTipoOrdem: "",
  visitedRetorno: false,
  retorno: {},
  animating: false,
  currentUUID: _getCurrentUUID(),
  composicao: { complementoCorpo: "" },
  iniciaisValido: false,
};

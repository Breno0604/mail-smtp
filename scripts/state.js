// state.js — objeto de estado global da aplicação.
// Importa getRawUUID de storage.js (sem dependências) para inicializar currentUUID,
// quebrando o ciclo: state.js → persistence.js → state.js.
import { getRawUUID } from "./storage.js";

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
  currentUUID: getRawUUID(),
  composicao: { complementoCorpo: "" },
  iniciaisValido: false,
};

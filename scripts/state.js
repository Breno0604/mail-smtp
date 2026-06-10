// state.js — objeto de estado global da aplicação.
// Importa getRawUUID de storage.js para inicializar currentUUID,
// quebrando o ciclo: state.js → persistence.js → state.js.
import { getRawUUID } from "./storage.js";

export { setCurrentUUID, clearCurrentUUID, saveState, debouncedSave, getCurrentUUID } from "./persistence.js";

export const state = {
  iniciais: {},
  equipamentos: [],
  attachments: [],
  lastTipoOrdem: "",
  retorno: {},
  currentUUID: getRawUUID(),
  composicao: { complementoCorpo: "" },
  iniciaisValido: false,
};

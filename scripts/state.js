import { DOM } from "./dom.js";
import { getIniciaisData } from "./iniciais.js";

export const STORAGE_KEY = "mail_form_estado";

export const state = {
  currentSection: 1,
  totalSections: 5,
  iniciais: {},
  equipamentos: [],
  attachments: [],
  lastTipoOrdem: "",
  visitedRetorno: false,
  animating: false,
};

export function saveState() {
  const iniciaisData = getIniciaisData();
  const hasData = Object.values(iniciaisData).some(v => v && v.trim() !== "");
  if (!hasData && state.equipamentos.length === 0 && state.attachments.length === 0) return;

  const data = {
    iniciais: iniciaisData,
    tipoOrdem: DOM.tipoOrdem ? DOM.tipoOrdem.value : "",
    equipamentos: state.equipamentos,
    lastTipoOrdem: state.lastTipoOrdem,
    visitedRetorno: state.visitedRetorno,
    currentSection: state.currentSection,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) { /* quota exceeded */ }
}

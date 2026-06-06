import { DOM } from "./dom.js";

export const STORAGE_KEY = "mail_form_estado";

export const state = {
  currentSection: 1,
  totalSections: 5,
  equipamentos: [],
  attachments: [],
  lastTipoOrdem: "",
  visitedRetorno: false,
  animating: false,
};

export function saveState() {
  if (!DOM.uc.value && !DOM.os.value && !DOM.cliente.value && state.equipamentos.length === 0 && state.attachments.length === 0) return;

  const data = {
    uc: DOM.uc.value,
    os: DOM.os.value,
    cliente: DOM.cliente.value,
    tipoOrdem: DOM.tipoOrdem.value,
    equipamentos: state.equipamentos,
    lastTipoOrdem: state.lastTipoOrdem,
    visitedRetorno: state.visitedRetorno,
    currentSection: state.currentSection,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) { /* quota exceeded */ }
}

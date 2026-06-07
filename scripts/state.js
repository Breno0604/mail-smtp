import { DOM } from "./dom.js";
import { getIniciaisData } from "./iniciais.js";
import { getRetornoData } from "./retornos.js";
import { saveDraft, getRecord } from "./db.js";

export const getCurrentUUID = () => sessionStorage.getItem("currentUUID") || "";

export const setCurrentUUID = (uuid) => {
  state.currentUUID = uuid;
  sessionStorage.setItem("currentUUID", uuid);
};

export const clearCurrentUUID = () => {
  state.currentUUID = "";
  sessionStorage.removeItem("currentUUID");
};

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
  currentUUID: getCurrentUUID(),
  composicao: { complementoCorpo: "" },
};

let saveTimer = null;

export async function saveState() {
  const iniciaisData = getIniciaisData();
  const hasData = Object.values(iniciaisData).some(v => v && v.trim() !== "");
  if (!hasData && state.equipamentos.length === 0 && state.attachments.length === 0 && !state.currentUUID) return;

  if (!state.currentUUID) {
    try {
      state.currentUUID = crypto.randomUUID();
    } catch (_) {
      state.currentUUID = Date.now().toString(36) + Math.random().toString(36).slice(2);
    }
    setCurrentUUID(state.currentUUID);
  }

  let createdAt = new Date().toISOString();
  if (state._createdAt) {
    createdAt = state._createdAt;
  } else {
    try {
      const existing = await getRecord(state.currentUUID);
      if (existing?.createdAt) {
        createdAt = existing.createdAt;
      }
    } catch (_) { console.error("getRecord in saveState:", _); }
    state._createdAt = createdAt;
  }

  const data = {
    uuid: state.currentUUID,
    status: "draft",
    createdAt,
    updatedAt: new Date().toISOString(),
    currentSection: state.currentSection,
    iniciais: iniciaisData,
    retorno: getRetornoData(),
    tipoOrdem: DOM.tipoOrdem ? DOM.tipoOrdem.value : "",
    equipamentos: state.equipamentos,
    lastTipoOrdem: state.lastTipoOrdem,
    visitedRetorno: state.visitedRetorno,
    composicao: { complementoCorpo: DOM.complementoCorpo ? DOM.complementoCorpo.value : "" },
    sentData: null,
  };

  saveDraft(data).catch((err) => console.error("saveDraft error:", err));
}

export function debouncedSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveState, 300);
}

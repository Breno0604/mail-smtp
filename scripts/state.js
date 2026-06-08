import { DOM } from "./dom.js";
import { getIniciaisData } from "./iniciais.js";
import { getRetornoData } from "./retornos.js";
import { saveDraft, getRecord } from "./db.js";
import { toBase64 } from "./utils.js";

export const getCurrentUUID = () => localStorage.getItem("currentUUID") || "";

export const setCurrentUUID = (uuid) => {
  state.currentUUID = uuid;
  localStorage.setItem("currentUUID", uuid);
};

export const clearCurrentUUID = () => {
  state.currentUUID = "";
  localStorage.removeItem("currentUUID");
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
  iniciaisValido: false,
};

let saveTimer = null;

export async function saveState() {
  if (!state.iniciaisValido) return;

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

  const attachmentsData = await Promise.all(
    state.attachments.map(async (file) => ({
      name: file.name,
      type: file.type,
      data: await toBase64(file),
    }))
  );

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
    attachments: attachmentsData,
    sentData: null,
  };

  saveDraft(data).catch((err) => {
    console.error("saveDraft error:", err);
    if (err?.name === "QuotaExceededError" || err?.message?.includes("quota")) {
      import("./ui.js").then(({ showToast }) => {
        showToast("Espaço insuficiente no navegador. Limpe dados antigos.", false);
      });
    }
  });
}

export function debouncedSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveState, 300);
}

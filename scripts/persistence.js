import { state } from "./state.js";
import { getRawUUID, storeUUID, removeUUID } from "./storage.js";
import { getIniciaisData } from "./iniciais.js";
import { getRetornoData } from "./retornos.js";
import { saveDraft, getRecord } from "./db.js";
import { toBase64 } from "./utils.js";
import { DOM } from "./dom.js";

// UUID helpers — delegam a storage.js para operações puras de localStorage,
// e sincronizam o state em memória quando necessário.
export const getCurrentUUID = () => getRawUUID();

export const setCurrentUUID = (uuid) => {
  state.currentUUID = uuid;
  storeUUID(uuid);
};

export const clearCurrentUUID = () => {
  state.currentUUID = "";
  removeUUID();
};

let saveTimer = null;

export async function saveState() {
  if (!state.iniciaisValido) return;

  const iniciaisData = getIniciaisData();
  const hasData = Object.values(iniciaisData).some(v => v && v.trim() !== "");
  if (!hasData && state.equipamentos.length === 0 && state.attachments.length === 0 && !state.currentUUID) return;

  await _ensureUUID();

  const createdAt = await _resolveCreatedAt(state.currentUUID);
  const attachmentsData = await _serializeAttachments(state.attachments);

  const data = {
    uuid: state.currentUUID,
    status: "draft",
    createdAt,
    updatedAt: new Date().toISOString(),
    iniciais: iniciaisData,
    retorno: getRetornoData(),
    tipoOrdem: DOM.tipoOrdem ? DOM.tipoOrdem.value : "",
    equipamentos: state.equipamentos,
    lastTipoOrdem: state.lastTipoOrdem,
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
  saveTimer = setTimeout(saveState, 1000);
}

// ── helpers privados ──────────────────────────────────────────────────────────

async function _ensureUUID() {
  if (state.currentUUID) return;
  try {
    state.currentUUID = crypto.randomUUID();
  } catch (_) {
    state.currentUUID = Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
  setCurrentUUID(state.currentUUID);
}

async function _resolveCreatedAt(uuid) {
  if (state._createdAt) return state._createdAt;
  try {
    const existing = await getRecord(uuid);
    if (existing?.createdAt) {
      state._createdAt = existing.createdAt;
      return state._createdAt;
    }
  } catch (_) {
    console.error("getRecord in saveState:", _);
  }
  state._createdAt = new Date().toISOString();
  return state._createdAt;
}

async function _serializeAttachments(files) {
  return Promise.all(
    files.map(async (file) => ({
      name: file.name,
      type: file.type,
      data: await toBase64(file),
    }))
  );
}

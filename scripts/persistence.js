import { state } from "./state.js";
import { getRawUUID, storeUUID, removeUUID } from "./storage.js";
import { getIniciaisData } from "./iniciais.js";
import { getRetornoData } from "./retornos.js";
import { saveDraft, getRecord, saveAttachments } from "./db.js";
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
  attachmentsDirty = true;
};

let saveTimer = null;

// ── Dirty tracking para anexos ───────────────────────────────────────────────
// Evita re-serializar e re-salvar anexos quando eles não mudaram.
let attachmentsDirty = true;

/**
 * Marca os anexos como "sujos" — serão re-serializados e salvos no próximo saveState().
 * Deve ser chamada quando anexos são adicionados, removidos ou o form é resetado.
 */
export function markAttachmentsDirty() {
  attachmentsDirty = true;
}

// ── saveState ────────────────────────────────────────────────────────────────

export async function saveState() {
  if (!state.iniciaisValido) return;

  const iniciaisData = getIniciaisData();
  const hasData = Object.values(iniciaisData).some(v => v && v.trim() !== "");
  if (!hasData && state.equipamentos.length === 0 && state.attachments.length === 0 && !state.currentUUID) return;

  await _ensureUUID();

  const createdAt = await _resolveCreatedAt(state.currentUUID);

  // Record principal — SEM anexos (anexos ficam em store separado)
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
    attachmentCount: state.attachments.length, // Apenas contagem para referência
    sentData: null,
  };

  // Salvar record principal
  saveDraft(data).catch((err) => {
    console.error("saveDraft error:", err);
    if (err?.name === "QuotaExceededError" || err?.message?.includes("quota")) {
      import("./ui.js").then(({ showToast }) => {
        showToast("Espaço insuficiente no navegador. Limpe dados antigos.", false);
      });
    }
  });

  // Salvar anexos no store separado — só se dirty
  if (attachmentsDirty) {
    attachmentsDirty = false;
    _serializeAndSaveAttachments(state.currentUUID, state.attachments).catch((err) => {
      console.error("saveAttachments error:", err);
      attachmentsDirty = true; // Marcar dirty novamente para retry
    });
  }
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

async function _serializeAndSaveAttachments(uuid, files) {
  if (files.length === 0) {
    // Se não há anexos, apenas limpar store (se havia antes)
    await saveAttachments(uuid, []);
    return;
  }

  const serialized = await Promise.all(
    files.map(async (file) => ({
      name: file.name,
      type: file.type,
      data: await toBase64(file),
    }))
  );

  await saveAttachments(uuid, serialized);
}

// scripts/persistence.js
import { state, setCurrentUUID } from './state.js';
import { getRecord, saveRecordAtomic } from './db.js';
import { toBase64 } from './utils.js';
import { generateUUID } from './uuid.js';
import { collectIniciais, collectRetorno, collectEquipamentos } from './collectors.js';

let saveTimer = null;

/**
 * Save current state to IndexedDB
 */
export async function saveState() {
  // Do not save until UC and OS fields are filled
  if (!state.iniciaisValido) return;

  // Sync state from DOM as safety net (event listeners normally keep state in sync)
  collectIniciais();
  collectRetorno();
  collectEquipamentos();

  // Check if there's any data to save
  const hasData =
    Object.values(state.iniciais).some(v => v && v.trim() !== '') ||
    state.equipamentos.instaladoEquip === 'SIM' ||
    state.equipamentos.retiradoEquip === 'SIM' ||
    state.attachments.length > 0 ||
    state.currentUUID;

  if (!hasData) return;

  // Ensure UUID exists
  if (!state.currentUUID) {
    const uuid = generateUUID();
    setCurrentUUID(uuid);
  }

  // 1. Fetch existing record ONCE
  let existing = null;
  try {
    existing = await getRecord(state.currentUUID);
  } catch (err) {
    console.error('getRecord in saveState:', err);
  }

  // 2. Resolve createdAt (reuses existing)
  const createdAt = await resolveCreatedAt(state.currentUUID, existing);

  // 3. Determine status (reuses existing — no more getRecord call)
  let recordStatus = 'draft';
  if (existing) {
    if (existing.sentData) {
      const prev = JSON.stringify({
        iniciais: existing.iniciais,
        retorno: existing.retorno,
        equipamentos: existing.equipamentos,
      });
      const curr = JSON.stringify({
        iniciais: state.iniciais,
        retorno: state.retorno,
        equipamentos: state.equipamentos,
      });
      recordStatus = prev !== curr ? 'changed' : 'sent';
    } else {
      recordStatus = existing.status || 'draft';
    }
  }

  // Keep in-memory state.status in sync with what we're saving
  state.status = recordStatus;

  // Build record from state (single source of truth)
  const data = {
    uuid: state.currentUUID,
    status: recordStatus,
    createdAt,
    updatedAt: new Date().toISOString(),
    iniciais: state.iniciais,
    retorno: state.retorno,
    tipoOrdem: state.iniciais['tipo-ordem'] || '',
    equipamentos: state.equipamentos,
    attachmentCount: state.attachments.length,
    sentData: existing?.sentData ?? null,
  };

  // Save record + attachments atomically in a single transaction
  try {
    const serializedAttachments = await serializeAttachments(state.attachments);
    await saveRecordAtomic(state.currentUUID, data, serializedAttachments);
  } catch (err) {
    console.error('saveRecordAtomic error:', err);
    if (err?.name === 'QuotaExceededError' || err?.message?.includes('quota')) {
      import('./ui.js').then(({ showToast }) => {
        showToast('Espaço insuficiente no navegador. Limpe dados antigos.', false);
      });
    }
  }
}

/**
 * Debounced save (1 second delay)
 */
export function debouncedSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveState, 1000);
}

/**
 * Cancel any pending debounced save
 */
export function cancelDebouncedSave() {
  clearTimeout(saveTimer);
}

/**
 * Resolve createdAt timestamp
 * @param {string} uuid - Record UUID
 * @returns {Promise<string>} ISO timestamp
 */
async function resolveCreatedAt(uuid, existing) {
  if (state._createdAt) return state._createdAt;

  try {
    if (existing?.createdAt) {
      state._createdAt = existing.createdAt;
      return state._createdAt;
    }
  } catch (err) {
    console.error('getRecord in saveState:', err);
  }

  state._createdAt = new Date().toISOString();
  return state._createdAt;
}

/**
 * Serialize File objects to base64 for IndexedDB storage
 * @param {File[]} files - Attachment files
 * @returns {Promise<Array<{name: string, type: string, data: string}>>}
 */
async function serializeAttachments(files) {
  if (files.length === 0) return [];
  return Promise.all(
    files.map(async file => ({
      name: file.name,
      type: file.type,
      data: await toBase64(file),
    }))
  );
}

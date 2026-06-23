// scripts/persistence.js
import { state, setCurrentUUID } from './state.js';
import { saveDraft, getRecord, saveAttachments } from './db.js';
import { toBase64 } from './utils.js';
import { generateUUID } from './uuid.js';
import { collectIniciais, collectRetorno, collectEquipamentos } from './collectors.js';

let saveTimer = null;
let attachmentsDirty = true;

/**
 * Mark attachments as dirty (need to be re-saved)
 */
export function markAttachmentsDirty() {
  attachmentsDirty = true;
}

/**
 * Save current state to IndexedDB
 */
export async function saveState() {
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

  // Resolve createdAt
  const createdAt = await resolveCreatedAt(state.currentUUID);

  // Determine record status based on existing record and sentData
  let recordStatus = 'draft';
  let existing = null;
  try {
    existing = await getRecord(state.currentUUID);
    if (existing) {
      if (existing.sentData) {
        // Already sent — check if current data differs from what was sent
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
  } catch (err) {
    console.error('getRecord in saveState:', err);
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

  // Save record
  saveDraft(data).catch(err => {
    console.error('saveDraft error:', err);
    if (err?.name === 'QuotaExceededError' || err?.message?.includes('quota')) {
      import('./ui.js').then(({ showToast }) => {
        showToast('Espaço insuficiente no navegador. Limpe dados antigos.', false);
      });
    }
  });

  // Save attachments if dirty
  if (attachmentsDirty) {
    attachmentsDirty = false;
    serializeAndSaveAttachments(state.currentUUID, state.attachments).catch(err => {
      console.error('saveAttachments error:', err);
      attachmentsDirty = true;
    });
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
 * Resolve createdAt timestamp
 * @param {string} uuid - Record UUID
 * @returns {Promise<string>} ISO timestamp
 */
async function resolveCreatedAt(uuid) {
  if (state._createdAt) return state._createdAt;

  try {
    const existing = await getRecord(uuid);
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
 * Serialize and save attachments to IndexedDB
 * @param {string} uuid - Record UUID
 * @param {Array<File>} files - Attachment files
 */
async function serializeAndSaveAttachments(uuid, files) {
  if (files.length === 0) {
    await saveAttachments(uuid, []);
    return;
  }

  const serialized = await Promise.all(
    files.map(async file => ({
      name: file.name,
      type: file.type,
      data: await toBase64(file),
    }))
  );

  await saveAttachments(uuid, serialized);
}

// scripts/persistence.js
import { state, setCurrentUUID } from './state.js';
import { getRecord, saveRecordAtomic } from './db.js';
import { toBase64 } from './utils.js';
import { generateUUID } from './uuid.js';
import { collectIniciais, collectRetorno, collectEquipamentos } from './collectors.js';
import { iniciaisFields, getAllRetornoFieldNames } from './fields.js';
import { showToast } from './ui.js';
import { compressImageFile } from './compress.js';

export const RECORD_SCHEMA_VERSION = 1;

let saveTimer = null;
// Fila de saves: evita que dois saveState concorrentes se sobrescrevam fora de ordem.
let saveChain = Promise.resolve();
// Evita recomprimir o mesmo anexo a cada autosave.
const compressedFileCache = new WeakMap();

/**
 * Persiste o estado atual no IndexedDB.
 * Saves são serializados: o próximo só começa quando o anterior termina,
 * garantindo que o snapshot mais recente seja o último a ser gravado.
 */
export function saveState() {
  // Sync state from DOM as safety net (event listeners normally keep state in sync).
  // Feito de forma síncrona para que o estado reflita o DOM imediatamente.
  if (state.iniciaisValido) {
    collectIniciais();
    collectRetorno();
    collectEquipamentos();
  }

  saveChain = saveChain.then(saveStateNow, saveStateNow);
  return saveChain;
}

async function saveStateNow() {
  // Do not save until UC and OS fields are filled
  if (!state.iniciaisValido) return;

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
  const createdAt = resolveCreatedAt(existing);

  // 3. Síntese de outra aba: o registro mudou desde o último save desta aba?
  const changedElsewhere = Boolean(
    existing?.updatedAt &&
    state._lastSeenUpdatedAt &&
    existing.updatedAt !== state._lastSeenUpdatedAt
  );

  // 4. Determine status (reuses existing — no more getRecord call)
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
    schemaVersion: RECORD_SCHEMA_VERSION,
    status: recordStatus,
    createdAt,
    updatedAt: new Date().toISOString(),
    iniciais: keepLegacyKeys(
      state.iniciais,
      existing?.iniciais,
      iniciaisFields.map(f => f.nome)
    ),
    retorno: keepLegacyKeys(state.retorno, existing?.retorno, getAllRetornoFieldNames()),
    tipoOrdem: state.iniciais['tipo-ordem'] || '',
    equipamentos: state.equipamentos,
    attachmentCount: state.attachments.length,
    sentData: existing?.sentData ?? null,
  };

  let serializedAttachments;
  try {
    serializedAttachments = await serializeAttachments(state.attachments);
    // Count reflects what is actually being written (attachments may change during serialization)
    data.attachmentCount = serializedAttachments.length;
  } catch (err) {
    console.error('serializeAttachments error:', err);
    serializedAttachments = [];
    data.attachmentCount = 0;
  }

  try {
    await saveRecordAtomic(state.currentUUID, data, serializedAttachments);
  } catch (err) {
    console.error('saveRecordAtomic error:', err);
    if (isQuotaError(err)) {
      await saveWithoutAttachments(data, err);
    } else {
      showToast('Não foi possível salvar. Verifique o espaço livre do navegador.', false);
    }
    return;
  }

  state._lastSeenUpdatedAt = data.updatedAt;

  if (changedElsewhere) {
    showToast('Este registro foi alterado em outra aba. Suas alterações prevaleceram.', false);
  }
}

/**
 * A quota pode estourar por causa dos anexos. Nesse caso, preserva os dados
 * do formulário gravando o registro sem anexos em vez de perder tudo.
 */
async function saveWithoutAttachments(data, originalError) {
  try {
    await saveRecordAtomic(data.uuid, { ...data, attachmentCount: 0 }, []);
    showToast(
      'Espaço insuficiente: os anexos não foram salvos, mas os dados do formulário foram preservados.',
      false
    );
  } catch (err) {
    console.error('saveRecordAtomic error (retry sem anexos):', err, originalError);
    showToast('Não foi possível salvar. Verifique o espaço livre do navegador.', false);
  }
}

function isQuotaError(err) {
  return err?.name === 'QuotaExceededError' || err?.message?.includes('quota');
}

/**
 * Preserva chaves que existiam no registro salvo e não fazem parte do schema
 * atual (campos/opções removidos em versões novas). Campos conhecidos seguem o
 * valor atual do formulário — inclusive vazio, para permitir limpar um campo.
 */
function keepLegacyKeys(current, previous, knownNames) {
  const known = new Set(knownNames);
  const legacy = {};
  for (const [key, value] of Object.entries(previous || {})) {
    if (!known.has(key)) legacy[key] = value;
  }
  return { ...legacy, ...current };
}

/**
 * Debounced save (1 second delay)
 */
export function debouncedSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveState();
  }, 1000);
}

/**
 * Cancela o debounce e grava imediatamente o que estiver pendente.
 * Usado em pagehide/visibilitychange para não perder a última edição.
 */
export function flushPendingSave() {
  if (!saveTimer) return saveChain;
  clearTimeout(saveTimer);
  saveTimer = null;
  return saveState();
}

/**
 * Cancel any pending debounced save
 */
export function cancelDebouncedSave() {
  clearTimeout(saveTimer);
  saveTimer = null;
}

/**
 * Resolve createdAt timestamp, reutilizando o do registro existente.
 * @param {object|null} existing - Registro já carregado do IndexedDB
 * @returns {string} ISO timestamp
 */
function resolveCreatedAt(existing) {
  if (state._createdAt) return state._createdAt;

  if (existing?.createdAt) {
    state._createdAt = existing.createdAt;
    return state._createdAt;
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
    files.map(async file => {
      const storedFile = await getStoredFile(file);
      return {
        name: storedFile.name,
        type: storedFile.type,
        data: await toBase64(storedFile),
      };
    })
  );
}

/**
 * Anexos são gravados comprimidos (mesma regra do envio) para reduzir a quota
 * consumida. O cache evita recompressão a cada autosave.
 */
async function getStoredFile(file) {
  if (compressedFileCache.has(file)) return compressedFileCache.get(file);

  let storedFile = file;
  try {
    storedFile = await compressImageFile(file);
  } catch (err) {
    console.error('compressImageFile error:', err);
  }

  compressedFileCache.set(file, storedFile);
  return storedFile;
}

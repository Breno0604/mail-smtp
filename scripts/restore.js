import { DOM } from './dom.js';
import { state, setCurrentUUID, createDefaultEquipamentos } from './state.js';
import { markAttachmentsDirty } from './persistence.js';
import { renderIniciais } from './iniciais.js';
import { iniciaisFields } from './fields.js';
import { renderRetorno, setRetornoData, handleTipoChange } from './retornos.js';
import { renderEquipamentos } from './equipment.js';
import { renderPreviews, updateFileCount } from './attachments.js';
import { base64ToBlob } from './utils.js';
import { getAttachmentsByUuid } from './db.js';
import { updateLivePreview } from './email.js';
import { collectIniciais } from './collectors.js';
import { updateAllFilledClasses } from './filled-state.js';

/**
 * Aplica um registro ao formulário, restaurando todos os campos.
 * Suporta migração transparente:
 * - Formato antigo (v2): anexos inline em record.attachments[]
 * - Formato novo (v3): anexos em store separado, buscados por UUID
 */
export async function applyRecord(record) {
  setCurrentUUID(record.uuid);
  state.iniciaisValido = true;

  // Handle migration from old array format
  if (Array.isArray(record.equipamentos)) {
    state.equipamentos = createDefaultEquipamentos();
  } else {
    state.equipamentos = record.equipamentos || createDefaultEquipamentos();
  }
  state.lastTipoOrdem = record.tipoOrdem || '';
  state.iniciais = record.iniciais || {};
  state.retorno = record.retorno || {};
  state._createdAt = record.createdAt;
  state.status = record.status || 'draft';

  // ── Restaurar anexos com migração transparente ──────────────────────────
  if (record.attachments && Array.isArray(record.attachments) && record.attachments.length > 0) {
    // Formato antigo (v2): anexos inline no record
    state.attachments = record.attachments.map(att => {
      const blob = base64ToBlob(att.data, att.type);
      return new File([blob], att.name, { type: att.type });
    });
  } else if (record.attachmentCount > 0 || record.attachments === undefined) {
    // Formato novo (v3): buscar do store separado
    try {
      const storedAttachments = await getAttachmentsByUuid(record.uuid);
      state.attachments = storedAttachments.map(att => {
        const blob = base64ToBlob(att.data, att.type);
        return new File([blob], att.name, { type: att.type });
      });
    } catch (err) {
      console.error('Erro ao buscar anexos do store:', err);
      state.attachments = [];
    }
  } else {
    state.attachments = [];
  }

  // Marcar dirty para que próximos saves persistam corretamente
  markAttachmentsDirty();

  // ── Render Início ───────────────────────────────────────────────────────
  renderIniciais();

  // Re-attach tipo-ordem listener (renderIniciais recria o elemento)
  if (DOM.tipoOrdem) {
    DOM.tipoOrdem.addEventListener('change', handleTipoChange);
  }

  if (record.tipoOrdem && DOM.tipoOrdem) {
    DOM.tipoOrdem.value = record.tipoOrdem;
  }

  if (record.iniciais) {
    iniciaisFields.forEach(field => {
      const el = document.getElementById(field.nome);
      const val = record.iniciais[field.nome];
      if (el && val != null && val !== '') el.value = val;
    });
  }

  // ── Render Retorno ──────────────────────────────────────────────────────
  if (record.tipoOrdem) {
    renderRetorno();
    setRetornoData(record.retorno);
  }

  // ── Render Equipamentos ─────────────────────────────────────────────────
  renderEquipamentos();

  // Restore control select values and show/hide sections
  // (State is already correct from record, just sync DOM visibility)
  if (state.equipamentos.instaladoEquip === 'SIM') {
    DOM.instaladoEquip.value = 'SIM';
    DOM.secEquipInstalados.classList.remove('hidden');
  } else {
    DOM.instaladoEquip.value = state.equipamentos.instaladoEquip || '';
    DOM.secEquipInstalados.classList.add('hidden');
  }

  if (state.equipamentos.retiradoEquip === 'SIM') {
    DOM.retiradoEquip.value = 'SIM';
    DOM.secEquipRetirados.classList.remove('hidden');
  } else {
    DOM.retiradoEquip.value = state.equipamentos.retiradoEquip || '';
    DOM.secEquipRetirados.classList.add('hidden');
  }

  updateAllFilledClasses();

  // ── Render Anexos ───────────────────────────────────────────────────────
  renderPreviews();
  updateFileCount();

  // ── Sync state from DOM to normalize field names ──────────────────────────
  collectIniciais();

  // ── Atualizar preview do email ────────────────────────────────────────────
  updateLivePreview();
}

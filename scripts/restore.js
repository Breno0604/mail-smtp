import { DOM } from "./dom.js";
import { state, setCurrentUUID } from "./state.js";
import { markAttachmentsDirty } from "./persistence.js";
import { renderIniciais } from "./iniciais.js";
import { iniciaisFields } from "./fields.js";
import { renderRetorno, setRetornoData, handleTipoChange } from "./retornos.js";
import { renderEquipamentos } from "./equipment.js";
import { renderPreviews, updateFileCount } from "./attachments.js";
import { base64ToBlob } from "./utils.js";
import { getAttachmentsByUuid } from "./db.js";
import { updateLivePreview } from "./email.js";
import { collectIniciais } from "./collectors.js";

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
    // Old format - reset to defaults
    state.equipamentos = {
      instaladoEquip: 'NAO',
      retiradoEquip: 'NAO',
      instalados: { medidor: '', conjunto: '', display: '', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' },
      retirados: { medidor: '', conjunto: '', display: '', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' },
      checkboxes: {
        instalados: { medidor: false, conjunto: false, display: false, tc_fase_a: false, tc_fase_b: false, tc_fase_c: false, tp_fase_a: false, tp_fase_b: false, tp_fase_c: false },
        retirados: { medidor: false, conjunto: false, display: false, tc_fase_a: false, tc_fase_b: false, tc_fase_c: false, tp_fase_a: false, tp_fase_b: false, tp_fase_c: false }
      }
    };
  } else {
    state.equipamentos = record.equipamentos || {
      instaladoEquip: 'NAO',
      retiradoEquip: 'NAO',
      instalados: { medidor: '', conjunto: '', display: '', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' },
      retirados: { medidor: '', conjunto: '', display: '', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' },
      checkboxes: {
        instalados: { medidor: false, conjunto: false, display: false, tc_fase_a: false, tc_fase_b: false, tc_fase_c: false, tp_fase_a: false, tp_fase_b: false, tp_fase_c: false },
        retirados: { medidor: false, conjunto: false, display: false, tc_fase_a: false, tc_fase_b: false, tc_fase_c: false, tp_fase_a: false, tp_fase_b: false, tp_fase_c: false }
      }
    };
  }
  state.lastTipoOrdem = record.tipoOrdem || "";
  state.iniciais = record.iniciais || {};
  state.retorno = record.retorno || {};
  state._createdAt = record.createdAt;

  // ── Restaurar anexos com migração transparente ──────────────────────────
  if (record.attachments && Array.isArray(record.attachments) && record.attachments.length > 0) {
    // Formato antigo (v2): anexos inline no record
    state.attachments = record.attachments.map((att) => {
      const blob = base64ToBlob(att.data, att.type);
      return new File([blob], att.name, { type: att.type });
    });
  } else if (record.attachmentCount > 0 || (record.attachments === undefined)) {
    // Formato novo (v3): buscar do store separado
    try {
      const storedAttachments = await getAttachmentsByUuid(record.uuid);
      state.attachments = storedAttachments.map((att) => {
        const blob = base64ToBlob(att.data, att.type);
        return new File([blob], att.name, { type: att.type });
      });
    } catch (err) {
      console.error("Erro ao buscar anexos do store:", err);
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
    DOM.tipoOrdem.addEventListener("change", handleTipoChange);
  }

  if (record.tipoOrdem && DOM.tipoOrdem) {
    DOM.tipoOrdem.value = record.tipoOrdem;
  }

  if (record.iniciais) {
    iniciaisFields.forEach((field) => {
      const el = document.getElementById(field.nome);
      const val = record.iniciais[field.nome];
      if (el && val != null && val !== "") el.value = val;
    });
  }

  // ── Render Retorno ──────────────────────────────────────────────────────
  if (record.tipoOrdem) {
    renderRetorno();
    setRetornoData(record.retorno);
  }

  // ── Render Equipamentos ─────────────────────────────────────────────────
  renderEquipamentos();

  // ── Render Anexos ───────────────────────────────────────────────────────
  renderPreviews();
  updateFileCount();

  // ── Sync state from DOM to normalize field names ──────────────────────────
  collectIniciais();

  // ── Atualizar preview do email ────────────────────────────────────────────
  updateLivePreview();
}

import { DOM } from "./dom.js";
import { state, clearCurrentUUID } from "./state.js";
import { markAttachmentsDirty } from "./persistence.js";
import { renderIniciais } from "./iniciais.js";
import { renderRetorno, handleTipoChange } from "./retornos.js";
import { renderEquipamentos } from "./equipment.js";
import { updateFileCount } from "./attachments.js";
import { hideError } from "./ui.js";
import { captureCoordinates } from "./utils.js";
import { updateLivePreview } from "./email.js";
import { collectIniciais } from "./collectors.js";

export function resetForm() {
  // Reset state
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
  state.attachments = [];
  state.iniciais = {};
  state.retorno = {};
  state.lastTipoOrdem = "";
  state.currentUUID = "";
  state._createdAt = null;
  state.iniciaisValido = false;

  // Marcar anexos como dirty (força re-save vazio no próximo saveState)
  markAttachmentsDirty();

  // Clear all sections
  renderIniciais();
  // Sync state from DOM after render (populates state.iniciais with all field keys, empty values)
  collectIniciais();
  captureCoordinates();

  // Re-attach tipo-ordem change listener (renderIniciais recreates the element)
  if (DOM.tipoOrdem) {
    DOM.tipoOrdem.addEventListener("change", handleTipoChange);
  }

  // Retorno starts empty (placeholder visible)
  DOM.retornoCampos.innerHTML = "";
  DOM.retornoPlaceholder.style.display = "";
  DOM.retornoDesc.innerHTML = "—";

  // Reset equipment control fields
  DOM.instaladoEquip.value = 'NAO';
  DOM.retiradoEquip.value = 'NAO';
  DOM.secEquipInstalados.classList.add('hidden');
  DOM.secEquipRetirados.classList.add('hidden');
  DOM.checkboxesInstalados.innerHTML = '';
  DOM.checkboxesRetirados.innerHTML = '';
  DOM.camposInstalados.innerHTML = '';
  DOM.camposRetirados.innerHTML = '';
  
  // Re-render equipment checkboxes (empty state)
  renderEquipamentos();
  
  DOM.previewGrid.innerHTML = "";

  updateFileCount();
  hideError();
  clearCurrentUUID();
  updateLivePreview();
}

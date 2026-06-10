import { DOM } from "./dom.js";
import { state, clearCurrentUUID } from "./state.js";
import { renderIniciais } from "./iniciais.js";
import { renderRetorno, handleTipoChange } from "./retornos.js";
import { showEmptyEquip } from "./equipment.js";
import { updateFileCount } from "./attachments.js";
import { hideError } from "./ui.js";
import { captureCoordinates } from "./utils.js";

export function resetForm() {
  // Reset state
  state.equipamentos = [];
  state.attachments = [];
  state.iniciais = {};
  state.retorno = {};
  state.lastTipoOrdem = "";
  state.currentUUID = "";
  state._createdAt = null;
  state.iniciaisValido = false;

  // Clear all sections
  renderIniciais();
  captureCoordinates();

  // Re-attach tipo-ordem change listener (renderIniciais recreates the element)
  if (DOM.tipoOrdem) {
    DOM.tipoOrdem.addEventListener("change", handleTipoChange);
  }

  // Retorno starts empty (placeholder visible)
  DOM.retornoCampos.innerHTML = "";
  DOM.retornoPlaceholder.style.display = "";
  DOM.retornoDesc.innerHTML = "—";

  DOM.equipList.innerHTML = "";
  DOM.complementoCorpo.value = "";
  DOM.previewGrid.innerHTML = "";
  DOM.previewCorpo.textContent = "—";

  showEmptyEquip();
  updateFileCount();
  hideError();
  clearCurrentUUID();
}

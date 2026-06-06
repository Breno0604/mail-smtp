import { DOM } from "./dom.js";
import { state, STORAGE_KEY } from "./state.js";
import { showEmptyEquip, updateSkipBtn } from "./equipment.js";
import { updateFileCount } from "./attachments.js";
import { hideError } from "./ui.js";

export function resetForm() {
  DOM.uc.value = "";
  DOM.os.value = "";
  DOM.cliente.value = "";
  DOM.tipoOrdem.value = "";
  DOM.retornoCampos.innerHTML = "";
  DOM.equipList.innerHTML = "";
  DOM.complementoCorpo.value = "";
  state.equipamentos = [];
  state.attachments = [];
  state.lastTipoOrdem = "";
  state.visitedRetorno = false;
  DOM.previewGrid.innerHTML = "";
  showEmptyEquip();
  updateFileCount();
  updateSkipBtn();
  hideError();
  localStorage.removeItem(STORAGE_KEY);
}

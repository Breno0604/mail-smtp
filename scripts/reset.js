import { DOM } from "./dom.js";
import { state, STORAGE_KEY } from "./state.js";
import { renderIniciais } from "./iniciais.js";
import { showEmptyEquip, updateSkipBtn } from "./equipment.js";
import { updateFileCount } from "./attachments.js";
import { hideError } from "./ui.js";

export function resetForm() {
  renderIniciais();
  DOM.retornoCampos.innerHTML = "";
  DOM.equipList.innerHTML = "";
  DOM.complementoCorpo.value = "";
  state.equipamentos = [];
  state.attachments = [];
  state.iniciais = {};
  state.lastTipoOrdem = "";
  state.visitedRetorno = false;
  DOM.previewGrid.innerHTML = "";
  showEmptyEquip();
  updateFileCount();
  updateSkipBtn();
  hideError();
  localStorage.removeItem(STORAGE_KEY);
}

import { DOM } from "./dom.js";
import { state } from "./state.js";
import { renderIniciais, iniciaisFields } from "./iniciais.js";
import { showSection } from "./navigation.js";

export function applyRecord(record) {
  state.currentUUID = record.uuid;
  sessionStorage.setItem("currentUUID", record.uuid);

  state.equipamentos = record.equipamentos || [];
  state.lastTipoOrdem = record.lastTipoOrdem || "";
  state.visitedRetorno = record.visitedRetorno || false;
  state.iniciais = record.iniciais || {};
  state.retorno = record.retorno || {};
  state._createdAt = record.createdAt;

  renderIniciais();
  DOM.tipoOrdem = document.getElementById("tipo-ordem");

  if (record.tipoOrdem && DOM.tipoOrdem) {
    DOM.tipoOrdem.value = record.tipoOrdem;
  }

  if (record.iniciais) {
    iniciaisFields.forEach((field) => {
      const el = document.getElementById(field.nome);
      if (el) el.value = record.iniciais[field.nome] || "";
    });
  }

  if (record.composicao?.complementoCorpo && DOM.complementoCorpo) {
    DOM.complementoCorpo.value = record.composicao.complementoCorpo;
  }

  showSection(record.currentSection || 1, "next", true);
}

import { DOM } from "./dom.js";
import { state, setCurrentUUID } from "./state.js";
import { renderIniciais, iniciaisFields } from "./iniciais.js";
import { showSection } from "./navigation.js";
import { base64ToBlob } from "./utils.js";

export function applyRecord(record) {
  setCurrentUUID(record.uuid);
  state.iniciaisValido = true;

  state.equipamentos = record.equipamentos || [];
  state.lastTipoOrdem = record.lastTipoOrdem || "";
  state.visitedRetorno = record.visitedRetorno || false;
  state.iniciais = record.iniciais || {};
  state.retorno = record.retorno || {};
  state._createdAt = record.createdAt;

  if (record.attachments && Array.isArray(record.attachments)) {
    state.attachments = record.attachments.map((att) => {
      const blob = base64ToBlob(att.data, att.type);
      return new File([blob], att.name, { type: att.type });
    });
  } else {
    state.attachments = [];
  }

  renderIniciais();
  DOM.tipoOrdem = document.getElementById("tipo-ordem");

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

  if (record.composicao?.complementoCorpo && DOM.complementoCorpo) {
    DOM.complementoCorpo.value = record.composicao.complementoCorpo;
  }

  showSection(record.currentSection || 1, "next", true);
}

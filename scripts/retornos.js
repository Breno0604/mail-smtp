import { DOM } from "./dom.js";
import { state, saveState } from "./state.js";
import { addBlurValidation } from "./validation.js";

export const retornoFields = {
  "ordem-servico": [
    { label: "Servi\u00E7o realizado", id: "servico-realizado", type: "textarea", required: true },
    { label: "Observa\u00E7\u00F5es", id: "observacoes", type: "textarea", required: false },
  ],
  "garantia": [
    { label: "Defeito relatado", id: "defeito-relatado", type: "textarea", required: true },
    { label: "A\u00E7\u00E3o tomada", id: "acao-tomada", type: "textarea", required: true },
  ],
  "orcamento": [
    { label: "Descri\u00E7\u00E3o", id: "descricao", type: "textarea", required: true },
    { label: "Valor estimado", id: "valor-estimado", type: "number", required: true },
  ],
};

export function renderRetorno() {
  const tipo = DOM.tipoOrdem.value;
  const tipoLabel = DOM.tipoOrdem.options[DOM.tipoOrdem.selectedIndex]?.text || "\u2014";
  DOM.retornoDesc.innerHTML = `Preencha as informa\u00E7\u00F5es para <strong>${tipoLabel}</strong>.`;
  DOM.retornoCampos.innerHTML = "";

  if (!tipo || !retornoFields[tipo]) {
    DOM.retornoCampos.innerHTML = '<p class="text-gray-400 text-base">Selecione um Tipo de ordem na se\u00E7\u00E3o anterior.</p>';
    return;
  }

  retornoFields[tipo].forEach((field) => {
    const group = document.createElement("div");
    group.className = "mb-4";

    const label = document.createElement("label");
    label.setAttribute("for", field.id);
    label.className = "block font-semibold text-base text-gray-700 mb-1";
    label.innerHTML = field.label + (field.required ? ' <span class="text-red-600">*</span>' : "");

    let input;
    if (field.type === "textarea") {
      input = document.createElement("textarea");
      input.setAttribute("rows", "4");
      input.className = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base font-sans text-gray-900 bg-white outline-none transition-all resize-y min-h-[80px] focus:border-blue-600 focus:ring-3 focus:ring-blue-600/15";
    } else {
      input = document.createElement("input");
      input.type = field.type;
      input.className = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base font-sans text-gray-900 bg-white outline-none transition-all focus:border-blue-600 focus:ring-3 focus:ring-blue-600/15";
    }

    input.id = field.id;
    if (field.required) input.setAttribute("data-required", "");
    input.placeholder = field.label;

    addBlurValidation(input);
    group.appendChild(label);
    group.appendChild(input);
    DOM.retornoCampos.appendChild(group);
  });
}

let pendingTipoValue = null;

export function handleTipoChange() {
  const sel = DOM.tipoOrdem;
  if (sel.value === state.lastTipoOrdem) return;
  if (state.lastTipoOrdem && state.visitedRetorno) {
    pendingTipoValue = sel.value;
    DOM.modalTipo.classList.remove("hidden");
    sel.value = state.lastTipoOrdem;
  } else {
    state.lastTipoOrdem = sel.value;
    saveState();
  }
}

export function cancelTipoChange() {
  DOM.modalTipo.classList.add("hidden");
  pendingTipoValue = null;
}

export function confirmTipoChange() {
  DOM.modalTipo.classList.add("hidden");
  state.lastTipoOrdem = pendingTipoValue;
  DOM.tipoOrdem.value = pendingTipoValue;
  DOM.retornoCampos.innerHTML = "";
  pendingTipoValue = null;
  saveState();
}

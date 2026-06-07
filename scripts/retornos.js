import { DOM } from "./dom.js";
import { state, saveState, debouncedSave } from "./state.js";
import { addBlurValidation } from "./validation.js";
import { retornoFields } from "./fields.js";

export { retornoFields };

const inputClass = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base font-sans text-gray-900 bg-white outline-none transition-all focus:border-blue-600 focus:ring-3 focus:ring-blue-600/15";

export function renderRetorno() {
  const tipoLabel = DOM.tipoOrdem.options[DOM.tipoOrdem.selectedIndex]?.text || "\u2014";
  DOM.retornoDesc.innerHTML = `Preencha as informa\u00E7\u00F5es de retorno para <strong>${tipoLabel}</strong>.`;
  DOM.retornoCampos.innerHTML = "";

  retornoFields.forEach((field) => {
    const group = document.createElement("div");
    group.className = "mb-4";

    const label = document.createElement("label");
    label.setAttribute("for", field.id);
    label.className = "block font-semibold text-base text-gray-700 mb-1";
    label.innerHTML = field.label + (field.required ? ' <span class="text-red-600">*</span>' : "");

    const input = document.createElement("textarea");
    input.setAttribute("rows", "4");
    input.id = field.id;
    if (field.required) input.setAttribute("data-required", "");
    input.placeholder = field.label;
    input.className = inputClass + " resize-y min-h-[80px]";

    addBlurValidation(input);
    input.addEventListener("input", debouncedSave);
    input.addEventListener("change", debouncedSave);
    group.appendChild(label);
    group.appendChild(input);
    DOM.retornoCampos.appendChild(group);
  });
}

export function getRetornoData() {
  const el = document.getElementById("descricao-retorno");
  return { descricao: el ? el.value : "" };
}

export function setRetornoData(data) {
  if (!data) return;
  const el = document.getElementById("descricao-retorno");
  if (el && data.descricao) el.value = data.descricao;
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

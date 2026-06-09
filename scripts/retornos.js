import { DOM } from "./dom.js";
import { state, saveState, debouncedSave } from "./state.js";
import { addBlurValidation } from "./validation.js";
import { retornoFields } from "./fields.js";
import { INPUT_CLASS } from "./styles.js";

export { retornoFields };

// Helper privado: evita repetir a query do elemento de descrição
const getDescricaoEl = () => document.getElementById("descricao-retorno");

export function renderRetorno() {
  const tipoLabel = DOM.tipoOrdem.options[DOM.tipoOrdem.selectedIndex]?.text || "—";
  DOM.retornoDesc.innerHTML = `Preencha as informações de retorno para <strong>${tipoLabel}</strong>.`;
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
    input.className = INPUT_CLASS + " resize-y min-h-[80px]";

    const errorSpan = document.createElement("span");
    errorSpan.className = "field-error";
    addBlurValidation(input);
    input.addEventListener("input", debouncedSave);
    input.addEventListener("change", debouncedSave);
    group.appendChild(label);
    group.appendChild(input);
    group.appendChild(errorSpan);
    DOM.retornoCampos.appendChild(group);
  });
}

export function getRetornoData() {
  const el = getDescricaoEl();
  return { descricao: el?.value ?? "" };
}

export function setRetornoData(data) {
  if (!data) return;
  const el = getDescricaoEl();
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

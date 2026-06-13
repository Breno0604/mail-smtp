import { DOM } from "./dom.js";
import { state } from "./state.js";
import { saveState, debouncedSave } from "./persistence.js";
import { addBlurValidation } from "./validation.js";
import { getRetornoFields } from "./fields.js";
import { INPUT_CREATORS } from "./iniciais.js";
import { INPUT_CLASS } from "./styles.js";

export function renderRetorno() {
  const tipo = DOM.tipoOrdem?.value || "";

  const tipoLabel = DOM.tipoOrdem?.options[DOM.tipoOrdem.selectedIndex]?.text || "—";
  DOM.retornoDesc.innerHTML = `<span class="text-base font-bold text-slate-900">${tipoLabel}</span>`;

  DOM.retornoCampos.innerHTML = "";

  if (!tipo) {
    DOM.retornoPlaceholder.style.display = "";
    return;
  }

  DOM.retornoPlaceholder.style.display = "none";

  const fields = getRetornoFields(tipo);
  const linhas = agruparPorLinha(fields);

  linhas.forEach((camposLinha) => {
    const isMultiCampo = camposLinha.length > 1;
    const rowDiv = document.createElement("div");
    rowDiv.className = isMultiCampo ? "flex gap-3 mb-4" : "mb-4";

    camposLinha.forEach((field) => {
      const group = document.createElement("div");
      group.className = isMultiCampo ? "flex-1" : "";
      group.dataset.fieldNome = field.nome;

      if (field.condicional) {
        group.dataset.condicionalRef = field.condicional.campoRef;
        group.dataset.condicionalVal = field.condicional.valor;
        group.style.display = "none";
      }

      const label = document.createElement("label");
      label.setAttribute("for", field.nome);
      label.className = "block font-semibold text-[13px] text-slate-600 mb-1";
      label.textContent = field.label;

      const creator = INPUT_CREATORS[field.tipo] ?? INPUT_CREATORS.text;
      const input = creator(field);
      input.id = field.nome;
      input.placeholder = field.label;
      input.setAttribute("data-required", "");

      addBlurValidation(input);
      input.addEventListener("input", debouncedSave);
      input.addEventListener("change", debouncedSave);

      if (hasConditionalDependents(field.nome, fields)) {
        input.addEventListener("change", () => updateConditionalFields(fields));
      }

      const errorSpan = document.createElement("span");
      errorSpan.className = "field-error";

      group.appendChild(label);
      group.appendChild(input);
      group.appendChild(errorSpan);
      rowDiv.appendChild(group);
    });

    DOM.retornoCampos.appendChild(rowDiv);
  });

  updateConditionalFields(fields);
}

function agruparPorLinha(fields) {
  const linhas = [];
  const mapa = new Map();

  fields.forEach((field) => {
    const linhaKey = field.linha ?? linhas.length;
    if (!mapa.has(linhaKey)) {
      mapa.set(linhaKey, []);
      linhas.push(mapa.get(linhaKey));
    }
    mapa.get(linhaKey).push(field);
  });

  return linhas;
}

function hasConditionalDependents(nome, fields) {
  return fields.some(f => f.condicional?.campoRef === nome);
}

function updateConditionalFields(fields) {
  fields.forEach((field) => {
    if (!field.condicional) return;

    const group = DOM.retornoCampos.querySelector(`[data-field-nome="${field.nome}"]`);
    if (!group) return;

    const controlEl = document.getElementById(field.condicional.campoRef);
    if (!controlEl) return;

    const valores = Array.isArray(field.condicional.valor)
      ? field.condicional.valor
      : [field.condicional.valor];
    const match = valores.includes(controlEl.value);
    const show = field.condicional.negado ? !match : match;

    if (show) {
      group.style.display = "";
    } else {
      group.style.display = "none";
      const input = group.querySelector("input, select, textarea");
      if (input) input.value = "";
    }
  });
}

export function setRetornoData(data) {
  if (!data) return;

  Object.entries(data).forEach(([nome, value]) => {
    const el = document.getElementById(nome);
    if (el) el.value = value;
  });

  const tipo = DOM.tipoOrdem?.value || "";
  if (tipo) {
    updateConditionalFields(getRetornoFields(tipo));
  }
}

export function handleTipoChange() {
  const tipo = DOM.tipoOrdem?.value || "";

  if (tipo === state.lastTipoOrdem) return;

  state.lastTipoOrdem = tipo;
  state.retorno = {};
  DOM.retornoCampos.innerHTML = "";
  renderRetorno();
  saveState();
}

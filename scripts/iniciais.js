import { DOM } from "./dom.js";
import { addBlurValidation } from "./validation.js";
import { iniciaisFields } from "./fields.js";
import { debouncedSave } from "./state.js";
import { captureCoordinates } from "./utils.js";
import { INPUT_CLASS, SELECT_CLASS } from "./styles.js";

export { iniciaisFields };

const linhaConfig = {
  4: "grid grid-cols-2 gap-3 mb-4",
  5: "grid grid-cols-2 gap-3 mb-4",
  6: "linha-data gap-3 mb-4",
};

// ── criadores de campo por tipo ───────────────────────────────────────────────

function createSelectInput(field) {
  const input = document.createElement("select");
  input.className = SELECT_CLASS;
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Selecione";
  input.appendChild(placeholder);
  (field.opcoes || []).forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt;
    option.textContent = opt;
    input.appendChild(option);
  });
  return input;
}

function createNumberInput() {
  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = "numeric";
  input.pattern = "[0-9]*";
  input.className = INPUT_CLASS;
  return input;
}

function createDateInput() {
  const input = document.createElement("input");
  input.type = "date";
  input.className = INPUT_CLASS;
  return input;
}

function createTimeInput() {
  const input = document.createElement("input");
  input.type = "time";
  input.step = "300";
  input.className = INPUT_CLASS;
  return input;
}

function createTextInput() {
  const input = document.createElement("input");
  input.type = "text";
  input.className = INPUT_CLASS;
  return input;
}

// Criador especial: widget de coordenadas com botão de refresh.
// Retorna o group diretamente (já inclui o wrapper interno) e atualiza DOM.tipoOrdem se aplicável.
function createCoordinatesGroup(field, label) {
  const coordWrapper = document.createElement("div");
  coordWrapper.style.position = "relative";
  coordWrapper.style.display = "inline-block";
  coordWrapper.style.width = "100%";

  const input = document.createElement("input");
  input.id = field.nome;
  input.type = "text";
  input.readOnly = true;
  input.className = INPUT_CLASS + " bg-gray-100 cursor-not-allowed";
  input.style.paddingRight = "40px";

  const refreshBtn = document.createElement("button");
  refreshBtn.type = "button";
  refreshBtn.className = "coord-refresh";
  refreshBtn.style.cssText =
    "position:absolute;right:8px;top:50%;transform:translateY(-50%);width:36px;height:36px;" +
    "display:flex;align-items:center;justify-content:center;border:1px solid #d1d5db;border-radius:8px;" +
    "background:#f9fafb;color:#2563eb;font-size:20px;cursor:pointer;transition:all 0.15s;z-index:10;" +
    "box-shadow:0 1px 3px rgba(0,0,0,0.08);";
  refreshBtn.innerHTML = "&#x21BB;";
  refreshBtn.title = "Atualizar coordenadas";
  refreshBtn.addEventListener("click", (e) => { e.preventDefault(); captureCoordinates(); });
  refreshBtn.addEventListener("mouseenter", () => {
    refreshBtn.style.color = "#2563eb";
    refreshBtn.style.background = "#eff6ff";
    refreshBtn.style.borderColor = "#3b82f6";
    refreshBtn.style.boxShadow = "0 2px 8px rgba(59,130,246,0.15)";
  });
  refreshBtn.addEventListener("mouseleave", () => {
    refreshBtn.style.color = "#2563eb";
    refreshBtn.style.background = "#f9fafb";
    refreshBtn.style.borderColor = "#d1d5db";
    refreshBtn.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
  });

  const coordError = document.createElement("span");
  coordError.className = "field-error";

  coordWrapper.appendChild(input);
  coordWrapper.appendChild(refreshBtn);
  coordWrapper.appendChild(coordError);

  const group = document.createElement("div");
  group.appendChild(label);
  group.appendChild(coordWrapper);
  return group;
}

// Tabela de criadores — evita if/else if encadeados em renderIniciais
const INPUT_CREATORS = {
  select: createSelectInput,
  number: createNumberInput,
  date: createDateInput,
  time: createTimeInput,
  text: createTextInput,
};

// ── funções exportadas ────────────────────────────────────────────────────────

export function renderIniciais() {
  DOM.iniciaisCampos.innerHTML = "";

  let currentLinha = null;
  let wrapper = null;

  iniciaisFields.forEach((field) => {
    if (field.linha !== currentLinha) {
      const config = linhaConfig[field.linha] || "mb-4";
      wrapper = document.createElement("div");
      wrapper.className = config;
      DOM.iniciaisCampos.appendChild(wrapper);
      currentLinha = field.linha;
    }

    const label = document.createElement("label");
    label.setAttribute("for", field.nome);
    label.className = "block font-semibold text-[13px] text-slate-600 mb-1";
    label.innerHTML = field.label + (field.obrigatorio ? ' <span class="text-red-600">*</span>' : "");

    // Tipo especial: coordenadas tem layout próprio
    if (field.tipo === "coordinates") {
      const group = createCoordinatesGroup(field, label);
      wrapper.appendChild(group);
      return;
    }

    const creator = INPUT_CREATORS[field.tipo] ?? createTextInput;
    const input = creator(field);
    input.id = field.nome;
    input.placeholder = field.label;
    if (field.obrigatorio) input.setAttribute("data-required", "");

    // Mantém o cache DOM atualizado para elementos criados dinamicamente.
    // Necessário porque tipo-ordem é criado por renderIniciais() após cacheDOM().
    if (field.nome === "tipo-ordem") DOM.tipoOrdem = input;

    addBlurValidation(input);
    input.addEventListener("input", debouncedSave);
    input.addEventListener("change", debouncedSave);

    const errorSpan = document.createElement("span");
    errorSpan.className = "field-error";

    const group = document.createElement("div");
    group.appendChild(label);
    group.appendChild(input);
    group.appendChild(errorSpan);
    wrapper.appendChild(group);
  });
}

export function getIniciaisData() {
  const data = {};
  iniciaisFields.forEach((field) => {
    const el = document.getElementById(field.nome);
    data[field.nome] = el ? el.value : "";
  });
  return data;
}

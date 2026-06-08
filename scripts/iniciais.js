import { DOM } from "./dom.js";
import { addBlurValidation } from "./validation.js";
import { iniciaisFields } from "./fields.js";
import { debouncedSave } from "./state.js";
import { captureCoordinates } from "./app.js";

export { iniciaisFields };

const linhaConfig = {
  4: "grid grid-cols-2 gap-3 mb-4",
  5: "grid grid-cols-2 gap-3 mb-4",
  6: "linha-data gap-3 mb-4",
};

const inputClass = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base font-sans text-gray-900 bg-white outline-none transition-all focus:border-blue-600 focus:ring-3 focus:ring-blue-600/15";
const selectClass = inputClass + " py-3";

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

    const group = document.createElement("div");

    const label = document.createElement("label");
    label.setAttribute("for", field.nome);
    label.className = "block font-semibold text-base text-gray-700 mb-1";
    label.innerHTML = field.label + (field.obrigatorio ? ' <span class="text-red-600">*</span>' : "");

    let input;
    if (field.tipo === "select") {
      input = document.createElement("select");
      input.className = selectClass;
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
    } else if (field.tipo === "number") {
      input = document.createElement("input");
      input.type = "text";
      input.inputMode = "numeric";
      input.pattern = "[0-9]*";
      input.className = inputClass;
    } else if (field.tipo === "date") {
      input = document.createElement("input");
      input.type = "date";
      input.className = inputClass;
    } else if (field.tipo === "time") {
      input = document.createElement("input");
      input.type = "time";
      input.step = "300";
      input.className = inputClass;
    } else if (field.tipo === "coordinates") {
      const coordWrapper = document.createElement("div");
      coordWrapper.style.position = "relative";
      coordWrapper.style.display = "inline-block";
      coordWrapper.style.width = "100%";

      input = document.createElement("input");
      input.id = field.nome;
      input.type = "text";
      input.readOnly = true;
      input.className = inputClass + " bg-gray-100 cursor-not-allowed";
      input.style.paddingRight = "40px";

      const refreshBtn = document.createElement("button");
      refreshBtn.type = "button";
      refreshBtn.className = "coord-refresh";
      refreshBtn.style.cssText = "position:absolute;right:8px;top:50%;transform:translateY(-50%);width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:none;border-radius:4px;background:transparent;color:#6b7280;font-size:16px;cursor:pointer;transition:color 0.2s,background 0.2s;z-index:10;";
      refreshBtn.innerHTML = "&#x21BB;";
      refreshBtn.title = "Atualizar coordenadas";
      refreshBtn.addEventListener("click", (e) => {
        e.preventDefault();
        captureCoordinates();
      });
      refreshBtn.addEventListener("mouseenter", () => {
        refreshBtn.style.color = "#2563eb";
        refreshBtn.style.background = "#eff6ff";
      });
      refreshBtn.addEventListener("mouseleave", () => {
        refreshBtn.style.color = "#6b7280";
        refreshBtn.style.background = "transparent";
      });

      coordWrapper.appendChild(input);
      coordWrapper.appendChild(refreshBtn);

      group.appendChild(label);
      group.appendChild(coordWrapper);
      wrapper.appendChild(group);
      return;
    } else {
      input = document.createElement("input");
      input.type = "text";
      input.className = inputClass;
    }

    input.id = field.nome;
    input.placeholder = field.label;
    if (field.obrigatorio) input.setAttribute("data-required", "");

    addBlurValidation(input);
    input.addEventListener("input", debouncedSave);
    input.addEventListener("change", debouncedSave);
    group.appendChild(label);
    group.appendChild(input);
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

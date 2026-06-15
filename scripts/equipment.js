import { DOM } from "./dom.js";
import { state } from "./state.js";
import { saveState, debouncedSave } from "./persistence.js";
import { addBlurValidation } from "./validation.js";
import { collectEquipamentos } from "./collectors.js";

/**
 * Render a single equipment row (does NOT save)
 * @param {Object} data - Equipment data
 * @returns {HTMLElement} The rendered row element
 */
export function renderEquipRow(data) {
  const div = document.createElement("div");
  div.className = "equip-row flex gap-2 items-center mb-4 p-3 bg-slate-50/50 border border-slate-200/50 rounded-[10px]";
  div.innerHTML = `
    <select class="equip-tipo flex-1 min-w-0 px-3 py-3 border rounded-[10px] text-sm outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10 text-slate-900 font-sans">
      <option value="">Selecione...</option>
      <option value="Instalado" ${data?.status === "Instalado" ? "selected" : ""}>Instalado</option>
      <option value="Retirado" ${data?.status === "Retirado" ? "selected" : ""}>Retirado</option>
    </select>
    <select class="equip-categoria flex-1 min-w-0 px-3 py-3 border rounded-[10px] text-sm outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10 text-slate-900 font-sans">
      <option value="">Selecione...</option>
      <option value="Medidor" ${data?.categoria === "Medidor" ? "selected" : ""}>Medidor</option>
      <option value="Display" ${data?.categoria === "Display" ? "selected" : ""}>Display</option>
      <option value="Conjunto" ${data?.categoria === "Conjunto" ? "selected" : ""}>Conjunto</option>
      <option value="TC" ${data?.categoria === "TC" ? "selected" : ""}>TC</option>
      <option value="TP" ${data?.categoria === "TP" ? "selected" : ""}>TP</option>
    </select>
    <input type="number" class="equip-numero flex-1 min-w-0 px-3 py-3 border rounded-[10px] text-sm outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10 text-slate-900 font-sans" placeholder="N°" value="${data?.numero || ""}">
    <button class="btn-remove w-9 h-9 border-none rounded-[8px] bg-red-50 text-red-500 text-sm cursor-pointer flex-shrink-0 transition-all duration-200 flex items-center justify-center hover:bg-red-100 active:scale-95" type="button">✕</button>
  `;

  addBlurValidation(div.querySelector(".equip-tipo"));
  addBlurValidation(div.querySelector(".equip-categoria"));
  addBlurValidation(div.querySelector(".equip-numero"));

  // Update state on input/change
  const equipFields = div.querySelectorAll(".equip-tipo, .equip-categoria, .equip-numero");
  equipFields.forEach((field) => {
    field.addEventListener("input", () => {
      collectEquipamentos();
      debouncedSave();
    });
    field.addEventListener("change", () => {
      collectEquipamentos();
      debouncedSave();
    });
  });

  div.querySelector(".btn-remove").addEventListener("click", () => {
    div.remove();
    if (DOM.equipList.querySelectorAll(".equip-row").length === 0) showEmptyEquip();
    collectEquipamentos();
    saveState();
  });

  return div;
}

/**
 * Add a new equipment row and save (user action)
 * @param {Object} data - Equipment data
 */
export function addEquip(data) {
  const div = renderEquipRow(data);
  DOM.equipList.appendChild(div);
  hideEmptyEquip();
  collectEquipamentos();
  saveState();
}

export function showEmptyEquip() {
  if (!DOM.equipList.querySelector(".empty-msg")) {
    const msg = document.createElement("div");
    msg.className = "empty-msg text-center text-slate-400 text-sm font-medium py-8 bg-slate-50/30 border border-dashed border-slate-200 rounded-[10px] mb-4";
    msg.textContent = "Nenhum equipamento adicionado.";
    DOM.equipList.appendChild(msg);
  }
}

export function hideEmptyEquip() {
  const msg = DOM.equipList.querySelector(".empty-msg");
  if (msg) msg.remove();
}

/**
 * Render all equipment from state (does NOT save)
 */
export function renderEquipamentos() {
  DOM.equipList.innerHTML = "";
  if (state.equipamentos.length === 0) {
    showEmptyEquip();
  } else {
    state.equipamentos.forEach((eq) => {
      const row = renderEquipRow(eq);
      DOM.equipList.appendChild(row);
    });
    collectEquipamentos();
  }
}

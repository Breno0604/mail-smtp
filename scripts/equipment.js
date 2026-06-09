import { DOM } from "./dom.js";
import { state, saveState } from "./state.js";
import { addBlurValidation } from "./validation.js";

export function addEquip(data) {
  const div = document.createElement("div");
  div.className = "equip-row flex gap-2 items-center mb-2.5 p-2 bg-slate-50/50 border border-slate-200/50 rounded-xl shadow-sm";
  div.innerHTML = `
    <select class="equip-tipo flex-1 min-w-0 px-2 py-2 border border-slate-200 rounded-lg text-base outline-none bg-white transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-800 font-sans">
      <option value="">Selecione...</option>
      <option value="Instalado" ${data?.status === "Instalado" ? "selected" : ""}>Instalado</option>
      <option value="Retirado" ${data?.status === "Retirado" ? "selected" : ""}>Retirado</option>
    </select>
    <select class="equip-categoria flex-1 min-w-0 px-2 py-2 border border-slate-200 rounded-lg text-base outline-none bg-white transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-800 font-sans">
      <option value="">Selecione...</option>
      <option value="Medidor" ${data?.categoria === "Medidor" ? "selected" : ""}>Medidor</option>
      <option value="Display" ${data?.categoria === "Display" ? "selected" : ""}>Display</option>
      <option value="Conjunto" ${data?.categoria === "Conjunto" ? "selected" : ""}>Conjunto</option>
      <option value="TC" ${data?.categoria === "TC" ? "selected" : ""}>TC</option>
      <option value="TP" ${data?.categoria === "TP" ? "selected" : ""}>TP</option>
    </select>
    <input type="number" class="equip-numero flex-1 min-w-0 px-2 py-2 border border-slate-200 rounded-lg text-base outline-none bg-white transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-800 font-sans placeholder-slate-400" placeholder="N\u00B0" value="${data?.numero || ""}">
    <button class="btn-remove w-8 h-8 border-none rounded-lg bg-red-50 text-red-500 text-sm cursor-pointer flex-shrink-0 transition-all duration-200 flex items-center justify-center hover:bg-red-100 hover:scale-105 active:scale-95" type="button">\u2715</button>
  `;

  addBlurValidation(div.querySelector(".equip-tipo"));
  addBlurValidation(div.querySelector(".equip-categoria"));
  addBlurValidation(div.querySelector(".equip-numero"));

  div.querySelector(".btn-remove").addEventListener("click", () => {
    div.remove();
    if (DOM.equipList.querySelectorAll(".equip-row").length === 0) showEmptyEquip();
    updateSkipBtn();
    collectEquipamentos();
    saveState();
  });

  DOM.equipList.appendChild(div);
  hideEmptyEquip();
  updateSkipBtn();
  collectEquipamentos();
  saveState();
}

export function showEmptyEquip() {
  if (!DOM.equipList.querySelector(".empty-msg")) {
    const msg = document.createElement("div");
    msg.className = "empty-msg text-center text-slate-400 text-sm font-medium py-8 bg-slate-50/30 border border-dashed border-slate-200 rounded-xl mb-4";
    msg.textContent = "Nenhum equipamento adicionado.";
    DOM.equipList.appendChild(msg);
  }
}

export function hideEmptyEquip() {
  const msg = DOM.equipList.querySelector(".empty-msg");
  if (msg) msg.remove();
}

export function updateSkipBtn() {
  const rows = DOM.equipList.querySelectorAll(".equip-row");
  DOM.btnSkipEquip.style.display = rows.length === 0 ? "inline" : "none";
}

export function collectEquipamentos() {
  const rows = DOM.equipList.querySelectorAll(".equip-row");
  state.equipamentos = [];
  rows.forEach((row) => {
    state.equipamentos.push({
      status: row.querySelector(".equip-tipo").value,
      categoria: row.querySelector(".equip-categoria").value,
      numero: row.querySelector(".equip-numero").value,
    });
  });
}

export function renderEquipamentos() {
  DOM.equipList.innerHTML = "";
  if (state.equipamentos.length === 0) {
    showEmptyEquip();
  } else {
    state.equipamentos.forEach((eq) => addEquip(eq));
  }
  updateSkipBtn();
}

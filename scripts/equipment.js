import { DOM } from "./dom.js";
import { state, saveState } from "./state.js";
import { addBlurValidation } from "./validation.js";

export function addEquip(data) {
  const div = document.createElement("div");
  div.className = "equip-row flex gap-1 items-center mb-1 py-1.5 bg-gray-50 rounded-lg";
  div.innerHTML = `
    <select class="equip-tipo flex-1 min-w-0 px-1.5 py-2.5 border border-gray-300 rounded-lg text-base outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-600/15">
      <option value="">Selecione...</option>
      <option value="Instalado" ${data?.status === "Instalado" ? "selected" : ""}>Instalado</option>
      <option value="Retirado" ${data?.status === "Retirado" ? "selected" : ""}>Retirado</option>
    </select>
    <select class="equip-categoria flex-1 min-w-0 px-1.5 py-2.5 border border-gray-300 rounded-lg text-base outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-600/15">
      <option value="">Selecione...</option>
      <option value="Medidor" ${data?.categoria === "Medidor" ? "selected" : ""}>Medidor</option>
      <option value="Display" ${data?.categoria === "Display" ? "selected" : ""}>Display</option>
      <option value="Conjunto" ${data?.categoria === "Conjunto" ? "selected" : ""}>Conjunto</option>
      <option value="TC" ${data?.categoria === "TC" ? "selected" : ""}>TC</option>
      <option value="TP" ${data?.categoria === "TP" ? "selected" : ""}>TP</option>
    </select>
    <input type="number" class="equip-numero flex-1 min-w-0 px-1.5 py-2.5 border border-gray-300 rounded-lg text-base outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-600/15" placeholder="N\u00B0" value="${data?.numero || ""}">
    <button class="btn-remove w-7 h-7 border-none rounded-lg bg-red-50 text-red-500 text-xs cursor-pointer flex-shrink-0 transition-colors duration-200 flex items-center justify-center hover:bg-red-200" type="button">\u2715</button>
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
    msg.className = "empty-msg text-center text-gray-500 text-base py-5";
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

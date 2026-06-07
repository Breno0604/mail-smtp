import { DOM } from "./dom.js";
import { iniciaisFields } from "./iniciais.js";
import { retornoFields } from "./retornos.js";

export function composeEmail() {
  let body = "";

  iniciaisFields.forEach((field) => {
    const el = document.getElementById(field.nome);
    const val = el ? el.value || "\u2014" : "\u2014";
    body += `${field.label}: ${val}\n`;
  });

  const eqs = DOM.equipList.querySelectorAll(".equip-row");
  if (eqs.length > 0) {
    body += "\n\nEquipamentos:";
    eqs.forEach((row) => {
      const status = row.querySelector(".equip-tipo").value;
      const categoria = row.querySelector(".equip-categoria").value;
      const num = row.querySelector(".equip-numero").value || "\u2014";
      body += `\n${categoria} ${status} N\u00BA ${num}`;
    });
  }

  body += "\n\nRetorno:";
  retornoFields.forEach((field) => {
    const el = document.getElementById(field.id);
    if (el) body += `\n${field.label}: ${el.value || "(n\u00E3o preenchido)"}`;
  });

  DOM.previewCorpo.textContent = body;
}

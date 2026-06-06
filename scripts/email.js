import { DOM } from "./dom.js";
import { state } from "./state.js";
import { retornoFields } from "./retornos.js";

export function composeEmail() {
  const uc = DOM.uc.value || "\u2014";
  const os = DOM.os.value || "\u2014";
  const cliente = DOM.cliente.value || "\u2014";
  const tipoLabel = DOM.tipoOrdem.options[DOM.tipoOrdem.selectedIndex]?.text || "\u2014";
  const assunto = `OS #${os} - ${cliente} - ${tipoLabel}`;
  DOM.previewAssunto.textContent = assunto;

  let body = `UC: ${uc}\nOS: ${os}\nCliente: ${cliente}\nTipo de ordem: ${tipoLabel}`;

  const eqs = DOM.equipList.querySelectorAll(".equip-row");
  if (eqs.length > 0) {
    body += "\n\nEquipamentos:";
    eqs.forEach((row) => {
      const status = row.querySelector(".equip-tipo").value;
      const categoria = row.querySelector(".equip-categoria").value;
      const num = row.querySelector(".equip-numero").value || "\u2014";
      body += `\n- ${status} - ${categoria} - N\u00B0 ${num}`;
    });
  }

  const tipoKey = DOM.tipoOrdem.value;
  if (tipoKey && retornoFields[tipoKey]) {
    body += "\n\nRetorno:";
    retornoFields[tipoKey].forEach((field) => {
      const el = document.getElementById(field.id);
      if (el) body += `\n${field.label}: ${el.value || "(n\u00E3o preenchido)"}`;
    });
  }

  DOM.previewCorpo.textContent = body;

  if (state.attachments.length === 0) {
    DOM.previewAnexos.textContent = "Nenhum anexo";
  } else {
    DOM.previewAnexos.textContent = `${state.attachments.length} arquivo(s): ${state.attachments.map((f) => f.name).join(", ")}`;
  }
}

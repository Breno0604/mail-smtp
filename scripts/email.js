import { DOM } from "./dom.js";
import { state } from "./state.js";
import { iniciaisFields, getRetornoFields } from "./fields.js";
import { getIniciaisData } from "./iniciais.js";
import { getRetornoData } from "./retornos.js";

/**
 * Normaliza texto: remove acentos, substitui ç→c, converte para MAIÚSCULAS
 */
function normalizeText(str) {
  if (!str) return str;
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "C")
    .toUpperCase();
}

export function composeEmail(data) {
  let body = "";

  iniciaisFields.forEach((field) => {
    const raw = data.iniciais?.[field.nome] || "";
    const val = raw && field.tipo === "date"
      ? raw.split("-").reverse().join("-")
      : (raw || "\u2014");
    body += `${normalizeText(field.label)}: ${normalizeText(val)}\n`;
  });

  if (data.equipamentos && data.equipamentos.length > 0) {
    body += "\n\nEQUIPAMENTOS:";
    data.equipamentos.forEach((eq) => {
      body += `\n${normalizeText(eq.categoria)} ${normalizeText(eq.status)} N\u00BA ${normalizeText(eq.numero || "\u2014")}`;
    });
  }

  body += "\n\nRETORNO:";
  const tipo = data.iniciais?.["tipo-ordem"] || "";
  const retornoFields = getRetornoFields(tipo);

  retornoFields.forEach((field) => {
    const val = data.retorno?.[field.nome] || "";
    body += `\n${normalizeText(field.label)}: ${normalizeText(val || "(nao preenchido)")}`;
  });

  return body;
}

export function updateLivePreview() {
  const emailData = {
    iniciais: getIniciaisData(),
    equipamentos: state.equipamentos,
    retorno: getRetornoData(),
  };
  DOM.previewCorpo.textContent = composeEmail(emailData);
}

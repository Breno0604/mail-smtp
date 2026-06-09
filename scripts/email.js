import { iniciaisFields } from "./fields.js";
import { retornoFields } from "./fields.js";

/**
 * Normaliza texto: remove acentos, substitui ç→c, converte para MAIÚSCULAS
 */
function normalizeText(str) {
  if (!str) return str;
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
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
  retornoFields.forEach((field) => {
    const val = data.retorno?.descricao || "";
    body += `\n${normalizeText(field.label)}: ${normalizeText(val || "(nao preenchido)")}`;
  });

  return body;
}

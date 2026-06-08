import { iniciaisFields } from "./iniciais.js";
import { retornoFields } from "./retornos.js";

export function composeEmail(data) {
  let body = "";

  iniciaisFields.forEach((field) => {
    const raw = data.iniciais?.[field.nome] || "";
    const val = raw && field.tipo === "date"
      ? raw.split("-").reverse().join("-")
      : (raw || "\u2014");
    body += `${field.label}: ${val}\n`;
  });

  if (data.equipamentos && data.equipamentos.length > 0) {
    body += "\n\nEquipamentos:";
    data.equipamentos.forEach((eq) => {
      body += `\n${eq.categoria} ${eq.status} N\u00BA ${eq.numero || "\u2014"}`;
    });
  }

  body += "\n\nRetorno:";
  retornoFields.forEach((field) => {
    const val = data.retorno?.descricao || "";
    body += `\n${field.label}: ${val || "(n\u00E3o preenchido)"}`;
  });

  return body;
}

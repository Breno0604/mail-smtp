import { DOM } from "./dom.js";
import { state } from "./state.js";
import { showError, hideError } from "./ui.js";
import { getIniciaisData } from "./iniciais.js";
import { getRetornoData } from "./retornos.js";
import { iniciaisFields as fieldsIniciais } from "./fields.js";

export function validateSection(n, { equipamentos = [] } = {}) {
  hideError();
  let valid = true;

  if (n === 1) {
    fieldsIniciais.forEach((field) => {
      if (!field.obrigatorio) return;
      const el = document.getElementById(field.nome);
      if (el) {
        if (!el.value || el.value.trim() === "") {
          el.classList.add("error");
          valid = false;
        } else {
          el.classList.remove("error");
        }
      }
    });
    if (!valid) {
      showError("Preencha todos os campos obrigatórios.");
      return false;
    }

    let errorMsg = "";
    const dataEl = document.getElementById("data");
    if (dataEl && dataEl.value) {
      const selectedDate = new Date(dataEl.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate > today) {
        dataEl.classList.add("error");
        errorMsg = "Data não pode ser futura.";
      } else {
        dataEl.classList.remove("error");
      }
    }
    const horaInicioEl = document.getElementById("hora_inicio");
    const horaFimEl = document.getElementById("hora_fim");
    if (horaInicioEl && horaFimEl && horaInicioEl.value && horaFimEl.value) {
      if (horaFimEl.value <= horaInicioEl.value) {
        horaFimEl.classList.add("error");
        errorMsg = errorMsg
          ? errorMsg + " Hora fim deve ser maior que hora início."
          : "Hora fim deve ser maior que hora início.";
      } else {
        horaFimEl.classList.remove("error");
      }
    }
    if (errorMsg) {
      showError(errorMsg);
      valid = false;
    }
  }

  if (n === 2) {
    const rows = DOM.equipList.querySelectorAll(".equip-row");
    if (rows.length > 0) {
      let hasError = false;
      let hasDuplicate = false;
      const nums = [];
      rows.forEach((row) => {
        const tipo = row.querySelector(".equip-tipo");
        const categoria = row.querySelector(".equip-categoria");
        const inp = row.querySelector(".equip-numero");
        [tipo, categoria, inp].forEach((el) => el.classList.remove("error"));
        if (tipo.value === "") { tipo.classList.add("error"); hasError = true; }
        if (categoria.value === "") { categoria.classList.add("error"); hasError = true; }
        if (inp.value === "") { inp.classList.add("error"); hasError = true; }
        else if (nums.includes(inp.value)) { inp.classList.add("error"); hasError = true; hasDuplicate = true; }
        else { nums.push(inp.value); }
      });
      if (hasError) {
        showError(hasDuplicate
          ? "N\u00BA de equipamento duplicado."
          : "Preencha todos os campos de cada equipamento.");
        valid = false;
      }
    }
  }

  if (n === 3) {
    const campos = DOM.retornoCampos.querySelectorAll("textarea, input");
    campos.forEach((el) => {
      if (el.hasAttribute("data-required") && el.value.trim() === "") {
        el.classList.add("error");
        valid = false;
      } else {
        el.classList.remove("error");
      }
    });
    if (!valid) showError("Preencha todos os campos obrigat\u00F3rios.");
  }

  return valid;
}

export function addBlurValidation(el) {
  el.addEventListener("blur", () => {
    if (el.hasAttribute("required") || el.hasAttribute("data-required")) {
      el.classList.toggle("error", !el.value || el.value.trim() === "");
    }
  });
  el.addEventListener("input", () => el.classList.remove("error"));
  el.addEventListener("change", () => {
    if (el.value && el.value.trim() !== "") el.classList.remove("error");
  });
}

export function collectSectionData(n) {
  if (n === 1) {
    state.iniciais = getIniciaisData();
  }
  if (n === 2) {
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
  if (n === 3) {
    state.retorno = getRetornoData();
  }
}

/**
 * Verifica se todos os campos obrigatórios de Iniciais estão preenchidos corretamente.
 * Versão silenciosa de validateSection(1) — não modifica UI, apenas retorna boolean.
 */
export function isIniciaisValid() {
  for (const field of fieldsIniciais) {
    if (!field.obrigatorio) continue;
    const el = document.getElementById(field.nome);
    if (!el || !el.value || el.value.trim() === "") return false;
  }

  const dataEl = document.getElementById("data");
  if (dataEl && dataEl.value) {
    const selectedDate = new Date(dataEl.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate > today) return false;
  }

  const horaInicioEl = document.getElementById("hora_inicio");
  const horaFimEl = document.getElementById("hora_fim");
  if (horaInicioEl && horaFimEl && horaInicioEl.value && horaFimEl.value) {
    if (horaFimEl.value <= horaInicioEl.value) return false;
  }

  return true;
}

import { DOM } from "./dom.js";
import { state } from "./state.js";
import { showError, hideError, setFieldError, clearFieldError } from "./ui.js";
import { getIniciaisData } from "./iniciais.js";
import { getRetornoData } from "./retornos.js";
import { iniciaisFields as fieldsIniciais } from "./fields.js";
import { collectEquipamentos } from "./equipment.js";

// Cache de uso único: validateSection popula, collectSectionData consome e limpa.
// Isso evita a re-leitura do DOM quando collectSectionData segue validateSection.
const _validatedData = {};

// Limpa o cache (usado nos testes entre execuções)
export function _resetValidationCache() {
  Object.keys(_validatedData).forEach((k) => delete _validatedData[k]);
}

// ── helpers locais ────────────────────────────────────────────────────────────

function markError(el, msg) {
  el.classList.add("error");
  setFieldError(el, msg);
}

function clearError(el) {
  el.classList.remove("error");
  clearFieldError(el);
}

// ── validadores por seção (Strategy pattern) ─────────────────────────────────

function validateSection1() {
  // Passo único pelo DOM: coleta valores + refs de todos os campos
  const data = {};
  let valid = true;

  fieldsIniciais.forEach((field) => {
    const el = document.getElementById(field.nome);
    if (!el) return;
    data[field.nome] = el.value;

    if (!field.obrigatorio) return;
    if (!data[field.nome] || data[field.nome].trim() === "") {
      markError(el, "Campo obrigatório");
      valid = false;
    } else {
      clearError(el);
    }
  });

  if (!valid) return false;

  // Validações especiais usando os dados já coletados
  let errorMsg = "";

  const dataEl = document.getElementById("data");
  if (dataEl && data.data) {
    const selectedDate = new Date(data.data);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate > today) {
      markError(dataEl, "Data não pode ser futura.");
      errorMsg = "Data não pode ser futura.";
    } else {
      clearError(dataEl);
    }
  }

  const horaInicioEl = document.getElementById("hora_inicio");
  const horaFimEl = document.getElementById("hora_fim");
  if (horaInicioEl && horaFimEl && data.hora_inicio && data.hora_fim) {
    if (data.hora_fim <= data.hora_inicio) {
      markError(horaFimEl, "Hora fim deve ser maior que hora início.");
      errorMsg = errorMsg
        ? errorMsg + " Hora fim deve ser maior que hora início."
        : "Hora fim deve ser maior que hora início.";
    } else {
      clearError(horaFimEl);
    }
  }

  if (errorMsg) {
    showError(errorMsg);
    return false;
  }

  // Cache + state — collectSectionData usa o cache em vez de reler o DOM
  state.iniciais = data;
  _validatedData[1] = data;
  return true;
}

function validateSection2() {
  const rows = DOM.equipList.querySelectorAll(".equip-row");
  if (rows.length === 0) return true;

  let hasError = false;
  let hasDuplicate = false;
  const nums = [];

  rows.forEach((row) => {
    const tipo = row.querySelector(".equip-tipo");
    const categoria = row.querySelector(".equip-categoria");
    const inp = row.querySelector(".equip-numero");

    [tipo, categoria, inp].forEach((el) => clearError(el));

    if (tipo.value === "") { markError(tipo, "Selecione o tipo"); hasError = true; }
    if (categoria.value === "") { markError(categoria, "Selecione a categoria"); hasError = true; }
    if (inp.value === "") {
      markError(inp, "Informe o número");
      hasError = true;
    } else if (nums.includes(inp.value)) {
      markError(inp, "Número duplicado");
      hasError = true;
      hasDuplicate = true;
    } else {
      nums.push(inp.value);
    }
  });

  if (hasError) return false;

  collectEquipamentos();
  _validatedData[2] = state.equipamentos;
  return true;
}

function validateSection3() {
  if (DOM.retornoCampos.children.length === 0) {
    showError("Navegue até a seção de Retorno primeiro.");
    return false;
  }

  const campos = DOM.retornoCampos.querySelectorAll("textarea, input");
  let valid = true;
  let descricao = "";

  campos.forEach((el) => {
    if (el.hasAttribute("data-required") && el.value.trim() === "") {
      markError(el, "Campo obrigatório");
      valid = false;
    } else {
      clearError(el);
      if (el.id === "descricao-retorno") descricao = el.value;
    }
  });

  if (!valid) return false;

  state.retorno = { descricao };
  _validatedData[3] = { descricao };
  return true;
}

function validateSection4() {
  if (state.attachments.length > 12) {
    showError("Máximo de 12 anexos permitido.");
    return false;
  }
  const oversized = state.attachments.filter((f) => f.size > 8 * 1024 * 1024);
  if (oversized.length > 0) {
    showError(
      "Anexo(s) excedem 8 MB: " +
        oversized.map((f) => f.name).join(", ") +
        "."
    );
    return false;
  }
  return true;
}

// Tabela de validadores — adicionar novas seções aqui sem tocar em validateSection()
const SECTION_VALIDATORS = {
  1: validateSection1,
  2: validateSection2,
  3: validateSection3,
  4: validateSection4,
  5: () => true, // seção de revisão — nenhum campo novo para validar
};

// ── API pública ───────────────────────────────────────────────────────────────

export function validateSection(n) {
  hideError();
  const validator = SECTION_VALIDATORS[n];
  if (!validator) return true;
  return validator();
}

export function addBlurValidation(el) {
  el.addEventListener("blur", () => {
    if (el.hasAttribute("required") || el.hasAttribute("data-required")) {
      const empty = !el.value || el.value.trim() === "";
      if (empty) {
        markError(el, "Campo obrigatório");
      } else {
        clearError(el);
      }
    }
  });
  el.addEventListener("input", () => clearError(el));
  el.addEventListener("change", () => {
    if (el.value && el.value.trim() !== "") clearError(el);
  });
}

export function collectSectionData(n) {
  if (n === 1) {
    if (_validatedData[1] && typeof _validatedData[1] === 'object' && _validatedData[1].lider) {
      state.iniciais = _validatedData[1];
      delete _validatedData[1];
    } else {
      state.iniciais = getIniciaisData();
    }
  }
  if (n === 2) {
    if (Array.isArray(_validatedData[2])) {
      state.equipamentos = _validatedData[2];
      delete _validatedData[2];
    } else {
      collectEquipamentos();
    }
  }
  if (n === 3) {
    if (_validatedData[3] && typeof _validatedData[3] === 'object' && _validatedData[3].descricao !== undefined) {
      state.retorno = _validatedData[3];
      delete _validatedData[3];
    } else {
      state.retorno = getRetornoData();
    }
  }
}

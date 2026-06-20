import { DOM } from "./dom.js";
import { state } from "./state.js";
import { showError, hideError, setFieldError, clearFieldError } from "./ui.js";
import { collectIniciais, collectRetorno, collectEquipamentos } from "./collectors.js";
import { iniciaisFields as fieldsIniciais } from "./fields.js";

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
  let hasSpecialError = false;

  // Validação de UC: apenas números
  const ucEl = document.getElementById("uc");
  if (ucEl && data.uc) {
    if (!/^\d+$/.test(data.uc)) {
      markError(ucEl, "UC deve conter apenas números");
      hasSpecialError = true;
    } else {
      clearError(ucEl);
    }
  }

  const dataEl = document.getElementById("data");
  if (dataEl && data.data) {
    const selectedDate = new Date(data.data);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate > today) {
      markError(dataEl, "Data não pode ser futura.");
      hasSpecialError = true;
    } else {
      clearError(dataEl);
    }
  }

  const horaInicioEl = document.getElementById("hora_inicio");
  const horaFimEl = document.getElementById("hora_fim");
  if (horaInicioEl && horaFimEl && data.hora_inicio && data.hora_fim) {
    // Permitir overnight (ex: 23:00 → 01:00), mas impedir duração zero (ex: 10:00 → 10:00)
    if (data.hora_fim === data.hora_inicio) {
      markError(horaFimEl, "Hora fim deve ser diferente da hora início.");
      hasSpecialError = true;
    } else {
      clearError(horaFimEl);
    }
  }

  if (hasSpecialError) {
    return false;
  }

  // Update state
  state.iniciais = data;
  return true;
}

function validateSection2() {
  const instalado = state.equipamentos.instaladoEquip;
  const retirado = state.equipamentos.retiradoEquip;
  
  // If both NAO, no validation needed
  if (instalado === 'NAO' && retirado === 'NAO') {
    return true;
  }
  
  let hasError = false;
  
  // Validate installed equipment
  if (instalado === 'SIM') {
    const hasAtLeastOne = Object.values(state.equipamentos.instalados).some((val) => val && val.trim() !== '');
    if (!hasAtLeastOne) {
      const firstInput = document.querySelector('#campos-instalados input[type="number"]');
      if (firstInput) {
        markError(firstInput, 'Preencha pelo menos um equipamento');
      }
      hasError = true;
    }
  }
  
  // Validate removed equipment
  if (retirado === 'SIM') {
    const hasAtLeastOne = Object.values(state.equipamentos.retirados).some((val) => val && val.trim() !== '');
    if (!hasAtLeastOne) {
      const firstInput = document.querySelector('#campos-retirados input[type="number"]');
      if (firstInput) {
        markError(firstInput, 'Preencha pelo menos um equipamento');
      }
      hasError = true;
    }
  }
  
  if (hasError) return false;
  
  return true;
}

function validateSection3() {
  const tipo = DOM.tipoOrdem?.value || "";
  if (!tipo) return true;

  // Iterar sobre todos os campos individuais usando [data-field-nome]
  // Isso funciona tanto para layout antigo (um campo por .mb-4) quanto novo (múltiplos campos por linha flex)
  const fieldGroups = DOM.retornoCampos.querySelectorAll("[data-field-nome]");
  let valid = true;

  fieldGroups.forEach((group) => {
    // Skip hidden conditional fields
    if (group.style.display === "none") return;

    const input = group.querySelector("input, select, textarea");
    if (!input) return;

    if (!input.value || input.value.trim() === "") {
      markError(input, "Campo obrigatório");
      valid = false;
    } else {
      clearError(input);
    }
  });

  if (!valid) return false;

  // Update state
  collectRetorno();
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

export function validateAll() {
  hideError();
  let firstError = null;
  let valid = true;

  // Section 1: Iniciais
  const s1Valid = validateSection1();
  if (!s1Valid && !firstError) {
    firstError = document.querySelector("#sec-inicio .error");
  }
  valid = valid && s1Valid;

  // Section 3: Retorno (only if tipo is selected)
  const tipo = DOM.tipoOrdem?.value || "";
  if (tipo) {
    const s3Valid = validateSection3();
    if (!s3Valid && !firstError) {
      firstError = document.querySelector("#sec-retorno .error");
    }
    valid = valid && s3Valid;
  }

  // Section 2: Equipamentos (optional, but validate if rows exist)
  const s2Valid = validateSection2();
  if (!s2Valid && !firstError) {
    firstError = document.querySelector("#sec-equipamentos .error");
  }
  valid = valid && s2Valid;

  // Section 4: Anexos
  const s4Valid = validateSection4();
  if (!s4Valid && !firstError) {
    firstError = document.querySelector("#sec-anexos .error");
  }
  valid = valid && s4Valid;

  // Scroll to first error
  if (firstError) {
    firstError.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return valid;
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

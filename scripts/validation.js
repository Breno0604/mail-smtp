import { DOM } from './dom.js';
import { state } from './state.js';
import { showError, hideError, setFieldError, clearFieldError, showAnexosModal } from './ui.js';
import { collectRetorno } from './collectors.js';
import { iniciaisFields as fieldsIniciais } from './fields.js';

// ── helpers locais ────────────────────────────────────────────────────────────

function markError(el, msg) {
  el.classList.add('error');
  setFieldError(el, msg);
}

function clearError(el) {
  el.classList.remove('error');
  clearFieldError(el);
}

// ── Validações específicas por campo (configurável) ─────────────────────────
// Adicione novas regras aqui em vez de criar else-if no loop de validação.
const FIELD_VALIDATIONS = {
  descricao: {
    minLength: 5,
    maxLength: 2000,
    minMessage: 'Descrição deve ter no mínimo 5 caracteres',
    maxMessage: 'Descrição deve ter no máximo 2000 caracteres',
  },
};

// ── validadores por seção (Strategy pattern) ─────────────────────────────────

function validateSection1() {
  // Passo único pelo DOM: coleta valores + refs de todos os campos
  const data = {};
  let valid = true;

  fieldsIniciais.forEach(field => {
    const el = document.getElementById(field.nome);
    if (!el) return;
    data[field.nome] = el.value;

    if (!field.obrigatorio) return;
    if (!data[field.nome] || data[field.nome].trim() === '') {
      markError(el, 'Campo obrigatório');
      valid = false;
    } else {
      clearError(el);
    }
  });

  if (!valid) return false;

  // Validações especiais usando os dados já coletados
  let hasSpecialError = false;

  // Validação de UC: apenas números, 5 a 10 dígitos
  const ucEl = document.getElementById('uc');
  if (ucEl && data.uc) {
    if (!/^\d+$/.test(data.uc)) {
      markError(ucEl, 'UC deve conter apenas números');
      hasSpecialError = true;
    } else if (data.uc.length < 5 || data.uc.length > 10) {
      markError(ucEl, 'UC deve ter entre 5 e 10 dígitos');
      hasSpecialError = true;
    } else {
      clearError(ucEl);
    }
  }

  // Validação de OS: apenas números e letra A (somente no início), 5 a 10 caracteres
  const osEl = document.getElementById('os');
  if (osEl && data.os) {
    if (!/^A?\d+$/.test(data.os)) {
      markError(osEl, 'OS deve conter apenas números e a letra A (apenas no início)');
      hasSpecialError = true;
    } else if (data.os.length < 5 || data.os.length > 10) {
      markError(osEl, 'OS deve ter entre 5 e 10 dígitos');
      hasSpecialError = true;
    } else {
      clearError(osEl);
    }
  }

  const dataEl = document.getElementById('data');
  if (dataEl && data.data) {
    const selectedDate = new Date(data.data);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate > today) {
      markError(dataEl, 'Data não pode ser futura.');
      hasSpecialError = true;
    } else {
      clearError(dataEl);
    }
  }

  const horaInicioEl = document.getElementById('hora_inicio');
  const horaFimEl = document.getElementById('hora_fim');
  if (horaInicioEl && horaFimEl && data.hora_inicio && data.hora_fim) {
    // Permitir overnight (ex: 23:00 → 01:00), mas impedir duração zero (ex: 10:00 → 10:00)
    if (data.hora_fim === data.hora_inicio) {
      markError(horaFimEl, 'Hora fim deve ser diferente da hora início.');
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

/**
 * Validate a single equipment group (instalados or retirados).
 * Checks that all visible numeric inputs in the group are filled.
 * @param {'instalados'|'retirados'} tipo - The equipment group type
 * @param {HTMLElement} selectEl - The control select element to mark error on
 * @returns {boolean} Whether the group passed validation
 */
function validateEquipmentGroup(tipo, selectEl) {
  const inputs = document.querySelectorAll(`#campos-${tipo} input[type="number"]`);
  let hasAtLeastOneFilled = false;
  let hasError = false;

  if (inputs.length === 0) {
    markError(selectEl, 'Selecione e preencha pelo menos um equipamento');
    return false;
  }

  inputs.forEach(input => {
    if (!input.value || input.value.trim() === '') {
      markError(input, 'Campo obrigatório');
      hasError = true;
    } else {
      clearError(input);
      hasAtLeastOneFilled = true;
    }
  });

  if (!hasAtLeastOneFilled) {
    hasError = true;
  }

  return !hasError;
}

function validateSection2() {
  const instaladoSelect = DOM.instaladoEquip;
  const retiradoSelect = DOM.retiradoEquip;

  let hasError = false;

  // Validate control selects (required fields)
  if (!instaladoSelect.value || instaladoSelect.value.trim() === '') {
    markError(instaladoSelect, 'Campo obrigatório');
    hasError = true;
  } else {
    clearError(instaladoSelect);
  }

  if (!retiradoSelect.value || retiradoSelect.value.trim() === '') {
    markError(retiradoSelect, 'Campo obrigatório');
    hasError = true;
  } else {
    clearError(retiradoSelect);
  }

  const instalado = state.equipamentos.instaladoEquip;
  const retirado = state.equipamentos.retiradoEquip;

  // If both NAO or empty (not selected yet), no further validation needed for equipment fields
  if ((instalado === 'NAO' || instalado === '') && (retirado === 'NAO' || retirado === '')) {
    return !hasError;
  }

  if (instalado === 'SIM') {
    if (!validateEquipmentGroup('instalados', DOM.instaladoEquip)) {
      hasError = true;
    }
  }

  if (retirado === 'SIM') {
    if (!validateEquipmentGroup('retirados', DOM.retiradoEquip)) {
      hasError = true;
    }
  }

  return !hasError;
}

function validateSection3() {
  const tipo = DOM.tipoOrdem?.value || '';
  if (!tipo) return true;

  // Iterar sobre todos os campos individuais usando [data-field-nome]
  // Isso funciona tanto para layout antigo (um campo por .mb-4) quanto novo (múltiplos campos por linha flex)
  const fieldGroups = DOM.retornoCampos.querySelectorAll('[data-field-nome]');
  let valid = true;

  fieldGroups.forEach(group => {
    // Skip hidden conditional fields
    if (group.style.display === 'none') return;

    const input = group.querySelector('input, select, textarea');
    if (!input) return;

    if (!input.value || input.value.trim() === '') {
      markError(input, 'Campo obrigatório');
      valid = false;
    } else {
      const rules = FIELD_VALIDATIONS[input.id];
      if (rules) {
        const trimmed = input.value.trim();
        if (rules.minLength && trimmed.length < rules.minLength) {
          markError(input, rules.minMessage);
          valid = false;
        } else if (rules.maxLength && input.value.length > rules.maxLength) {
          markError(input, rules.maxMessage);
          valid = false;
        } else {
          clearError(input);
        }
      } else {
        clearError(input);
      }
    }
  });

  if (!valid) return false;

  // Update state
  collectRetorno();
  return true;
}

function validateSection4() {
  if (state.attachments.length < 2 || state.attachments.length > 12) {
    showAnexosModal();
    return false;
  }
  const oversized = state.attachments.filter(f => f.size > 8 * 1024 * 1024);
  if (oversized.length > 0) {
    showError('Anexo(s) excedem 8 MB: ' + oversized.map(f => f.name).join(', ') + '.');
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

  // Run all section validators — they mark ALL empty fields with .error AND update state
  let valid = true;

  // Section 1: Iniciais
  valid = validateSection1() && valid;

  // Section 3: Retorno (only if tipo is selected)
  const tipo = DOM.tipoOrdem?.value || '';
  if (tipo) {
    valid = validateSection3() && valid;
  }

  // Section 2: Equipamentos
  valid = validateSection2() && valid;

  // Section 4: Anexos
  valid = validateSection4() && valid;

  // After all validators ran, keep only the first .error, clear the rest
  const allErrors = document.querySelectorAll('.error');
  if (allErrors.length > 0) {
    const firstError = allErrors[0];
    // Clear all but the first error (so only the first field shows red)
    for (let i = 1; i < allErrors.length; i++) {
      clearError(allErrors[i]);
    }
    // Focus and scroll to the first error
    firstError.focus();
    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return valid;
}

export function addBlurValidation(el) {
  el.addEventListener('blur', () => {
    if (el.hasAttribute('required') || el.hasAttribute('data-required')) {
      const empty = !el.value || el.value.trim() === '';
      if (empty) {
        markError(el, 'Campo obrigatório');
      } else {
        clearError(el);
      }
    }
  });
  el.addEventListener('input', () => clearError(el));
  el.addEventListener('change', () => {
    if (el.value && el.value.trim() !== '') clearError(el);
  });
}

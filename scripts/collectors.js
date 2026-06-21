// scripts/collectors.js
import { DOM } from './dom.js';
import { state } from './state.js';
import { iniciaisFields, getRetornoFields } from './fields.js';

/**
 * Collect initial fields from DOM and update state
 * @returns {Object} Collected initial data
 */
export function collectIniciais() {
  const data = {};
  iniciaisFields.forEach(field => {
    const el = document.getElementById(field.nome);
    data[field.nome] = el ? el.value : '';
  });
  state.iniciais = data;
  return data;
}

/**
 * Collect retorno fields from DOM and update state
 * @returns {Object} Collected retorno data
 */
export function collectRetorno() {
  const tipo = DOM.tipoOrdem?.value || '';
  if (!tipo) {
    state.retorno = {};
    return {};
  }

  const fields = getRetornoFields(tipo);
  const data = {};

  fields.forEach(field => {
    const group = DOM.retornoCampos.querySelector(`[data-field-nome="${field.nome}"]`);
    if (!group || group.style.display === 'none') return;

    const el = document.getElementById(field.nome);
    if (el) data[field.nome] = el.value;
  });

  state.retorno = data;
  return data;
}

/**
 * Collect equipment data from DOM and update state
 * @returns {Object} Collected equipment data
 */
export function collectEquipamentos() {
  // Collect control fields
  const instaladoSelect = document.getElementById('instalado-equip');
  const retiradoSelect = document.getElementById('retirado-equip');

  if (instaladoSelect) {
    state.equipamentos.instaladoEquip = instaladoSelect.value;
  }
  if (retiradoSelect) {
    state.equipamentos.retiradoEquip = retiradoSelect.value;
  }

  // Collect installed equipment values
  const installedInputs = document.querySelectorAll('#campos-instalados input[type="number"]');
  installedInputs.forEach(input => {
    const equipKey = input.getAttribute('data-equip');
    if (equipKey) {
      state.equipamentos.instalados[equipKey] = input.value;
    }
  });

  // Collect removed equipment values
  const removedInputs = document.querySelectorAll('#campos-retirados input[type="number"]');
  removedInputs.forEach(input => {
    const equipKey = input.getAttribute('data-equip');
    if (equipKey) {
      state.equipamentos.retirados[equipKey] = input.value;
    }
  });

  return state.equipamentos;
}

/**
 * Collect all form data from state (single source of truth)
 * @returns {Object} Complete record data
 */
export function collectAllData() {
  return {
    iniciais: state.iniciais,
    retorno: state.retorno,
    equipamentos: state.equipamentos,
    attachments: state.attachments,
    tipoOrdem: state.iniciais['tipo-ordem'] || '',
  };
}

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
  iniciaisFields.forEach((field) => {
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

  fields.forEach((field) => {
    const group = DOM.retornoCampos.querySelector(`[data-field-nome="${field.nome}"]`);
    if (!group || group.style.display === 'none') return;

    const el = document.getElementById(field.nome);
    if (el) data[field.nome] = el.value;
  });

  state.retorno = data;
  return data;
}

/**
 * Collect equipment rows from DOM and update state
 * @returns {Array} Collected equipment data
 */
export function collectEquipamentos() {
  const rows = DOM.equipList.querySelectorAll('.equip-row');
  const data = [];
  rows.forEach((row) => {
    data.push({
      status: row.querySelector('.equip-tipo').value,
      categoria: row.querySelector('.equip-categoria').value,
      numero: row.querySelector('.equip-numero').value,
    });
  });
  state.equipamentos = data;
  return data;
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
    composicao: state.composicao,
  };
}

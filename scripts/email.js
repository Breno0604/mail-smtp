import { DOM } from './dom.js';
import { iniciaisFields, getRetornoFields } from './fields.js';
import { collectAllData } from './collectors.js';

/**
 * Normaliza texto: remove acentos, substitui ç→c, converte para MAIÚSCULAS
 */
function normalizeText(str) {
  if (typeof str !== 'string' || !str) return str;
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C')
    .toUpperCase();
}

const EQUIP_LABELS = {
  medidor: 'MEDIDOR',
  conjunto: 'CONJUNTO',
  display: 'DISPLAY',
  tc_fase_a: 'TC FASE A',
  tc_fase_b: 'TC FASE B',
  tc_fase_c: 'TC FASE C',
  tp_fase_a: 'TP FASE A',
  tp_fase_b: 'TP FASE B',
  tp_fase_c: 'TP FASE C',
};

export function composeEmail(data) {
  let body = '';

  iniciaisFields.forEach(field => {
    const raw = data.iniciais?.[field.nome] || '';
    const val = raw && field.tipo === 'date' ? raw.split('-').reverse().join('-') : raw || '\u2014';
    body += `${normalizeText(field.label)}: ${normalizeText(val)}\n`;
  });

  if (data.equipamentos.instaladoEquip === 'SIM') {
    const installedItems = Object.keys(data.equipamentos.instalados)
      .filter(
        key => data.equipamentos.instalados[key] && data.equipamentos.instalados[key].trim() !== ''
      )
      .map(key => `${EQUIP_LABELS[key]}: ${normalizeText(data.equipamentos.instalados[key])}`);

    if (installedItems.length > 0) {
      body += '\nEQUIPAMENTOS INSTALADOS:';
      body += '\n' + installedItems.join('\n');
    }
  }

  if (data.equipamentos.retiradoEquip === 'SIM') {
    const removedItems = Object.keys(data.equipamentos.retirados)
      .filter(
        key => data.equipamentos.retirados[key] && data.equipamentos.retirados[key].trim() !== ''
      )
      .map(key => `${EQUIP_LABELS[key]}: ${normalizeText(data.equipamentos.retirados[key])}`);

    if (removedItems.length > 0) {
      body += '\nEQUIPAMENTOS RETIRADOS:';
      body += '\n' + removedItems.join('\n');
    }
  }

  const tipo = data.iniciais?.['tipo-ordem'] || '';
  const retornoFields = getRetornoFields(tipo);

  retornoFields.forEach(field => {
    if (!data.retorno || !(field.nome in data.retorno)) return;
    const val = data.retorno[field.nome];
    body += `\n${normalizeText(field.label)}: ${normalizeText(val || '(nao preenchido)')}`;
  });

  return body;
}

export function updateLivePreview() {
  const data = collectAllData();
  DOM.previewCorpo.textContent = composeEmail(data);
}

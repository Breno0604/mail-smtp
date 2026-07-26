import { DOM } from './dom.js';
import { getRetornoFields } from './fields.js';
import { collectAllData } from './collectors.js';
import { EQUIPMENT_KEYS } from './equipment-keys.js';
import { formatDate } from './utils.js';
import { retornoTemplates } from './data/retorno-templates.js';

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

// Build EQUIP_LABELS from EQUIPMENT_KEYS (single source of truth)
const EQUIP_LABELS = {};
EQUIPMENT_KEYS.forEach(e => {
  EQUIP_LABELS[e.key] = e.label;
});

function matchCondition(condicao, data) {
  if (!condicao) return true;
  if (Array.isArray(condicao)) {
    return condicao.every(c => matchCondition(c, data));
  }
  const valorCampo = data.retorno?.[condicao.campo];
  if (condicao.valor !== undefined) {
    const valores = Array.isArray(condicao.valor) ? condicao.valor : [condicao.valor];
    return valores.includes(valorCampo);
  }
  if (condicao.diferenteDe !== undefined) {
    return valorCampo !== condicao.diferenteDe;
  }
  return false;
}

function resolvePlaceholders(texto, data) {
  for (const [nome, valor] of Object.entries(data.retorno || {})) {
    texto = texto.replaceAll(`{${nome}}`, valor || '');
  }
  for (const [nome, valor] of Object.entries(data.iniciais || {})) {
    texto = texto.replaceAll(`{${nome}}`, valor || '');
  }
  return texto;
}

export function applyRetornoTemplate(tipo, data) {
  const template = retornoTemplates[tipo];
  if (!template) return null;

  const variante = template.find(v => matchCondition(v.condicao, data));
  if (!variante) return null;

  return variante.blocos
    .filter(bloco => matchCondition(bloco.condicao, data))
    .map(bloco => resolvePlaceholders(bloco.texto, data))
    .join('\n');
}

export function composeEmail(data) {
  let body = '';

  const headerFields = [
    { nome: 'tipo-ordem', label: 'TIPO' },
    { nome: 'os', label: 'OS' },
    { nome: 'uc', label: 'UC' },
    { nome: 'municipio', label: 'MUNICIPIO' },
    { nome: 'notificado', label: 'NOTIFICADO' },
    { nome: 'placa', label: 'PLACA' },
    { nome: 'coordenadas', label: 'COORDENADAS' },
  ];

  headerFields.forEach(field => {
    const raw = data.iniciais?.[field.nome] || '';
    body += `${field.label}: ${normalizeText(raw || '\u2014')}\n`;
  });

  body += '\n';

  const lider = data.iniciais?.lider || '';
  const parceiro = data.iniciais?.parceiro || '';
  const tecnicos = [lider, parceiro].filter(Boolean).join(' E ');
  body += `TECNICOS: ${normalizeText(tecnicos || '\u2014')}\n`;

  const dataRaw = data.iniciais?.data || '';
  const horaInicio = data.iniciais?.hora_inicio || '';
  const horaFim = data.iniciais?.hora_fim || '';
  const dataFormatada = dataRaw ? formatDate(dataRaw, { dateOnly: true }) : '';
  const dataParts = [dataFormatada, horaInicio, horaFim ? `AS ${horaFim}` : ''].filter(Boolean);
  body += `DATA: ${normalizeText(dataParts.join(' ') || '\u2014')}\n`;

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
      body += '\n\nEQUIPAMENTOS RETIRADOS:';
      body += '\n' + removedItems.join('\n') + '\n';
    }
  }

  const tipo = data.iniciais?.['tipo-ordem'] || '';

  const textoPersonalizado = applyRetornoTemplate(tipo, data);

  if (textoPersonalizado) {
    body += '\n' + normalizeText(textoPersonalizado);
  } else {
    const retornoFields = getRetornoFields(tipo);
    retornoFields.forEach(field => {
      if (!data.retorno || !(field.nome in data.retorno)) return;
      const val = data.retorno[field.nome];
      body += `\n${normalizeText(field.label)}: ${normalizeText(val || '(nao preenchido)')}`;
    });
  }

  return body;
}

export function updateLivePreview() {
  const data = collectAllData();
  DOM.previewCorpo.textContent = composeEmail(data);
}

import { DOM } from './dom.js';
import { iniciaisFields, getRetornoFields } from './fields.js';
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

export function applyRetornoTemplate(tipo, data) {
  const template = retornoTemplates[tipo];
  if (!template) return null;

  const variante = template.find(v => {
    if (!v.condicao) return true;
    const valorCampo = data.retorno?.[v.condicao.campo];
    if (v.condicao.valor !== undefined) {
      const valores = Array.isArray(v.condicao.valor) ? v.condicao.valor : [v.condicao.valor];
      return valores.includes(valorCampo);
    }
    if (v.condicao.diferenteDe !== undefined) {
      return valorCampo !== v.condicao.diferenteDe;
    }
    return false;
  });

  if (!variante) return null;

  return variante.blocos
    .map(bloco => {
      let texto = bloco.texto;
      for (const [nome, valor] of Object.entries(data.retorno || {})) {
        texto = texto.replaceAll(`{${nome}}`, valor || '');
      }
      for (const [nome, valor] of Object.entries(data.iniciais || {})) {
        texto = texto.replaceAll(`{${nome}}`, valor || '');
      }
      return texto;
    })
    .join('\n');
}

export function composeEmail(data) {
  let body = '';

  iniciaisFields.forEach(field => {
    const raw = data.iniciais?.[field.nome] || '';
    const val =
      raw && field.tipo === 'date' ? formatDate(raw, { dateOnly: true }) : raw || '\u2014';
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

  const textoPersonalizado = applyRetornoTemplate(tipo, data);

  if (textoPersonalizado) {
    body += '\n' + textoPersonalizado;
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

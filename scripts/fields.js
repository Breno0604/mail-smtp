// scripts/fields.js
// Field configurations and lookup logic.
// Static data (arrays, field definitions) lives in scripts/data/fields-data.js.

import {
  nomesTecnicos,
  municipioOptions,
  placaOptions,
  tipoOrdemOptions,
  retornoFieldsByTipo,
} from './data/fields-data.js';

export const iniciaisFields = [
  { linha: 0, nome: 'coordenadas', label: 'Coordenadas', tipo: 'coordinates', readonly: true },
  {
    linha: 1,
    nome: 'lider',
    label: 'Líder',
    tipo: 'select',
    obrigatorio: true,
    opcoes: nomesTecnicos,
  },
  {
    linha: 2,
    nome: 'parceiro',
    label: 'Parceiro',
    tipo: 'select',
    obrigatorio: true,
    opcoes: nomesTecnicos,
  },
  {
    linha: 3,
    nome: 'municipio',
    label: 'Município',
    tipo: 'select',
    obrigatorio: true,
    opcoes: municipioOptions,
  },
  { linha: 4, nome: 'uc', label: 'UC', tipo: 'number', obrigatorio: true },
  { linha: 4, nome: 'os', label: 'OS', tipo: 'text', obrigatorio: true },
  {
    linha: 5,
    nome: 'notificado',
    label: 'Notificado',
    tipo: 'select',
    obrigatorio: true,
    opcoes: ['SIM', 'NÃO'],
  },
  {
    linha: 5,
    nome: 'placa',
    label: 'Placa',
    tipo: 'select',
    obrigatorio: true,
    opcoes: placaOptions,
  },
  { linha: 6, nome: 'data', label: 'Data', tipo: 'date', obrigatorio: true },
  { linha: 6, nome: 'hora_inicio', label: 'Início', tipo: 'time', obrigatorio: true },
  { linha: 6, nome: 'hora_fim', label: 'Fim', tipo: 'time', obrigatorio: true },
  {
    linha: 7,
    nome: 'tipo-ordem',
    label: 'Tipo de Ordem',
    tipo: 'select',
    obrigatorio: true,
    opcoes: tipoOrdemOptions,
  },
];

export { retornoFieldsByTipo };

export function getRetornoFields(tipo) {
  return retornoFieldsByTipo[tipo] || retornoFieldsByTipo['default'];
}

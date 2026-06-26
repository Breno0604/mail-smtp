// scripts/data/retorno-templates.js
// Templates declarativos de retorno por Tipo de Ordem.
// Formato:
//   "NOME DO TIPO": [
//     { condicao: { campo: "nome", valor: "X" }, blocos: [...] },  // variante condicional
//     { blocos: [...] }  // else (opcional, sem condicao)
//   ]
//
// Cada bloco dentro de blocos também pode ter condicao:
//   { texto: "...", condicao: { campo: "nome", valor: "X" } }
// Se a condicao do bloco for falsa, o bloco é omitido.

const UC_CORTADA_TEMPLATE = [
  {
    blocos: [
      { texto: 'CLIENTE ENCONTRADO {situacao-cliente}, {ramal}, {medicao}, {jump}, {chaves}' },
      { texto: 'VIAVEL RETIRAR {viavel-retirar}' },
      { texto: 'TOI: {toi}', condicao: { campo: 'aplicado-toi', valor: 'SIM' } },
      { texto: '' },
      { texto: '{descricao}' },
    ],
  },
];

export const retornoTemplates = {
  'CORTE POR FALTA DE PAGAMENTO': [
    {
      blocos: [{ texto: '{situacao_corte}.' }, { texto: '{descricao}' }],
    },
  ],

  'INSPECAO UC CORTADA I15': UC_CORTADA_TEMPLATE,
  'INSPECAO UC CORTADA I30': UC_CORTADA_TEMPLATE,
  'INSPECAO UC CORTADA I90': UC_CORTADA_TEMPLATE,
  'INSPECAO UC CORTADA I180': UC_CORTADA_TEMPLATE,
};

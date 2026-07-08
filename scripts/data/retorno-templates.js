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

const LIGACAO_NOVA_MT_TEMPLATE = [
  // Variant 1: VISTORIA only
  {
    condicao: { campo: 'retorno_ligacao', valor: 'VISTORIA' },
    blocos: [
      {
        condicao: { campo: 'obra', valor: 'CONCLUIDA' },
        texto: 'OBRA CONCLUIDA',
      },
      {
        condicao: { campo: 'obra', valor: 'NAO CONCLUIDA' },
        texto: 'OBRA NAO CONCLUIDA',
      },
      // Medição — compound conditions (AND)
      {
        condicao: [
          { campo: 'status_medicao', valor: 'COM MEDICAO' },
          { campo: 'tipo_medicao', valor: 'ACOPLADA' },
        ],
        texto: 'COM MEDICAO ACOPLADO NO LOCAL',
      },
      {
        condicao: [
          { campo: 'status_medicao', valor: 'COM MEDICAO' },
          { campo: 'tipo_medicao', valor: 'CUBICULO' },
        ],
        texto: 'COM MEDICAO CUBICULO NO LOCAL',
      },
      {
        condicao: [
          { campo: 'status_medicao', valor: 'COM MEDICAO' },
          { campo: 'tipo_medicao', valor: 'SEMI-DIRETA' },
        ],
        texto: 'COM MEDICAO SEMI-DIRETA NO LOCAL',
      },
      {
        condicao: [
          { campo: 'status_medicao', valor: 'COM MEDICAO' },
          { campo: 'tipo_medicao', valor: 'DIRETA' },
        ],
        texto: 'COM MEDICAO DIRETA NO LOCAL',
      },
      {
        condicao: { campo: 'status_medicao', valor: 'SEM MEDICAO' },
        texto: 'SEM MEDICAO NO LOCAL',
      },
      // Ponto de Entrega
      {
        condicao: { campo: 'ponto_de_entrega', valor: 'DE ACORDO' },
        texto: 'PONTO DE ENTREGA DE ACORDO COM PROJETO',
      },
      {
        condicao: { campo: 'ponto_de_entrega', valor: 'EM DESACORDO' },
        texto: 'PONTO DE ENTREGA EM DESACORDO COM O PROJETO',
      },
      {
        condicao: { campo: 'ponto_de_entrega', valor: 'NÃO CONSTRUIDO' },
        texto: 'PONTO DE ENTREGA NÃO CONSTRUIDO',
      },
      // Medidor de BT
      {
        condicao: { campo: 'medidor_bt', valor: 'COM MEDIDOR BT' },
        texto: 'COM {qtd_medidor_bt} MEDIDOR DE BT',
      },
      {
        condicao: { campo: 'medidor_bt', valor: 'SEM MEDIDOR BT' },
        texto: 'SEM MEDIDOR DE BT',
      },
      // Acesso
      {
        condicao: { campo: 'acesso_medicao', valor: 'REGULAR' },
        texto: 'ACESSO A MEDICAO REGULAR',
      },
      {
        condicao: { campo: 'acesso_medicao', valor: 'IRREGULAR' },
        texto: 'ACESSO A MEDICAO IRREGULAR DEVIDO {acesso_ponto_de_entrega}',
      },
      {
        condicao: { campo: 'acesso_medicao', valor: 'SEM ACESSO' },
        texto: 'SEM ACESSO A MEDICAO DEVIDO {acesso_ponto_de_entrega}',
      },
      { texto: '' },
      { texto: '{descricao}' },
    ],
  },
  // Variant 2: LIGAÇÃO only
  {
    condicao: { campo: 'retorno_ligacao', valor: 'LIGAÇÃO' },
    blocos: [
      {
        condicao: { campo: 'ligacao', valor: 'CONCLUIDA' },
        texto: 'LIGAÇÃO CONCLUIDA',
      },
      {
        condicao: { campo: 'ligacao', valor: 'NAO CONCLUIDA' },
        texto: 'LIGAÇÃO NAO CONCLUIDA',
      },
      {
        condicao: { campo: 'tombamento', diferenteDe: '' },
        texto: 'TOMBAMENTO: {tombamento}',
      },
      { texto: '' },
      { texto: '{descricao}' },
    ],
  },
  // Variant 3: VISTORIA + LIGAÇÃO
  {
    condicao: { campo: 'retorno_ligacao', valor: 'VISTORIA + LIGAÇÃO' },
    blocos: [
      {
        condicao: { campo: 'ligacao', valor: 'CONCLUIDA' },
        texto: 'LIGAÇÃO CONCLUIDA',
      },
      {
        condicao: { campo: 'ligacao', valor: 'NAO CONCLUIDA' },
        texto: 'LIGAÇÃO NAO CONCLUIDA',
      },
      {
        condicao: { campo: 'tombamento', diferenteDe: '' },
        texto: 'TOMBAMENTO: {tombamento}',
      },
      // Obra
      {
        condicao: { campo: 'obra', valor: 'CONCLUIDA' },
        texto: 'OBRA CONCLUIDA',
      },
      {
        condicao: { campo: 'obra', valor: 'NAO CONCLUIDA' },
        texto: 'OBRA NAO CONCLUIDA',
      },
      // Medição — compound conditions
      {
        condicao: [
          { campo: 'status_medicao', valor: 'COM MEDICAO' },
          { campo: 'tipo_medicao', valor: 'ACOPLADA' },
        ],
        texto: 'COM MEDICAO ACOPLADO NO LOCAL',
      },
      {
        condicao: [
          { campo: 'status_medicao', valor: 'COM MEDICAO' },
          { campo: 'tipo_medicao', valor: 'CUBICULO' },
        ],
        texto: 'COM MEDICAO CUBICULO NO LOCAL',
      },
      {
        condicao: [
          { campo: 'status_medicao', valor: 'COM MEDICAO' },
          { campo: 'tipo_medicao', valor: 'SEMI-DIRETA' },
        ],
        texto: 'COM MEDICAO SEMI-DIRETA NO LOCAL',
      },
      {
        condicao: [
          { campo: 'status_medicao', valor: 'COM MEDICAO' },
          { campo: 'tipo_medicao', valor: 'DIRETA' },
        ],
        texto: 'COM MEDICAO DIRETA NO LOCAL',
      },
      {
        condicao: { campo: 'status_medicao', valor: 'SEM MEDICAO' },
        texto: 'SEM MEDICAO NO LOCAL',
      },
      // Ponto de Entrega
      {
        condicao: { campo: 'ponto_de_entrega', valor: 'DE ACORDO' },
        texto: 'PONTO DE ENTREGA DE ACORDO COM PROJETO',
      },
      {
        condicao: { campo: 'ponto_de_entrega', valor: 'EM DESACORDO' },
        texto: 'PONTO DE ENTREGA EM DESACORDO COM O PROJETO',
      },
      {
        condicao: { campo: 'ponto_de_entrega', valor: 'NÃO CONSTRUIDO' },
        texto: 'PONTO DE ENTREGA NÃO CONSTRUIDO',
      },
      // Medidor de BT
      {
        condicao: { campo: 'medidor_bt', valor: 'COM MEDIDOR BT' },
        texto: 'COM {qtd_medidor_bt} MEDIDOR DE BT',
      },
      {
        condicao: { campo: 'medidor_bt', valor: 'SEM MEDIDOR BT' },
        texto: 'SEM MEDIDOR DE BT',
      },
      // Acesso
      {
        condicao: { campo: 'acesso_medicao', valor: 'REGULAR' },
        texto: 'ACESSO A MEDICAO REGULAR',
      },
      {
        condicao: { campo: 'acesso_medicao', valor: 'IRREGULAR' },
        texto: 'ACESSO A MEDICAO IRREGULAR DEVIDO {acesso_ponto_de_entrega}',
      },
      {
        condicao: { campo: 'acesso_medicao', valor: 'SEM ACESSO' },
        texto: 'SEM ACESSO A MEDICAO DEVIDO {acesso_ponto_de_entrega}',
      },
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

  'LIGACAO NOVA MEDIA TENSAO': LIGACAO_NOVA_MT_TEMPLATE,
  'LIGACAO NOVA MT - CLIENTE LIVRE': LIGACAO_NOVA_MT_TEMPLATE,
};

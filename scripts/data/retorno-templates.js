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
      {
        texto: 'VIAVEL RETIRAR {viavel-retirar}',
        condicao: { campo: 'viavel-retirar', diferenteDe: 'N/A' },
      },
      { texto: 'TOI: {toi}', condicao: { campo: 'aplicado-toi', valor: 'SIM' } },
      { texto: '' },
      { texto: '{descricao}' },
    ],
  },
];

const DESCRICAO_TEMPLATE = [
  {
    blocos: [{ texto: '{descricao}' }],
  },
];

const TELEMEDICAO_TEMPLATE = [
  {
    condicao: { campo: 'executado_telemedicao', valor: 'SIM' },
    blocos: [
      { texto: 'EXECUTADO: SIM' },
      { texto: 'ATENDENTE: {atentende_com}' },
      { texto: 'REALIZADO: {realizado_telemedicao}' },
      { texto: '' },
      { texto: '{descricao}' },
    ],
  },
  {
    condicao: { campo: 'executado_telemedicao', valor: 'NAO' },
    blocos: [
      { texto: 'EXECUTADO: NAO' },
      { texto: 'MOTIVO: {motivo_cancelamento_telemedicao}' },
      {
        texto: 'PROBLEMA: {descreva_problema_telemedicao}',
        condicao: {
          campo: 'motivo_cancelamento_telemedicao',
          valor: ['SEM ACESSO', 'OUTRO MOTIVO'],
        },
      },
      { texto: '' },
      { texto: '{descricao}' },
    ],
  },
];

const GRANDES_CLIENTES_SELO_ROMPIDO_TEMPLATE = [
  {
    condicao: { campo: 'selo-rompido', valor: 'SIM' },
    blocos: [
      { texto: 'SELO ROMPIDO: SIM' },
      { texto: 'MEDIDOR SUBSTITUIDO: {medidor-substituido}' },
      {
        texto: 'NOVO MEDIDOR: {num-novo-medidor}',
        condicao: { campo: 'medidor-substituido', valor: 'SIM' },
      },
      { texto: '' },
      { texto: '{descricao}' },
    ],
  },
  {
    condicao: { campo: 'selo-rompido', valor: 'NÃO' },
    blocos: [{ texto: 'SELO ROMPIDO: NAO' }, { texto: '' }, { texto: '{descricao}' }],
  },
];

const INSTALACAO_DISPLAY_TEMPLATE = [
  {
    condicao: { campo: 'display-instalado', valor: 'SIM' },
    blocos: [{ texto: 'DISPLAY INSTALADO: SIM' }, { texto: '' }, { texto: '{descricao}' }],
  },
  {
    condicao: { campo: 'display-instalado', valor: 'NÃO' },
    blocos: [
      { texto: 'DISPLAY INSTALADO: NAO' },
      { texto: 'MOTIVO: {motivo-nao-instalar}' },
      { texto: '' },
      { texto: '{descricao}' },
    ],
  },
];

const SUBST_DISPLAY_TEMPLATE = [
  {
    blocos: [
      { texto: 'MOTIVO SUBSTITUICAO: {motivo-subst}' },
      { texto: 'DISPLAY FUNCIONANDO: {display-funcionando}' },
      { texto: '' },
      { texto: '{descricao}' },
    ],
  },
];

const CORTE_DEF_TECNICO_TEMPLATE = [
  {
    condicao: { campo: 'corte_por_defeito_tecnico', valor: 'SIM' },
    blocos: [{ texto: 'EXECUTADO: SIM' }, { texto: '' }, { texto: '{descricao}' }],
  },
  {
    condicao: { campo: 'corte_por_defeito_tecnico', valor: 'NAO' },
    blocos: [
      { texto: 'EXECUTADO: NAO' },
      { texto: 'MOTIVO: {motivo_cancelamento_corte_por_defeito_tecnico}' },
      {
        texto: 'PROBLEMA: {descreva_problema_corte_por_defeito_tecnico}',
        condicao: {
          campo: 'motivo_cancelamento_corte_por_defeito_tecnico',
          valor: ['SEM ACESSO', 'OUTRO PROBLEMA'],
        },
      },
      { texto: '' },
      { texto: '{descricao}' },
    ],
  },
];

const DESLIG_PROG_MANUTENCAO_TEMPLATE = [
  {
    condicao: { campo: 'desligamento', valor: 'DESLIGAMENTO EXECUTADO' },
    blocos: [{ texto: 'DESLIGAMENTO EXECUTADO' }, { texto: '' }, { texto: '{descricao}' }],
  },
  {
    blocos: [
      { texto: 'STATUS: {desligamento}' },
      { texto: 'PROBLEMA: {acesso_desligamento}' },
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

  'ADEQUACAO SMF': DESCRICAO_TEMPLATE,
  'AFERIÇÃO DE MEDIDOR': DESCRICAO_TEMPLATE,
  'AFERIÇÃO MEDIDOR CLIENTE LIVRE': DESCRICAO_TEMPLATE,
  'COLHER LEITURA': DESCRICAO_TEMPLATE,
  'CORTE DEFINITIVO A PEDIDO': DESCRICAO_TEMPLATE,
  'CORTE DE UC POR DEF TECNICO': CORTE_DEF_TECNICO_TEMPLATE,
  'DESLIG.PROG.MANUTENÇÃO': DESLIG_PROG_MANUTENCAO_TEMPLATE,
  'DESLOCAMENTO DE SUBESTAÇÃO': DESCRICAO_TEMPLATE,
  'DISPON. SAIDA SERIAL MEDIDOR': DESCRICAO_TEMPLATE,
  'EXECUÇÃO DE MUDANÇA DE TARIFA': DESCRICAO_TEMPLATE,
  'EXECUCAO DO ACRESCIMO DE POTENCIA': DESCRICAO_TEMPLATE,
  'EXECUCAO DO DECRESCIMO DE POTENCIA': DESCRICAO_TEMPLATE,
  'GRANDES CLIENTES SELO ROMPIDO': GRANDES_CLIENTES_SELO_ROMPIDO_TEMPLATE,
  'GRANDES CLIENTES SEM MEDIÇÃO': DESCRICAO_TEMPLATE,
  'INSTALACAO DO DISPLAY': INSTALACAO_DISPLAY_TEMPLATE,
  'LIBERAÇÃO DE PULSO': DESCRICAO_TEMPLATE,
  'LIGAÇÃO NOVA ISOLADA': DESCRICAO_TEMPLATE,
  'LIGAÇÃO NOVA SIMULTÂNEA': DESCRICAO_TEMPLATE,
  'RELIGACAO NORMAL RURAL': DESCRICAO_TEMPLATE,
  'RELIGAÇÃO NORMAL URBANA': DESCRICAO_TEMPLATE,
  'RESELAR MEDICAO': DESCRICAO_TEMPLATE,
  RESSERVICO: DESCRICAO_TEMPLATE,
  'RETIRAR EQUIPAMENTOS': DESCRICAO_TEMPLATE,
  'RETIRAR RAMAL': DESCRICAO_TEMPLATE,
  'SERVIÇO ESPECIAL OPERAÇÃO GRUPO A': DESCRICAO_TEMPLATE,
  'SUBST. DE EQUIPAMENTO DE MEDICAO': DESCRICAO_TEMPLATE,
  'SUBST. MEDIDOR A PEDIDO': DESCRICAO_TEMPLATE,
  'SUBST. MEDIDOR INICIATIVA COELCE': DESCRICAO_TEMPLATE,
  'SUBSTITUIÇÃO DA BATERIA DO MEDIDOR': DESCRICAO_TEMPLATE,
  'SUBSTITUIÇÃO DE DISPLAY': SUBST_DISPLAY_TEMPLATE,
  'TELEMEDIÇÃO MANUTENÇÃO': TELEMEDICAO_TEMPLATE,
  'TELEMEDIÇÃO MANUTENÇÃO CLIENTE LIVRE': TELEMEDICAO_TEMPLATE,
  'TELEMEDIÇÃO MANUTENÇÃO LOTE': TELEMEDICAO_TEMPLATE,
  'VISITA TECNICA GRUPO A': DESCRICAO_TEMPLATE,
  'VISTORIA DA UC': DESCRICAO_TEMPLATE,
  'VISTORIA GERAÇÃO DISTRIBUIDA': DESCRICAO_TEMPLATE,
};

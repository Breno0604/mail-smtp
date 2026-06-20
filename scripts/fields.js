const nomesTecnicos = ["ANDRE DE SOUSA CARVALHO","ANTONIO MAURIELLTON DE ARAUJO MARTINS","BERKSON EVANGELISTA DE OLIVEIRA","CARLOS CRISTIANO DO NASCIMENTO SILVA","DIEGO DA SILVA DE LIMA","DOUGLAS MONTEIRO DE ABREU","FRANCISCO ADRIANO DE SOUSA VIANA","JOSE DOGIVAN DA SILVA","LEANDRO OLIVEIRA SOUSA","MARCIO JOHNNATAN CHAGAS CAETANO","RENATO RODRIGUES VIEIRA","VALDI DOS SANTOS VIANA FILHO"];

export const iniciaisFields = [
  { linha: 0, nome: "coordenadas", label: "Coordenadas", tipo: "coordinates", readonly: true },
  { linha: 1, nome: "lider",     label: "Líder",     tipo: "select", obrigatorio: true, opcoes: nomesTecnicos },
  { linha: 2, nome: "parceiro",  label: "Parceiro",  tipo: "select", obrigatorio: true, opcoes: nomesTecnicos },
  { linha: 3, nome: "municipio", label: "Município", tipo: "select", obrigatorio: true, opcoes: ["ACARAPE","AQUIRAZ","ARACOIABA","ARATUBA","BARREIRA","BATURITE","BEBERIBE","CAPISTRANO","CASCAVEL","CAUCAIA","CHOROZINHO","EUSÉBIO","FORTALEZA","GUAIUBA","GUARAMIRANGA","HORIZONTE","ITAITINGA","ITAPIUNA","MARACANAU","MARANGUAPE","MULUNGU","OCARA","PACAJUS","PACATUBA","PACOTI","PALMACIA","PINDORETAMA","REDENCAO","SAO GONCALO"] },
  { linha: 4, nome: "uc",        label: "UC",        tipo: "number", obrigatorio: true },
  { linha: 4, nome: "os",        label: "OS",        tipo: "text",   obrigatorio: true },
  { linha: 5, nome: "notificado", label: "Notificado", tipo: "select", obrigatorio: true, opcoes: ["SIM","NÃO"] },
  { linha: 5, nome: "placa",     label: "Placa",     tipo: "select", obrigatorio: true, opcoes: ["RHS6G02","RIE0D84","RIH3H88","SDZ7E43","SDZ9B15","SDZ9B16","SRT8J10","SRW6J12","SRW6J13","SRW6J41","TCI4F69","TUL0I49"] },
  { linha: 6, nome: "data",       label: "Data",     tipo: "date",   obrigatorio: true },
  { linha: 6, nome: "hora_inicio", label: "Início", tipo: "time", obrigatorio: true },
  { linha: 6, nome: "hora_fim",   label: "Fim",      tipo: "time",  obrigatorio: true },
  { linha: 7, nome: "tipo-ordem", label: "Tipo de Ordem", tipo: "select", obrigatorio: true, opcoes: ["ADEQUACAO SMF","AFERIÇÃO DE MEDIDOR","AFERIÇÃO MEDIDOR CLIENTE LIVRE","COLHER LEITURA","CORTE DE UC POR DEF TECNICO","CORTE DEFINITIVO A PEDIDO","CORTE POR FALTA DE PAGAMENTO","DESLIG.PROG.MANUTENÇÃO","DESLOCAMENTO DE SUBESTAÇÃO","DISPON. SAIDA SERIAL MEDIDOR","EXECUÇÃO DE MUDANÇA DE TARIFA","EXECUCAO DO ACRESCIMO DE POTENCIA","EXECUCAO DO DECRESCIMO DE POTENCIA","GRANDES CLIENTES SELO ROMPIDO","GRANDES CLIENTES SEM MEDIÇÃO","INSPECAO UC CORTADA I15","INSPECAO UC CORTADA I180","INSPECAO UC CORTADA I30","INSPECAO UC CORTADA I90","INSTALACAO DO DISPLAY","LIBERAÇÃO DE PULSO","LIGAÇÃO NOVA ISOLADA","LIGACAO NOVA MEDIA TENSAO","LIGACAO NOVA MT - CLIENTE LIVRE","LIGAÇÃO NOVA SIMULTÂNEA","RELIGACAO NORMAL RURAL","RELIGAÇÃO NORMAL URBANA","RESELAR MEDICAO","RESSERVICO","RETIRAR EQUIPAMENTOS","RETIRAR RAMAL","SERVIÇO ESPECIAL OPERAÇÃO GRUPO A","SUBST. DE EQUIPAMENTO DE MEDICAO","SUBST. MEDIDOR A PEDIDO","SUBST. MEDIDOR INICIATIVA COELCE","SUBSTITUIÇÃO DA BATERIA DO MEDIDOR","SUBSTITUIÇÃO DE DISPLAY","TELEMEDIÇÃO MANUTENÇÃO","TELEMEDIÇÃO MANUTENÇÃO CLIENTE LIVRE","TELEMEDIÇÃO MANUTENÇÃO LOTE","VISITA TECNICA GRUPO A","VISTORIA DA UC","VISTORIA GERAÇÃO DISTRIBUIDA"] },
];

// ── Retorno fields by Tipo de Ordem ──────────────────────────────────────────

const FIELD_DESCRICAO = { nome: "descricao", label: "Descrição do Serviço", tipo: "textarea" };

// Campos para Inspeção UC Cortada (I15, I30, I90, I180) - mesmos campos, 4 tipos
const UC_CORTADA_FIELDS = [
  { linha: 1, nome: "situacao-cliente", label: "Situação", tipo: "select", opcoes: ["CORTADO", "AUTO RELIGADO CORTE EXECUTADO", "AUTO RELIGADO", "SOLICITOU RELIGACAO", "NOVO CLIENTE NO LOCAL"] },
  { linha: 2, nome: "viavel-retirar", label: "Viável Retirar", tipo: "select", opcoes: ["COM MUNK OU GUINCHO", "COM MUNK", "COM LINHA VIVA", "N/A"] },
  { linha: 3, nome: "ramal", label: "Ramal", tipo: "select", opcoes: ["COM RAMAL", "SEM RAMAL"] },
  { linha: 3, nome: "medicao", label: "Medição", tipo: "select", opcoes: ["COM MEDIÇÃO", "SEM MEDIÇÃO"] },
  { linha: 4, nome: "jump", label: "Jump", tipo: "select", opcoes: ["COM JUMP", "SEM JUMP"] },
  { linha: 4, nome: "chaves", label: "Chaves", tipo: "select", opcoes: ["COM CHAVE", "SEM CHAVE"] },
  { linha: 5, nome: "aplicado-toi", label: "Aplicado TOI", tipo: "select", opcoes: ["SIM", "NAO"] },
  { linha: 5, nome: "toi", label: "TOI", tipo: "text", condicional: { campoRef: "aplicado-toi", valor: "SIM" } },
  { linha: 6, nome: "descricao", label: "Descrição do Serviço", tipo: "textarea" },
];

// Campos para Ligação Nova Média Tensão e MT Cliente Livre - mesmos campos
const LIGACAO_NOVA_MT_FIELDS = [
  { linha: 1, nome: "retorno_ligacao", label: "Executado", tipo: "select", opcoes: ["VISTORIA", "VISTORIA + LIGAÇÃO", "LIGAÇÃO"] },
  { linha: 2, nome: "obra", label: "Obra", tipo: "select", opcoes: ["CONCLUIDA", "NAO CONCLUIDA"], condicional: { campoRef: "retorno_ligacao", valor: ["VISTORIA", "VISTORIA + LIGAÇÃO"] } },
  { linha: 2, nome: "ligacao", label: "Ligação", tipo: "select", opcoes: ["CONCLUIDA", "NAO CONCLUIDA"], condicional: { campoRef: "retorno_ligacao", valor: ["LIGAÇÃO", "VISTORIA + LIGAÇÃO"] } },
  { linha: 3, nome: "tipo_medicao", label: "Medição", tipo: "select", opcoes: ["ACOPLADA", "CUBICULO", "SEMI-DIRETA", "DIRETA"], condicional: { campoRef: "retorno_ligacao", valor: ["VISTORIA", "VISTORIA + LIGAÇÃO"] } },
  { linha: 3, nome: "status_medicao", label: "Status Medição", tipo: "select", opcoes: ["COM MEDICAO", "SEM MEDICAO"], condicional: { campoRef: "retorno_ligacao", valor: ["VISTORIA", "VISTORIA + LIGAÇÃO"] } },
  { linha: 4, nome: "ponto_de_entrega", label: "Ponto de Entrega", tipo: "select", opcoes: ["DE ACORDO", "EM DESACORDO", "NÃO CONSTRUIDO"], condicional: { campoRef: "retorno_ligacao", valor: ["VISTORIA", "VISTORIA + LIGAÇÃO"] } },
  { linha: 4, nome: "tombamento", label: "Tombamento", tipo: "text", condicional: { campoRef: "retorno_ligacao", valor: ["LIGAÇÃO", "VISTORIA + LIGAÇÃO"] } },
  { linha: 5, nome: "medidor_bt", label: "Medidor de BT", tipo: "select", opcoes: ["COM MEDIDOR BT", "SEM MEDIDOR BT"], condicional: { campoRef: "retorno_ligacao", valor: ["VISTORIA", "VISTORIA + LIGAÇÃO"] } },
  { linha: 5, nome: "qtd_medidor_bt", label: "Quantidade", tipo: "number", condicional: { campoRef: "medidor_bt", valor: "COM MEDIDOR BT" } },
  { linha: 6, nome: "acesso_medicao", label: "Acesso", tipo: "select", opcoes: ["REGULAR", "IRREGULAR", "SEM ACESSO"], condicional: { campoRef: "retorno_ligacao", valor: ["VISTORIA", "VISTORIA + LIGAÇÃO"] } },
  { linha: 6, nome: "acesso_ponto_de_entrega", label: "Descreva o Problema", tipo: "text", condicional: { campoRef: "acesso_medicao", valor: ["IRREGULAR", "SEM ACESSO"] } },
  { linha: 7, nome: "descricao", label: "Descrição do Serviço", tipo: "textarea" },
];

// Campos para Aferição de Medidor e Aferição Cliente Livre - mesmos 7 campos
const AFERICAO_MEDIDOR_FIELDS = [
  { linha: 1, nome: "medidor_afericao", label: "Medidor", tipo: "select", opcoes: ["SUBSTITUIDO", "NAO SUBSTITUIDO"] },
  { linha: 2, nome: "Motivo_cancel_afericao", label: "Motivo Cancelamento", tipo: "text", condicional: { campoRef: "medidor_afericao", valor: "NAO SUBSTITUIDO" } },
  { linha: 3, nome: "leitura_afericao", label: "Leitura", tipo: "select", opcoes: ["VISUAL E NETBOOK", "APENAS VISUAL", "APENAS NOTEBOOK", "NAO FOI COLHIDO LEITURA"], condicional: { campoRef: "medidor_afericao", valor: "SUBSTITUIDO" } },
  { linha: 4, nome: "motivo_nao_colher", label: "Porque não foi colhido", tipo: "text", condicional: { campoRef: "leitura_afericao", valor: "NAO FOI COLHIDO LEITURA" } },
  { linha: 5, nome: "toi_afericao", label: "TOI", tipo: "select", opcoes: ["APLICADO TOI", "PERDAS JA APLICOU TOI", "NAO FOI APLICADO TOI"], condicional: { campoRef: "medidor_afericao", valor: "SUBSTITUIDO" } },
  { linha: 6, nome: "numero_toi", label: "Nº TOI", tipo: "text", condicional: { campoRef: "toi_afericao", valor: "APLICADO TOI" } },
  { linha: 7, nome: "porque_nao_aplicado_toi", label: "Porque não foi aplicado TOI", tipo: "text", condicional: { campoRef: "toi_afericao", valor: "NAO FOI APLICADO TOI" } },
  { linha: 8, nome: "descricao", label: "Descrição do Serviço", tipo: "textarea" },
];

// Campos para Telemetria Manutenção (3 tipos compartilhados)
const TELEMEDICAO_FIELDS = [
  { linha: 1, nome: "executado_telemedicao", label: "Executado", tipo: "select", opcoes: ["SIM", "NAO"] },
  { linha: 2, nome: "motivo_cancelamento_telemedicao", label: "Motivo", tipo: "select", opcoes: ["SEM ACESSO", "MEDICAO COM BY-PASS", "MEDICAO AVARIADA", "OUTRO MOTIVO"], condicional: { campoRef: "executado_telemedicao", valor: "NAO" } },
  { linha: 3, nome: "descreva_problema_telemedicao", label: "Descreva Problema", tipo: "textarea", condicional: { campoRef: "motivo_cancelamento_telemedicao", valor: ["SEM ACESSO", "OUTRO MOTIVO"] } },
  { linha: 4, nome: "atentende_com", label: "Atendente (COM)", tipo: "text", condicional: { campoRef: "executado_telemedicao", valor: "SIM" } },
  { linha: 5, nome: "realizado_telemedicao", label: "O que foi realizado", tipo: "textarea", condicional: { campoRef: "executado_telemedicao", valor: "SIM" } },
  FIELD_DESCRICAO,
];

export const retornoFieldsByTipo = {
  "default": [FIELD_DESCRICAO],

  "INSPECAO UC CORTADA I15": UC_CORTADA_FIELDS,
  "INSPECAO UC CORTADA I30": UC_CORTADA_FIELDS,
  "INSPECAO UC CORTADA I90": UC_CORTADA_FIELDS,
  "INSPECAO UC CORTADA I180": UC_CORTADA_FIELDS,

  "SUBST. MEDIDOR A PEDIDO": [
    FIELD_DESCRICAO,
    { nome: "tipo-servico", label: "Tipo de Serviço", tipo: "select", opcoes: ["Troca de Medidor", "Reparo", "Aferição"] },
    { nome: "medidor-antigo", label: "Nº do Medidor Antigo", tipo: "text", condicional: { campoRef: "tipo-servico", valor: "Troca de Medidor" } },
    { nome: "medidor-novo", label: "Nº do Medidor Novo", tipo: "text", condicional: { campoRef: "tipo-servico", valor: "Troca de Medidor" } },
    { nome: "marca-medidor", label: "Marca do Medidor", tipo: "select", opcoes: ["Landis+Gyr", "EDMI", "Siemens", "Itron", "Nansen", "Outra"], condicional: { campoRef: "tipo-servico", valor: "Troca de Medidor" } },
    { nome: "leitura-anterior", label: "Leitura Anterior", tipo: "number", condicional: { campoRef: "tipo-servico", valor: "Aferição" } },
    { nome: "leitura-atual", label: "Leitura Atual", tipo: "number", condicional: { campoRef: "tipo-servico", valor: "Aferição" } },
  ],

  "VISTORIA DA UC": [
    FIELD_DESCRICAO,
    { nome: "resultado", label: "Resultado da Vistoria", tipo: "select", opcoes: ["Regular", "Irregularidade Leve", "Irregularidade Grave", "Cliente Ausente", "Recusou", "Outro"] },
    { nome: "motivo-recusa", label: "Motivo da Recusa", tipo: "text", condicional: { campoRef: "resultado", valor: "Recusou" } },
    { nome: "desc-irregularidade", label: "Descrição da Irregularidade", tipo: "textarea", condicional: { campoRef: "resultado", valor: "Irregularidade Leve" } },
    { nome: "desc-irregularidade-grave", label: "Descrição da Irregularidade", tipo: "textarea", condicional: { campoRef: "resultado", valor: "Irregularidade Grave" } },
  ],

  "GRANDES CLIENTES SELO ROMPIDO": [
    FIELD_DESCRICAO,
    { nome: "selo-rompido", label: "Selo Rompido?", tipo: "select", opcoes: ["SIM", "NÃO"] },
    { nome: "medidor-substituido", label: "Medidor Substituído?", tipo: "select", opcoes: ["SIM", "NÃO"], condicional: { campoRef: "selo-rompido", valor: "SIM" } },
    { nome: "num-novo-medidor", label: "Nº do Novo Medidor", tipo: "text", condicional: { campoRef: "medidor-substituido", valor: "SIM" } },
  ],

  "INSTALACAO DO DISPLAY": [
    FIELD_DESCRICAO,
    { nome: "display-instalado", label: "Display Instalado?", tipo: "select", opcoes: ["SIM", "NÃO"] },
    { nome: "motivo-nao-instalar", label: "Motivo de não Instalar", tipo: "text", condicional: { campoRef: "display-instalado", valor: "NÃO" } },
  ],

  "SUBSTITUIÇÃO DE DISPLAY": [
    FIELD_DESCRICAO,
    { nome: "motivo-subst", label: "Motivo da Substituição", tipo: "select", opcoes: ["Display Quebrado", "Display Sem Leitura", "Display Danificado", "Outro"] },
    { nome: "display-funcionando", label: "Display Novo Funcionando?", tipo: "select", opcoes: ["SIM", "NÃO"] },
  ],

  "AFERIÇÃO DE MEDIDOR": AFERICAO_MEDIDOR_FIELDS,
  "AFERIÇÃO MEDIDOR CLIENTE LIVRE": AFERICAO_MEDIDOR_FIELDS,

  "CORTE POR FALTA DE PAGAMENTO": [
    { linha: 1, nome: "situacao_corte", label: "Situação", tipo: "select", opcoes: ["CLIENTE CORTADO", "CLIENTE VISITADO CONTA PAGA", "CLIENTE NAO PERMITIU O CORTE", "SEM ACESSO PARA EXECUTAR O CORTE"] },
    { linha: 2, nome: "descricao", label: "Descrição do Serviço", tipo: "textarea" },
  ],

  "DESLIG.PROG.MANUTENÇÃO": [
    { linha: 1, nome: "desligamento", label: "Desligamento", tipo: "select", opcoes: ["DESLIGAMENTO EXECUTADO", "CLIENTE CANCELOU DESLIGAMENTO", "SEM ACESSO", "NAO EXECUTADO PENDENCIA CLIENTE", "NAO EXECUTADO PENDENCIA ENEL"] },
    { linha: 2, nome: "acesso_desligamento", label: "Descreva o Problema", tipo: "text", condicional: { campoRef: "desligamento", valor: "DESLIGAMENTO EXECUTADO", negado: true } },
    { linha: 3, nome: "descricao", label: "Descrição do Serviço", tipo: "textarea" },
  ],

  "LIGACAO NOVA MEDIA TENSAO": LIGACAO_NOVA_MT_FIELDS,
  "LIGACAO NOVA MT - CLIENTE LIVRE": LIGACAO_NOVA_MT_FIELDS,

  "TELEMEDIÇÃO MANUTENÇÃO": TELEMEDICAO_FIELDS,
  "TELEMEDIÇÃO MANUTENÇÃO CLIENTE LIVRE": TELEMEDICAO_FIELDS,
  "TELEMEDIÇÃO MANUTENÇÃO LOTE": TELEMEDICAO_FIELDS,

  "CORTE DE UC POR DEF TECNICO": [
    { linha: 1, nome: "corte_por_defeito_tecnico", label: "Executado", tipo: "select", opcoes: ["SIM", "NAO"] },
    { linha: 2, nome: "motivo_cancelamento_corte_por_defeito_tecnico", label: "Motivo", tipo: "select", opcoes: ["SEM ACESSO", "SOLICITACAO ENEL", "CLIENTE NAO PERMITIU", "CLIENTE CORRIGIU PROBLEMA", "OUTRO PROBLEMA"], condicional: { campoRef: "corte_por_defeito_tecnico", valor: "NAO" } },
    { linha: 3, nome: "descreva_problema_corte_por_defeito_tecnico", label: "Descreva Problema", tipo: "textarea", condicional: { campoRef: "motivo_cancelamento_corte_por_defeito_tecnico", valor: ["SEM ACESSO", "OUTRO PROBLEMA"] } },
    FIELD_DESCRICAO,
  ],
};

export function getRetornoFields(tipo) {
  return retornoFieldsByTipo[tipo] || retornoFieldsByTipo["default"];
}



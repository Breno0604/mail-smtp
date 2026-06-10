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

export const retornoFieldsByTipo = {
  "default": [FIELD_DESCRICAO],

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

  "AFERIÇÃO DE MEDIDOR": [
    FIELD_DESCRICAO,
    { nome: "medidor-aferido", label: "Medidor Aferido?", tipo: "select", opcoes: ["SIM", "NÃO"] },
    { nome: "resultado-afericao", label: "Resultado da Aferição", tipo: "text", condicional: { campoRef: "medidor-aferido", valor: "SIM" } },
  ],

  "CORTE POR FALTA DE PAGAMENTO": [
    FIELD_DESCRICAO,
    { nome: "motivo-corte", label: "Motivo do Corte", tipo: "select", opcoes: ["Falta de Pagamento", "Irregularidade", "A Pedido do Cliente", "Outro"] },
    { nome: "data-corte", label: "Data do Corte", tipo: "date" },
    { nome: "religado", label: "Religado?", tipo: "select", opcoes: ["SIM", "NÃO"], condicional: { campoRef: "motivo-corte", valor: "Falta de Pagamento" } },
  ],

  "TELEMEDIÇÃO MANUTENÇÃO": [
    FIELD_DESCRICAO,
    { nome: "equipamento", label: "Equipamento", tipo: "select", opcoes: ["Modem", "Roteador", "Concentrador", "Fonte", "Antena", "Hub", "Outro"] },
    { nome: "defeito", label: "Defeito Encontrado", tipo: "text" },
    { nome: "num-serie", label: "Nº de Série", tipo: "text" },
  ],
};

export function getRetornoFields(tipo) {
  return retornoFieldsByTipo[tipo] || retornoFieldsByTipo["default"];
}

export const retornoFields = [
  { label: "Descrição", id: "descricao-retorno", type: "textarea", required: true },
];

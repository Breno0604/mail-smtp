import type { RetornoField } from '@/shared/types'

const FIELD_DESCRICAO: RetornoField = { linha: 0, nome: "descricao", label: "Descrição do Serviço", tipo: "textarea" }

const UC_CORTADA_FIELDS: RetornoField[] = [
  { linha: 1, nome: "situacao-cliente", label: "Situação", tipo: "select", opcoes: ["CORTADO", "AUTO RELIGADO CORTE EXECUTADO", "AUTO RELIGADO", "SOLICITOU RELIGACAO", "NOVO CLIENTE NO LOCAL"] },
  { linha: 2, nome: "viavel-retirar", label: "Viável Retirar", tipo: "select", opcoes: ["COM MUNK OU GUINCHO", "COM MUNK", "COM LINHA VIVA", "N/A"] },
  { linha: 3, nome: "ramal", label: "Ramal", tipo: "select", opcoes: ["COM RAMAL", "SEM RAMAL"] },
  { linha: 3, nome: "medicao", label: "Medição", tipo: "select", opcoes: ["COM MEDIÇÃO", "SEM MEDIÇÃO"] },
  { linha: 4, nome: "jump", label: "Jump", tipo: "select", opcoes: ["COM JUMP", "SEM JUMP"] },
  { linha: 4, nome: "chaves", label: "Chaves", tipo: "select", opcoes: ["COM CHAVE", "SEM CHAVE"] },
  { linha: 5, nome: "aplicado-toi", label: "Aplicado TOI", tipo: "select", opcoes: ["SIM", "NAO"] },
  { linha: 5, nome: "toi", label: "TOI", tipo: "text", condicional: { campoRef: "aplicado-toi", valor: "SIM" } },
]

const LIGACAO_NOVA_MT_FIELDS: RetornoField[] = [
  { linha: 1, nome: "retorno_ligacao", label: "Executado", tipo: "select", opcoes: ["VISTORIA", "VISTORIA + LIGAÇÃO", "LIGAÇÃO"] },
  { linha: 2, nome: "obra", label: "Obra", tipo: "select", opcoes: ["CONCLUIDA", "NAO CONCLUIDA"], condicional: { campoRef: "retorno_ligacao", valor: ["VISTORIA", "VISTORIA + LIGAÇÃO"] } },
  { linha: 2, nome: "tipo_medicao", label: "Medição", tipo: "select", opcoes: ["ACOPLADA", "CUBICULO", "SEMI-DIRETA", "DIRETA"], condicional: { campoRef: "retorno_ligacao", valor: ["VISTORIA", "VISTORIA + LIGAÇÃO"] } },
  { linha: 3, nome: "status_medicao", label: "Status Medição", tipo: "select", opcoes: ["COM MEDICAO", "SEM MEDICAO"], condicional: { campoRef: "retorno_ligacao", valor: ["VISTORIA", "VISTORIA + LIGAÇÃO"] } },
  { linha: 3, nome: "ponto_de_entrega", label: "Ponto de Entrega", tipo: "select", opcoes: ["DE ACORDO", "EM DESACORDO", "NÃO CONSTRUIDO"], condicional: { campoRef: "retorno_ligacao", valor: ["VISTORIA", "VISTORIA + LIGAÇÃO"] } },
  { linha: 4, nome: "medidor_bt", label: "Medidor de BT", tipo: "select", opcoes: ["COM MEDIDOR BT", "SEM MEDIDOR BT"], condicional: { campoRef: "retorno_ligacao", valor: ["VISTORIA", "VISTORIA + LIGAÇÃO"] } },
  { linha: 4, nome: "qtd_medidor_bt", label: "Quantidade", tipo: "number", condicional: { campoRef: "medidor_bt", valor: "COM MEDIDOR BT" } },
  { linha: 5, nome: "acesso_medicao", label: "Acesso", tipo: "select", opcoes: ["REGULAR", "IRREGULAR", "SEM ACESSO"], condicional: { campoRef: "retorno_ligacao", valor: ["VISTORIA", "VISTORIA + LIGAÇÃO"] } },
  { linha: 5, nome: "acesso_ponto_de_entrega", label: "Descreva o Problema", tipo: "text", condicional: { campoRef: "acesso_medicao", valor: ["IRREGULAR", "SEM ACESSO"] } },
  { linha: 2, nome: "ligacao", label: "Ligação", tipo: "select", opcoes: ["CONCLUIDA", "NAO CONCLUIDA"], condicional: { campoRef: "retorno_ligacao", valor: ["LIGAÇÃO", "VISTORIA + LIGAÇÃO"] } },
  { linha: 3, nome: "tombamento", label: "Tombamento", tipo: "text", condicional: { campoRef: "retorno_ligacao", valor: ["LIGAÇÃO", "VISTORIA + LIGAÇÃO"] } },
]

export const retornoFieldsByTipo: Record<string, RetornoField[]> = {
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

  "AFERIÇÃO DE MEDIDOR": [
    FIELD_DESCRICAO,
    { nome: "medidor-aferido", label: "Medidor Aferido?", tipo: "select", opcoes: ["SIM", "NÃO"] },
    { nome: "resultado-afericao", label: "Resultado da Aferição", tipo: "text", condicional: { campoRef: "medidor-aferido", valor: "SIM" } },
  ],

  "CORTE POR FALTA DE PAGAMENTO": [
    { linha: 1, nome: "situacao_corte", label: "Situação", tipo: "select", opcoes: ["CLIENTE CORTADO", "CLIENTE VISITADO CONTA PAGA", "CLIENTE NAO PERMITIU O CORTE", "SEM ACESSO PARA EXECUTAR O CORTE"] },
  ],

  "DESLIG.PROG.MANUTENÇÃO": [
    { linha: 1, nome: "desligamento", label: "Desligamento", tipo: "select", opcoes: ["DESLIGAMENTO EXECUTADO", "CLIENTE CANCELOU DESLIGAMENTO", "SEM ACESSO", "NAO EXECUTADO PENDENCIA CLIENTE", "NAO EXECUTADO PENDENCIA ENEL"] },
    { linha: 2, nome: "acesso_desligamento", label: "Descreva o Problema", tipo: "text", condicional: { campoRef: "desligamento", valor: "DESLIGAMENTO EXECUTADO", negado: true } },
  ],

  "LIGACAO NOVA MEDIA TENSAO": LIGACAO_NOVA_MT_FIELDS,
  "LIGACAO NOVA MT - CLIENTE LIVRE": LIGACAO_NOVA_MT_FIELDS,

  "TELEMEDIÇÃO MANUTENÇÃO": [
    FIELD_DESCRICAO,
    { nome: "equipamento", label: "Equipamento", tipo: "select", opcoes: ["Modem", "Roteador", "Concentrador", "Fonte", "Antena", "Hub", "Outro"] },
    { nome: "defeito", label: "Defeito Encontrado", tipo: "text" },
    { nome: "num-serie", label: "Nº de Série", tipo: "text" },
  ],
}

export function getRetornoFields(tipo: string): RetornoField[] {
  return retornoFieldsByTipo[tipo] || retornoFieldsByTipo["default"]
}

export function getRetornoTipos(): string[] {
  return Object.keys(retornoFieldsByTipo).filter(k => k !== "default")
}

import ExcelJS from 'exceljs';

// ─── helpers ────────────────────────────────────────────────────────────────
// h(ordem, campo_nome, campo_label, tipo, opcoes, inicia_visivel, gatilho_campo, gatilho_valor, placeholder, grupo)
const h = (ord, nome, label, tipo, opcoes, iv, gc, gv, placeholder, grupo) => ({
  _ordem: ord,
  campo_nome: nome,
  campo_label: label,
  tipo,
  opcoes: opcoes||'',
  inicia_visivel: iv||'SIM',
  gatilho_campo: gc||'',
  gatilho_valor: gv||'',
  placeholder: placeholder||'',
  grupo: grupo||''
});

const tipoRow = (tipo, hObj, gv, tr) => {
  const { _ordem, ...rest } = hObj;
  return { tipo_ordem: tipo, ordem: _ordem, ...rest, grupo_verificacao: gv, tipo_retorno: tr };
};

// ─── data ───────────────────────────────────────────────────────────────────

// Group 1 — Ligação Nova (Tela_Execucao_Ligacao_Nova) — gv=1
const grupo1Fields = [
  h(1,  'tombamento',          'Tombamento',                    'TEXT',    '',       'SIM','','','','Ligação Nova'),
  h(2,  'coord_x',             'Coordenada X',                  'TEXT',    '',       'SIM','','','','Ligação Nova'),
  h(3,  'coord_y',             'Coordenada Y',                  'TEXT',    '',       'SIM','','','','Ligação Nova'),
  h(4,  'qtde_medidor_bt',     'Qtde Medidor BT',               'SELECT',  '1,2,3,4','SIM','','','','Ligação Nova'),
  h(5,  'medidor_bt_ret_cort', 'Medidor BT Retirado/Cortado',   'SELECT',  'SIM,NÃO','SIM','','','','Ligação Nova'),
  h(6,  'ligacao_executada',   'Ligação Executada',             'SELECT',  'SIM,NÃO','SIM','','','','Ligação Nova'),
];
const grupo1Tipos = [
  'LIGAÇÃO NOVA SIMULTÂNEA',
  'LIGAÇÃO NOVA ISOLADA',
  'ET: LIGAÇÃO - LIGACAO NOVA MEDIA TENSAO',
];

// Group 2 — Substituição de Equipamentos (Tela_Substituicao_de_Equipamentos) — gv=2
const grupo2Fields = [
  h(1,  'servico_executado',               'Serviço Executado',                      'SELECT',  'INSTALAR CONJUNTO,RETIRADO,TROCA DE CONJUNTO SEM CRIME,INSTALADO RETIRADO NAO ALTERADO','SIM','','','','Substituição'),
];
const grupo2Tipos = [
  'LIGACAO NOVA MT - CLIENTE LIVRE',
  'RETIRAR EQUIPAMENTOS',
  'SUBST. MEDIDOR INICIATIVA COELCE',
  'SUBST. MEDIDOR A PEDIDO',
  'AFERIÇÃO DE MEDIDOR',
  'SUBST. DE EQUIPAMENTO DE MEDICAO',
  'EXECUCAO DO DECRESCIMO DE POTENCIA',
];

// Group 3 — Substituição de Display — gv=3
const grupo3Fields = [
  h(1, 'servico_executado_display', 'Serviço Executado', 'SELECT', 'INSTALAR CONJUNTO,RETIRADO,TROCA','SIM','','','','Display'),
  h(2, 'numero_display',            'Número Display',    'TEXT',   '','SIM','','','','Display'),
  h(3, 'observacao_display',        'Observação Display','TEXTAREA','','SIM','','','','Display'),
];
const grupo3Tipos = ['SUBSTITUIÇÃO DE DISPLAY'];

// Group 4 — Instalação do Display — gv=4 (mesmos campos do grupo 3)
const grupo4Tipos = ['INSTALACAO DO DISPLAY'];

// Group 5 — Inspeção UC Cortada — gv=5
const grupo5Fields = [
  h(1, 'toi',                  'TOI',                    'SELECT',   'APLICADO TOI,NAO FOI APLICADO TOI,PERDAS JÁ APLICOU TOI','SIM','','','','Inspeção UC Cortada'),
  h(2, 'numero_toi',           'Número TOI',             'TEXT',     '','NÃO','toi','APLICADO TOI','','Inspeção UC Cortada'),
  h(3, 'pq_nao_aplicado_toi',  'Por que não aplicado TOI','TEXTAREA','','NÃO','toi','NAO FOI APLICADO TOI','','Inspeção UC Cortada'),
  h(4, 'observacao_inspecao',  'Observação Inspeção',    'TEXTAREA', '','SIM','','','','Inspeção UC Cortada'),
];
const grupo5Tipos = [
  'INSPECAO UC CORTADA (I15)',
  'INSPECAO UC CORTADA (I30)',
  'INSPECAO UC CORTADA (I90)',
  'INSPECAO UC CORTADA (I180)',
  'EXECUCAO DO ACRESCIMO DE POTENCIA',
];

// Group 6 — Vistoria Ligação MT — gv=6
const grupo6Fields = [
  h(1, 'tombamento_vistoria',  'Tombamento Vistoria',   'TEXT',    '','SIM','','','','Vistoria Ligação'),
  h(2, 'coord_x_vistoria',     'Coordenada X Vistoria', 'TEXT',    '','SIM','','','','Vistoria Ligação'),
  h(3, 'coord_y_vistoria',     'Coordenada Y Vistoria', 'TEXT',    '','SIM','','','','Vistoria Ligação'),
  h(4, 'observacao_vistoria',  'Observação Vistoria',   'TEXTAREA','','SIM','','','','Vistoria Ligação'),
];
const grupo6Tipos = ['ET: VISTORIA - LIGACAO NOVA MEDIA TENSAO'];

// Group 7 — Corte por Falta de Pagamento — gv=7
const grupo7Fields = [
  h(1, 'corte_religacao',          'Corte/Religação',                'SELECT',   'EXECUTOU CORTE,EXECUTOU RELIGAÇÃO','SIM','','','','Corte Falta Pagamento'),
  h(2, 'observacao_corte_pagamento','Observação Corte Pagamento',    'TEXTAREA', '','SIM','','','','Corte Falta Pagamento'),
];
const grupo7Tipos = ['CORTE POR FALTA DE PAGAMENTO'];

// Group 8 — Corte de UC por Def Técnico — gv=8
const grupo8Fields = [
  h(1,  'motivo_pre_apr',         'Motivo da PRE APR',              'TEXT',     '','SIM','','','','Corte Def Técnico'),
  h(2,  'medicao_avariada',       'Medição Avariada?',              'SELECT',   'SIM,NÃO','SIM','','','','Corte Def Técnico'),
  h(3,  'problema_medicao',       'Qual o problema da medição?',    'TEXTAREA', '','NÃO','medicao_avariada','SIM','','Corte Def Técnico'),
  h(4,  'necessario_linha_viva',  'Necessário Linha Viva?',         'SELECT',   'SIM,NÃO','SIM','','','','Corte Def Técnico'),
  h(5,  'porque_linha_viva',      'Por que linha viva?',            'TEXTAREA', '','NÃO','necessario_linha_viva','SIM','','Corte Def Técnico'),
  h(6,  'chave_corte',            'Tombamento Chave de Corte',      'TEXT',     '','SIM','','','','Corte Def Técnico'),
  h(7,  'chave_cliente',          'Tombamento Chave Cliente',       'TEXT',     '','SIM','','','','Corte Def Técnico'),
  h(8,  'qtd_aterramentos',       'Quantidade Aterramentos',        'SELECT',   '1,2,3,4,5,6,7,8,9,10','SIM','','','','Corte Def Técnico'),
  h(9,  'contato_cliente',        'Contato Cliente',                'SELECT',   'SIM,NÃO,N/A','SIM','','','','Corte Def Técnico'),
  h(10, 'nome_responsavel',       'Nome do Responsável',            'TEXT',     '','NÃO','contato_cliente','SIM','','Corte Def Técnico'),
  h(11, 'celular',                'Celular com DDD',                'TEXT',     '','NÃO','contato_cliente','SIM','','Corte Def Técnico'),
  h(12, 'telefone_fixo',          'Telefone Fixo',                  'TEXT',     '','NÃO','contato_cliente','SIM','','Corte Def Técnico'),
  h(13, 'email_contato',          'Email Contato',                  'TEXT',     '','NÃO','contato_cliente','SIM','','Corte Def Técnico'),
  h(14, 'corte_religacao_def',    'Corte/Religação após Corte',     'SELECT',   'EXECUTOU CORTE,EXECUTOU RELIGAÇÃO','SIM','','','','Corte Def Técnico'),
];
const grupo8Tipos = ['CORTE DE UC POR DEF TECNICO'];

// Group 9 — Desligamento Programado — gv=9
const grupo9Fields = [
  h(1, 'data_desligamento',       'Data Desligamento',       'TEXT', '','SIM','','','','Desligamento Programado'),
  h(2, 'hora_desligamento',       'Hora Desligamento',       'TEXT', '','SIM','','','','Desligamento Programado'),
  h(3, 'previsao_retorno',        'Previsão Retorno',        'TEXT', '','SIM','','','','Desligamento Programado'),
  h(4, 'observacao_desligamento', 'Observação Desligamento', 'TEXTAREA','','SIM','','','','Desligamento Programado'),
];
const grupo9Tipos = ['DESLIG.PROG.MANUTENÇÃO'];

// ─── tipos com template fixo (tipo_retorno=template) ────────────────────────
// Fonte: ordens_servico.md §Templates
const templatesTipos = [
  'ADEQUACAO SMF',
  'COLHER LEITURA',
  'CORTE DEFINITIVO A PEDIDO',
  'EXECUÇÃO DE MUDANÇA DE TARIFA',
  'GRANDES CLIENTES SEM MEDIÇÃO',
  'GRANDES CLIENTES SELO ROMPIDO',
  'LIBERAÇÃO DE PULSO',
  'RELIGAÇÃO (RURAL/URBANA)',
  'RETIRAR RAMAL',
  'SERVIÇO ESPECIAL OPERAÇÃO',
  'SUBSTITUIÇÃO DA BATERIA/MEDIDOR',
  'VISTORIA (ACRESCIMO/DECRESCIMO/DA UC/GERAÇÃO/PONTO ENTREGA/MIGRAÇÃO)',
  'VISITA TECNICA MIGRAÇÃO',
  'TELEMEDIÇÃO MANUTENÇÃO',
  'TELEMEDIÇÃO MANUTENÇÃO LOTE',
];

// ─── tipos direto para envio (tipo_retorno=direto) ──────────────────────────
const diretoTipos = [
  'AFERIÇÃO MEDIDOR CLIENTE LIVRE',
  'DESLOCAMENTO DE SUBESTAÇÃO',
  'DISPON. SAIDA SERIAL MEDIDOR',
  'LIGAÇÃO NOVA (SIMULTÂNEA/ISOLADA/MT)',
  'RELIGACAO NORMAL RURAL',
  'RELIGAÇÃO NORMAL URBANA',
  'RESELAR MEDICAO',
  'RESSEVICO',
  'TELEMEDIÇÃO MANUTENÇÃO CLIENTE LIVRE',
  'VISITA TECNICA GRUPO A',
  'VISTORIA CLIENTE LIVRE',
  'VISTORIA FRONTEIRA',
];

// ─── templates de texto (Sheet 2) ───────────────────────────────────────────
// Fonte: ordens_servico.md §Templates (linhas 118-140)
const textosTemplate = [
  { tipo_ordem: 'ADEQUACAO SMF', template_texto: `\nADEQUACAO DATA: \nHORÁRIO: \nINSTALADO GPS Nº: \nMARCA: \nSINCRONISMO REALIZADO COM SUCESSO. \nFOI INSTALADO MEDIDOR DA MARCA ION NC: \nMEDIDOR DE MARCA LANDIS NC:\nPERMANECE ACOPLADO AO CONJUNTO DE MEDIÇÃO: \nUC FOI DESLIGADO AS: \nRELIGADA AS: \nIP Nº: \nMASK: \nGW: \nCARGA IMPOSTA: \nEQUIPE: \nCADASTRO ENVIADO PARA APROVACAO SCDE EM: \nCADASTRO SCDE APROVADO EM: \nPROCESSO FINALIZADO PARA \nOBSERVAÇÃO: \nEQUIPE: \n` },
  { tipo_ordem: 'COLHER LEITURA', template_texto: `\n MEDIDOR SUBSTITUIDO NC: \n MEDIDOR RETIRADO NC: \n PELO MOTIVO: \n MEDIDOR INSTALADO NC: \n COLHIDO LEITURA VIA OU NOTEBOOK: \n OBSERVAÇÃO: \n` },
  { tipo_ordem: 'CORTE DEFINITIVO A PEDIDO', template_texto: `\n COLHIDO LEITURA VIA: \n RETIRADO MEDIDOR NC: \n CONJUNTO: \n TC: \n TP: \n REMOTA (Landis / V2): \n PORTA: \n REMOTA: \n OBSERVACAO: \n` },
  { tipo_ordem: 'EXECUÇÃO DE MUDANÇA DE TARIFA', template_texto: `\n REALIZADA VERIFICAÇÃO NOS DADOS DA MEDIÇÃO ATRAVÉS DA TELEMEDIÇÃO E EXECUTADA MUDANCA DE TARIFA DE: \n PARA TARIFA: \n OBSERVAÇÃO: \n` },
  { tipo_ordem: 'GRANDES CLIENTES SEM MEDIÇÃO', template_texto: `\n CLIENTE ENCONTRA-SE COM QUAL TIPO DE MEDICAO BY PASSADOS: \n NOME DO RESPONSAVEL: \n CELULAR: \n FIXO: \n E-MAIL: \n OBSERVACAO: \n` },
  { tipo_ordem: 'GRANDES CLIENTES SELO ROMPIDO', template_texto: `\n CONFORME INSPECAO: \n` },
  { tipo_ordem: 'LIBERAÇÃO DE PULSO', template_texto: `ABERTURA DO QUADRO PARA CONECTAR CABO DO EQUIPAMENTO DE DEMANDA DO CLIENTE. \n OBSERVAÇÃO: \n` },
  { tipo_ordem: 'RELIGAÇÃO (RURAL/URBANA)', template_texto: `\n RELIGACAO EXECUTADA DIA \n HORÁRIO: \n` },
  { tipo_ordem: 'RETIRAR RAMAL', template_texto: `\n CONJUNTO DE MEDICAO CONTINUA: \n MEDICAO EM BAIXO CONTINUA: \n RETIRADA E VIAVEL COM: \n OBSERVAÇÃO: \n` },
  { tipo_ordem: 'SERVIÇO ESPECIAL OPERAÇÃO', template_texto: `\n CONFORME VISITA FOI REALIZADO: \n` },
  { tipo_ordem: 'SUBSTITUIÇÃO DA BATERIA/MEDIDOR', template_texto: `\n BATERIA DO MEDIDOR QUE ENCONTRAVA-SE COM \n OBSERVAÇÃO: \n` },
  { tipo_ordem: 'VISTORIA (ACRESCIMO/DECRESCIMO/DA UC/GERAÇÃO/PONTO ENTREGA/MIGRAÇÃO)', template_texto: `\n VAI SER NO MESMO RAMAL: \n VAI SER NA MESMA MEDIÇÃO: \n LIBERADA PARA EXECUTAR ACRESCIMO/DECRESCIMO DE POTENCIA: \n REALIZOU AS DEVIDAS ALTERAÇÕES NA SUBESTAÇÃO:\n NOME DO RESPONSAVEL: \n CELULAR: \n FIXO: \n E-MAIL: \n OBSERVAÇÃO: \n` },
  { tipo_ordem: 'VISITA TECNICA MIGRAÇÃO', template_texto: `\n CONFORME VISITA MIGRAÇÃO: \n REALIZADA DIA: \n HORÁRIO: \n EQUIPE: \n` },
  { tipo_ordem: 'TELEMEDIÇÃO MANUTENÇÃO', template_texto: `\n Nº DA REMOTA RETIRADA: \n CHIP E OPERADORA RETIRADA: \n Nº DO CHIP RETIRADO: \n Nº DA REMOTA INSTALADA: \n CHIP E OPERADORA INSTALADA: \n Nº DO CHIP INSTALADA: \n RESTABELECEU A COMUNICAÇÃO COM A BASE AS: \n CONFORME CONTATO (COM): \n FOI COLHIDA LEITURA VISUAL E NETBOOK: \n OBSERVAÇÃO: \n` },
  { tipo_ordem: 'TELEMEDIÇÃO MANUTENÇÃO LOTE', template_texto: `\n Nº DA REMOTA RETIRADA: \n CHIP E OPERADORA RETIRADA: \n Nº DO CHIP RETIRADO: \n Nº DA REMOTA INSTALADA: \n CHIP E OPERADORA INSTALADA: \n Nº DO CHIP INSTALADA: \n RESTABELECEU A COMUNICAÇÃO COM A BASE AS: \n CONFORME CONTATO (COM): \n FOI COLHIDA LEITURA VISUAL E NETBOOK: \n OBSERVAÇÃO: \n` },
];

// ─── especiais / variações ───────────────────────────────────────────────────
// "LIGAÇÃO NOVA (SIMULTÂNEA/ISOLADA/MT)" é um item genérico do spinner
// "RELIGACAO NORMAL RURAL" e "RELIGAÇÃO NORMAL URBANA" são variações do template RELIGAÇÃO
// "VISTORIA (ACRESCIMO/DECRESCIMO/DA UC/GERAÇÃO/PONTO ENTREGA/MIGRAÇÃO)" template
// Sub-tipos de VISTORIA que são direto:
const vistoriaDireto = ['VISTORIA DA UC', 'VISTORIA GERAÇÃO DISTRIBUIDA', 'VISTORIA PONTO DE ENTREGA CLIENTE', 'VISTORIA ACRESCIMO DECRESCIMO'];

// ─── build rows ──────────────────────────────────────────────────────────────

function buildRows() {
  const rows = [];

  // grupos com tela específica
  for (const tipo of grupo1Tipos)
    for (const f of grupo1Fields) rows.push(tipoRow(tipo, f, 1, 'tela_especifica'));
  for (const tipo of grupo2Tipos)
    for (const f of grupo2Fields) rows.push(tipoRow(tipo, f, 2, 'tela_especifica'));
  for (const tipo of grupo3Tipos)
    for (const f of grupo3Fields) rows.push(tipoRow(tipo, f, 3, 'tela_especifica'));
  for (const tipo of grupo4Tipos)
    for (const f of grupo3Fields) rows.push(tipoRow(tipo, f, 4, 'tela_especifica'));
  for (const tipo of grupo5Tipos)
    for (const f of grupo5Fields) rows.push(tipoRow(tipo, f, 5, 'tela_especifica'));
  for (const tipo of grupo6Tipos)
    for (const f of grupo6Fields) rows.push(tipoRow(tipo, f, 6, 'tela_especifica'));
  for (const tipo of grupo7Tipos)
    for (const f of grupo7Fields) rows.push(tipoRow(tipo, f, 7, 'tela_especifica'));
  for (const tipo of grupo8Tipos)
    for (const f of grupo8Fields) rows.push(tipoRow(tipo, f, 8, 'tela_especifica'));
  for (const tipo of grupo9Tipos)
    for (const f of grupo9Fields) rows.push(tipoRow(tipo, f, 9, 'tela_especifica'));

  // templates — 1 linha cada (sem campos específicos)
  for (const tipo of templatesTipos)
    rows.push({ tipo_ordem: tipo, ordem: 0, campo_nome: '', campo_label: '', tipo: '', opcoes: '', inicia_visivel: '', gatilho_campo: '', gatilho_valor: '', placeholder: '', grupo: '', grupo_verificacao: 10, tipo_retorno: 'template' });

  // direto — 1 linha cada
  for (const tipo of diretoTipos)
    rows.push({ tipo_ordem: tipo, ordem: 0, campo_nome: '', campo_label: '', tipo: '', opcoes: '', inicia_visivel: '', gatilho_campo: '', gatilho_valor: '', placeholder: '', grupo: '', grupo_verificacao: 10, tipo_retorno: 'direto' });

  // vistoria direto (não estão no combo VISTORIA geral, são entradas separadas)
  for (const tipo of vistoriaDireto)
    rows.push({ tipo_ordem: tipo, ordem: 0, campo_nome: '', campo_label: '', tipo: '', opcoes: '', inicia_visivel: '', gatilho_campo: '', gatilho_valor: '', placeholder: '', grupo: '', grupo_verificacao: 10, tipo_retorno: 'direto' });

  // LIGAÇÃO NOVA (SIMULTÂNEA/ISOLADA/MT) é direto (item genérico do spinner)
  rows.push({ tipo_ordem: 'LIGAÇÃO NOVA (SIMULTÂNEA/ISOLADA/MT)', ordem: 0, campo_nome: '', campo_label: '', tipo: '', opcoes: '', inicia_visivel: '', gatilho_campo: '', gatilho_valor: '', placeholder: '', grupo: '', grupo_verificacao: 10, tipo_retorno: 'direto' });

  return rows;
}

// ─── create workbook ─────────────────────────────────────────────────────────

async function main() {
  const wb = new ExcelJS.Workbook();

  // ─── Sheet 1: tipos_ordem ─────────────────────────────────────────────────
  const s1 = wb.addWorksheet('tipos_ordem');
  s1.columns = [
    { header: 'tipo_ordem',         key: 'tipo_ordem',         width: 45 },
    { header: 'ordem',              key: 'ordem',              width: 8 },
    { header: 'campo_nome',         key: 'campo_nome',         width: 30 },
    { header: 'campo_label',        key: 'campo_label',        width: 35 },
    { header: 'tipo',               key: 'tipo',               width: 12 },
    { header: 'opcoes',             key: 'opcoes',             width: 50 },
    { header: 'inicia_visivel',     key: 'inicia_visivel',     width: 14 },
    { header: 'gatilho_campo',      key: 'gatilho_campo',      width: 25 },
    { header: 'gatilho_valor',      key: 'gatilho_valor',      width: 25 },
    { header: 'placeholder',        key: 'placeholder',        width: 30 },
    { header: 'grupo',              key: 'grupo',              width: 25 },
    { header: 'grupo_verificacao',  key: 'grupo_verificacao',  width: 18 },
    { header: 'tipo_retorno',       key: 'tipo_retorno',       width: 18 },
  ];

  const rows = buildRows();
  for (const r of rows) s1.addRow(r);

  // header style
  s1.getRow(1).font = { bold: true };
  s1.autoFilter = { from: 'A1', to: `M${rows.length + 1}` };

  // ─── Sheet 2: Texto_ordem ─────────────────────────────────────────────────
  const s2 = wb.addWorksheet('Texto_ordem');
  s2.columns = [
    { header: 'tipo_ordem',   key: 'tipo_ordem',   width: 50 },
    { header: 'template_texto', key: 'template_texto', width: 120 },
  ];

  for (const t of textosTemplate) s2.addRow(t);
  s2.getRow(1).font = { bold: true };

  // ─── write ─────────────────────────────────────────────────────────────────
  await wb.xlsx.writeFile('C:\\web-projects\\mail\\dados_projeto\\tipos_ordem_template_v2.xlsx');
  console.log('✅ Planilha gerada em dados_projeto/tipos_ordem_template.xlsx');
  console.log(`   Sheet "tipos_ordem": ${rows.length} linhas`);
  console.log(`   Sheet "Texto_ordem": ${textosTemplate.length} linhas`);
}

main().catch(console.error);

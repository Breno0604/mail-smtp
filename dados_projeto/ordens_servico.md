# Ordens de Serviço

## Lista Completa (50 tipos únicos)

O spinner `Ls_Tipo_de_ordem` contém as opções abaixo. Ao selecionar uma, o `Ls_Tipo_de_ordem$AfterSelecting` decide que tela mostrar.

### Legenda:
- **Tela específica**: Abre arrangement com campos dedicados + botão "Próximo" que valida
- **Template texto fixo**: Preenche um texto modelo com placeholders (ex: `\n OBSERVAÇÃO: \n`) - apenas observação livre
- **Sub-tela**: Aparece como parte de uma tela maior (ex: Tela_Leitura dentro da inspeção)

| # | Ordem | Tipo de Tela | Notas |
|---|-------|-------------|-------|
| 1 | ET: VISTORIA - LIGACAO NOVA MEDIA TENSAO | Tela_Vistoria_ligacao + sub-telas | Campos: ponto de entrega, obra, medição, contato |
| 2 | ET: LIGAÇÃO - LIGACAO NOVA MEDIA TENSAO | Tela_Execucao_Ligacao_Nova | Campos: tombamento, coord, medidor BT |
| 3 | ADEQUACAO SMF | Template texto fixo | Template: data, horário, GPS, marca, sincronismo, IP, etc. |
| 4 | AFERIÇÃO DE MEDIDOR | Direto para envio | Sem tela extra |
| 5 | AFERIÇÃO MEDIDOR CLIENTE LIVRE | Direto para envio | Sem tela extra |
| 6 | COLHER LEITURA | Template texto fixo | Template: medidor substituído/retirado/instalado, leitura |
| 7 | CORTE DE UC POR DEF TECNICO | Tela_Corte_de_UC_por_def_Tecnico + micro-telas PRE-APR | Status corte + motivo PRE-APR completo |
| 8 | CORTE DEFINITIVO A PEDIDO | Template texto fixo | Template: leitura, medidor, conjunto, TC, TP, remota |
| 9 | CORTE POR FALTA DE PAGAMENTO | Tela_Corte_Por_Falta_de_Pagamento | Status do corte |
| 10 | DESLOCAMENTO DE SUBESTAÇÃO | Direto para envio | Sem tela extra |
| 11 | DESLIG.PROG.MANUTENÇÃO | Tela_Desligamento_Programado + cancelamento | Status + motivo cancelamento |
| 12 | DISPON. SAIDA SERIAL MEDIDOR | Direto para envio | Sem tela extra |
| 13 | EXECUÇÃO DE MUDANÇA DE TARIFA | Template texto fixo | Template: verificação telemedição, mudança de tarifa |
| 14 | EXECUCAO DO ACRESCIMO DE POTENCIA | Vai por p$Verificar_Substituicao_de_Equipamentos | Tratado como "substituição" |
| 15 | EXECUCAO DO DECRESCIMO DE POTENCIA | Vai por p$Verificar_Substituicao_de_Equipamentos | Tratado como "substituição" |
| 16 | GRANDES CLIENTES SEM MEDIÇÃO | Template texto fixo | Template: tipo de medição bypass, contato |
| 17 | GRANDES CLIENTES SELO ROMPIDO | Template texto fixo | Template: conforme inspeção |
| 18 | INSPECAO UC CORTADA I15 | Tela_Inspeca_UC_Cortada + sub-telas | Ramal, medição, jump, chave, cliente, TOI |
| 19 | INSPECAO UC CORTADA I180 | Tela_Inspeca_UC_Cortada + sub-telas | Mesmo formulário da I15 |
| 20 | INSPECAO UC CORTADA I30 | Tela_Inspeca_UC_Cortada + sub-telas | Mesmo formulário |
| 21 | INSPECAO UC CORTADA I90 | Tela_Inspeca_UC_Cortada + sub-telas | Mesmo formulário |
| 22 | INSTALACAO DO DISPLAY | Tela_Substituicao_de_Display | Display instalado/retirado |
| 23 | LIBERACAO DE PULSO | Template texto fixo | Template: abertura do quadro para conectar cabo |
| 24 | LIGAÇÃO NOVA ISOLADA | Vai por p$Verificar_Execucao_Ligacao_nova | Tratado como ligação nova |
| 25 | LIGAÇÃO NOVA SIMULTÂNEA | Vai por p$Verificar_Execucao_Ligacao_nova | Tratado como ligação nova |
| 26 | LIGACAO NOVA MT - CLIENTE LIVRE | Vai por p$Verificar_Substituicao_de_Equipamentos | Tratado como "substituição" |
| 27 | RELIGACAO NORMAL RURAL | Template texto fixo | Template: religação executada dia/horário |
| 28 | RELIGAÇÃO NORMAL URBANA | Template texto fixo | Template: religação executada dia/horário |
| 29 | RESELAR MEDICAO | Direto para envio | Sem tela extra |
| 30 | RESSEVICO | Direto para envio | Sem tela extra |
| 31 | RETIRAR EQUIPAMENTOS | Tela_Equipamentos_Retirados | Checkboxes de equipamentos retirados |
| 32 | RETIRAR RAMAL | Template texto fixo | Template: conjunto de medição continua, medição em baixo |
| 33 | SERVIÇO ESPECIAL OPERAÇÃO | Template texto fixo | Template: conforme visita foi realizado |
| 34 | SUBST. DE EQUIPAMENTO DE MEDICAO | Vai por p$Verificar_Substituicao_de_Equipamentos | Tratado como "substituição" |
| 35 | SUBST. MEDIDOR A PEDIDO | Vai por p$Verificar_Substituicao_de_Equipamentos | Tratado como "substituição" |
| 36 | SUBST. MEDIDOR INICIATIVA COELCE | Vai por p$Verificar_Substituicao_de_Equipamentos | Tratado como "substituição" |
| 37 | SUBSTITUIÇÃO DA BATERIA DO MEDIDOR | Template texto fixo | Template: bateria do medidor |
| 38 | SUBSTITUIÇÃO DE DISPLAY | Tela_Substituicao_de_Display | Display instalado/retirado |
| 39 | TELEMEDIÇÃO MANUTENÇÃO | Tela_Telemedicao_Retirada + Tela_Telemedicao_Instalada | Marca, operadora, chip, porta |
| 40 | TELEMEDIÇÃO MANUTENÇÃO CLIENTE LIVRE | Direto para envio | Sem tela extra |
| 41 | TELEMEDIÇÃO MANUTENÇÃO LOTE | Tela_Telemedicao_Retirada + Tela_Telemedicao_Instalada | Mesmo da manutenção normal |
| 42 | VISITA TECNICA GRUPO A | Direto para envio | Sem tela extra |
| 43 | VISITA TECNICA MIGRAÇÃO | Template texto fixo | Template: conforme visita migração |
| 44 | VISTORIA ACRESCIMO DECRESCIMO | Template texto fixo | Template: mesmo ramal, medição, liberada |
| 45 | VISTORIA CLIENTE LIVRE | Direto para envio | Sem tela extra |
| 46 | VISTORIA DA UC | Template texto fixo | Template: observação |
| 47 | VISTORIA FRONTEIRA | Direto para envio | Sem tela extra |
| 48 | VISTORIA GERAÇÃO DISTRIBUIDA | Template texto fixo | Template: tipo de medição, vistoria |
| 49 | VISTORIA PONTO DE ENTREGA CLIENTE | Template texto fixo | Template: liberada p/ ligação nova, obra, padrão |
| 50 | (Ordem não reconhecida) | Direto para envio | Apenas observação |

> **Nota:** O item #50 não existe no spinner - o código trata qualquer ordem não-listada como "direto para envio"

---

## Agrupamento por Função de Verificação

A função `p$Verificar_Tipo_Ordem_de_Servico` (lambda549) agrupa por:

### Grupo 1: p$Verificar_Execucao_Ligacao_nova (Lit1211)
- LIGAÇÃO NOVA SIMULTÂNEA
- LIGAÇÃO NOVA ISOLADA
- ET: LIGAÇÃO - LIGACAO NOVA MEDIA TENSAO

### Grupo 2: p$Verificar_Substituicao_de_Equipamentos (Lit1176)
- LIGACAO NOVA MT - CLIENTE LIVRE
- RETIRAR EQUIPAMENTOS
- SUBST. MEDIDOR INICIATIVA COELCE
- SUBST. MEDIDOR A PEDIDO
- AFERIÇÃO DE MEDIDOR
- SUBST. DE EQUIPAMENTO DE MEDICAO
- EXECUCAO DO DECRESCIMO DE POTENCIA

### Grupo 3: p$Retorno_Substituicao_de_Display (Lit575)
- SUBSTITUIÇÃO DE DISPLAY

### Grupo 4: p$Retorno_Instalacao_de_Display (Lit483)
- INSTALACAO DO DISPLAY

### Grupo 5: p$Retorno_Inspecao_de_UC_Cortada (Lit493)
- INSPECAO UC CORTADA I15
- INSPECAO UC CORTADA I30
- INSPECAO UC CORTADA I90
- INSPECAO UC CORTADA I180
- EXECUCAO DO ACRESCIMO DE POTENCIA (também cai aqui!)

### Grupo 6: p$Retorno_Viistoria_Ligacao (Lit538)
- ET: VISTORIA - LIGACAO NOVA MEDIA TENSAO

### Grupo 7: p$Retorno_Corte_Por_Falta_de_Pagamento (Lit406)
- CORTE POR FALTA DE PAGAMENTO

### Grupo 8: p$Retorno_Corte_de_UC_Por_Def_Tecnico (Lit381)
- CORTE DE UC POR DEF TECNICO

### Grupo 9: p$Retorno_Desligamento_Programado (Lit464)
- DESLIG.PROG.MANUTENÇÃO

### Grupo 10: Direto para Envio (nenhum match)
- Todos os demais: ADEQUACAO SMF, AFERIÇÃO MEDIDOR CLIENTE LIVRE, COLHER LEITURA, etc.
- O código seta `Lit6 = 2` e chama `p$EnviarEmail` diretamente

---

## Templates de Texto Fixo (para ordens sem validação extra)

Quando uma ordem não tem tela específica, o `Ls_Tipo_de_ordem$AfterSelecting` preenche um texto template em `Txt_Retorno`. Templates identificados:

| Ordem | Template |
|-------|----------|
| ADEQUACAO SMF | `\nADEQUACAO DATA: \nHORÁRIO: \nINSTALADO GPS Nº: \nMARCA: \nSINCRONISMO REALIZADO COM SUCESSO. \nFOI INSTALADO MEDIDOR DA MARCA ION NC: \nMEDIDOR DE MARCA LANDIS NC:\nPERMANECE ACOPLADO AO CONJUNTO DE MEDIÇÃO: \nUC FOI DESLIGADO AS: \nRELIGADA AS: \nIP Nº: \nMASK: \nGW: \nCARGA IMPOSTA: \nEQUIPE: \nCADASTRO ENVIADO PARA APROVACAO SCDE EM: \nCADASTRO SCDE APROVADO EM: \nPROCESSO FINALIZADO PARA \nOBSERVAÇÃO: \nEQUIPE: \n` |
| COLHER LEITURA | `\n MEDIDOR SUBSTITUIDO NC: \n MEDIDOR RETIRADO NC: \n PELO MOTIVO: \n MEDIDOR INSTALADO NC: \n COLHIDO LEITURA VIA OU NOTEBOOK: \n OBSERVAÇÃO: \n` |
| CORTE DEFINITIVO A PEDIDO | `\n COLHIDO LEITURA VIA: \n RETIRADO MEDIDOR NC: \n CONJUNTO: \n TC: \n TP: \n REMOTA (Landis / V2): \n PORTA: \n REMOTA: \n OBSERVACAO: \n` |
| EXECUÇÃO DE MUDANÇA DE TARIFA | `\n REALIZADA VERIFICAÇÃO NOS DADOS DA MEDIÇÃO ATRAVÉS DA TELEMEDIÇÃO E EXECUTADA MUDANCA DE TARIFA DE: \n PARA TARIFA: \n OBSERVAÇÃO: \n` |
| GRANDES CLIENTES SEM MEDIÇÃO | `\n CLIENTE ENCONTRA-SE COM QUAL TIPO DE MEDICAO BY PASSADOS: \n NOME DO RESPONSAVEL: \n CELULAR: \n FIXO: \n E-MAIL: \n OBSERVACAO: \n` |
| GRANDES CLIENTES SELO ROMPIDO | `\n CONFORME INSPECAO: \n` |
| LIBERACAO DE PULSO | `ABERTURA DO QUADRO PARA CONECTAR CABO DO EQUIPAMENTO DE DEMANDA DO CLIENTE. \n OBSERVAÇÃO: \n` |
| RELIGACAO NORMAL RURAL / RELIGAÇÃO NORMAL URBANA | `\n RELIGACAO EXECUTADA DIA \n HORÁRIO: \n` |
| RETIRAR RAMAL | `\n CONJUNTO DE MEDICAO CONTINUA: \n MEDICAO EM BAIXO CONTINUA: \n RETIRADA E VIAVEL COM: \n OBSERVAÇÃO: \n` |
| SERVIÇO ESPECIAL OPERAÇÃO | `\n CONFORME VISITA FOI REALIZADO: \n` |
| SUBSTITUIÇÃO DA BATERIA DO MEDIDOR | `\n BATERIA DO MEDIDOR QUE ENCONTRAVA-SE COM \n OBSERVAÇÃO: \n` |
| TELEMEDIÇÃO MANUTENÇÃO / TELEMEDIÇÃO MANUTENÇÃO LOTE | `\n Nº DA REMOTA RETIRADA: \n CHIP E OPERADORA RETIRADA: \n Nº DO CHIP RETIRADO: \n Nº DA REMOTA INSTALADA: \n CHIP E OPERADORA INSTALADA: \n Nº DO CHIP INSTALADA: \n RESTABELECEU A COMUNICAÇÃO COM A BASE AS: \n CONFORME CONTATO (COM): \n FOI COLHIDA LEITURA VISUAL E NETBOOK: \n OBSERVAÇÃO: \n` |
| VISTORIA ACRESCIMO DECRESCIMO | `\n VAI SER NO MESMO RAMAL: \n VAI SER NA MESMA MEDIÇÃO: \n LIBERADA PARA EXECUTAR ACRESCIMO/DECRESCIMO DE POTENCIA: \n REALIZOU AS DEVIDAS ALTERAÇÕES NA SUBESTAÇÃO:\n NOME DO RESPONSAVEL: \n CELULAR: \n FIXO: \n E-MAIL: \n OBSERVAÇÃO: \n` |
| VISTORIA DA UC | `\n OBSERVAÇÃO: \n` |
| VISTORIA GERAÇÃO DISTRIBUIDA | `\n TIPO DE MEDICAO: \n VISTORIA DE GERACAO: \n` |
| VISTORIA PONTO DE ENTREGA CLIENTE | `\n LIBERADA PARA EXECUTAR LIGAÇÃO NOVA: \n OBRA JÁ EXECUTOU: \n CONJUNTO DE MEDIÇÃO JÁ NO LOCAL: \n PADRÃO CUBICULO?: \n NOME DO RESPONSAVEL: \n CELULAR: \n FIXO: \n E-MAIL: \n OBSERVAÇÃO: \n` |
| VISITA TECNICA MIGRAÇÃO | `\n CONFORME VISITA MIGRAÇÃO: \n REALIZADA DIA: \n HORÁRIO: \n EQUIPE: \n` |

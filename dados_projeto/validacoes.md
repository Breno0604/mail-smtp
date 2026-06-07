# Validações (p$Verificar_*)

Todas as funções de validação seguem o padrão:
1. Verificam campos obrigatórios sequencialmente
2. No primeiro erro, chamam `Notifier.ShowAlert` com mensagem e param
3. Se tudo OK, retornam "OK" na variável global

## p$verificarCamposTelaInicio (Lit1099)

Validações dos campos iniciais da Tela_inicial:

| Ordem | Campo | Verificação | Mensagem de Erro |
|-------|-------|-------------|-----------------|
| 1 | Tipo de Ordem | Spinner não vazio | "Selecione um tipo de ordem" |
| 2 | Cliente | Spinner não vazio | "Selecione o cliente" |
| 3 | Ordem | TextBox não vazio | "Preencha o campo Ordem" |
| 4 | UC | TextBox não vazio | "Preencha o campo UC" |
| 5 | Município | Spinner não vazio | "Selecione o município" |

> Se passar, retorna "OK" na `Lit6` (variável global que controla o fluxo).

---

## p$Verificar_Execucao_Ligacao_nova (Lit1211)

Validações para ordens do grupo **Ligação Nova**:
- LIGAÇÃO NOVA SIMULTÂNEA
- LIGAÇÃO NOVA ISOLADA
- ET: LIGAÇÃO - LIGACAO NOVA MEDIA TENSAO

Campos validados:
| Campo | ID | Mensagem |
|-------|-----|---------|
| Tombamento | Txt_Tombamento | "Preencha Campo \"TOMBAMENTO\"" |
| Coordenada X | Txt_COORD_X | "Preencha Campo \"COORD X\"" |
| Coordenada Y | Txt_COORD_Y | "Preencha Campo \"COORD Y\"" |
| Qtde Medidor BT | Ls_Qtde_Medididor_BT | "Preencha Campo \"QTDE MEDIDOR BT\"" |
| Medidor BT Retirado/Cortado | Ls_Medididor_BT_Retirado_ou_Cortado | "Preencha Campo \"MEDIDOR BT RETIRADO/CORTADO\"" |
| Ligação Executada | Ls_Ligacao_Executada | "Preencha Campo \"LIGAÇÃO EXECUTADA\"" |

---

## p$Verificar_Substituicao_de_Equipamentos (Lit1176)

Validações para ordens do grupo **Substituição de Equipamentos**:
- LIGACAO NOVA MT - CLIENTE LIVRE
- RETIRAR EQUIPAMENTOS
- SUBST. MEDIDOR INICIATIVA COELCE
- SUBST. MEDIDOR A PEDIDO
- AFERIÇÃO DE MEDIDOR
- SUBST. DE EQUIPAMENTO DE MEDICAO
- EXECUCAO DO DECRESCIMO DE POTENCIA
- EXECUCAO DO ACRESCIMO DE POTENCIA

Campos validados:
| Ordem | Condição | Campo | Mensagem |
|-------|----------|-------|----------|
| 1 | Sempre | Ls_Substituicao_de_Equipamentos_Executada | "Preencha Campo \"SERVIÇO EXECUTADO\"" |
| 2 | Se Serviço = "INSTALAR CONJUNTO" | Cs_Informar_Medidor_Instalado | "PREENCHA O CAMPO MEDIDOR" |
| 3 | Se Serviço = "INSTALAR CONJUNTO" | Cs_Informar_Conjunto_Instalado | "PREENCHA O CAMPO CONJUNTO" |
| 4 | Se Serviço = "INSTALAR CONJUNTO" | Cs_Informar_Display_Instalado | "PREENCHA O CAMPO DISPLAY" |
| 5 | Se Serviço = "INSTALAR CONJUNTO" | Cs_Informar_TC_FASE_A_Instalado | "PREENCHA O CAMPO TC FASE A" |
| 6 | Se Serviço = "INSTALAR CONJUNTO" | Cs_Informar_TC_FASE_B_Instalado | "PREENCHA O CAMPO TC FASE B" |
| 7 | Se Serviço = "INSTALAR CONJUNTO" | Cs_Informar_TC_FASE_C_Instalado | "PREENCHA O CAMPO TC FASE C" |
| 8 | Se Serviço = "INSTALAR CONJUNTO" | Cs_Informar_TP_FASE_A_Instalado | "PREENCHA O CAMPO TP FASE A" |
| 9 | Se Serviço = "INSTALAR CONJUNTO" | Cs_Informar_TP_FASE_B_Instalado | "PREENCHA O CAMPO TP FASE B" |
| 10 | Se Serviço = "INSTALAR CONJUNTO" | Cs_Informar_TP_FASE_C_Instalado | "PREENCHA O CAMPO TP FASE C" |
| 11 | Se Serviço = "RETIRADO" | Cs_Informar_Medidor_Retirado | "PREENCHA O CAMPO MEDIDOR RETIRADO" |
| 12 | Se Serviço = "RETIRADO" | Cs_Informar_Conjunto_Retirado | "PREENCHA O CAMPO CONJUNTO RETIRADO" |
| 13+ | (Similar para todos os 6 checkboxes de retirado) | | |

---

## Validação de Pré-APR (Telas PRE_APR / Corte de UC por Def Técnico)

Usada em **duas funções** (lambda74/84):
- Tela_PRE_APR
- Tela_Corte_de_UC_por_def_Tecnico

Validação sequencial:

| Ordem | Condição | Campo | Mensagem de Erro |
|-------|----------|-------|-----------------|
| 1 | Sempre | MOTIVO DA PRE APR (Txt_Motivo_PRE_APR) | "Preencha Campo \"MOTIVO DA PRE APR\"" |
| 2 | Sempre | MEDIÇÃO AVARIADA? (Ls_Medicao_Avariada) | "Preencha Campo \"MEDIÇÃO AVARIADA?\"" |
| 3 | Se Medição Avariada = SIM | QUAL O PROBLEMA DA MEDIÇÃO? (Txt_Problema_Medicao) | "Preencha Campo \"QUAL O PROBLEMA DA MEDIÇÃO?\"" |
| 4 | Sempre | NECESSARIO LINHA VIVA (Ls_Necessario_Linha_Viva) | "Preencha Campo \"NECESSARIO LINHA VIVA\"" |
| 5 | Se Linha Viva = SIM | POR QUE É NECESSARIO LINHA VIVA? (Txt_Porque_Linha_Viva) | "Preencha Campo \"POR QUE É NECESSARIO LINHA VIVA?\"" |
| 6 | Sempre | TOMBAMENTO DA CHAVE DE CORTE (Txt_Chave_Corte) | "Preencha Campo \"TOMBAMENTO DA CHAVE DE CORTE\"" |
| 7 | Sempre | TOMBAMENTO DA CHAVE CLIENTE (Txt_Chave_Cliente) | "Preencha Campo \"TOBAMENTO DA CHAVE CLIENTE\"" |
| 8 | Sempre | QUANTIDADE ATERRAMENTOS (Ls_Quantidade_Aterramento) | "Preencha Campo \"QUANTIDADE ATERRAMENTOS\"" |
| 9 | Sempre | CONTATO CLIENTE (Ls_Contato_Cliente) | "Preencha Campo \"CONTATO CLIENTE\"" |
| 10 | Se Contato = SIM | NOME DO RESPONSAVEL (Txt_Nome_Responsavel) | "Preencha Campo \"NOME DO RESPONSAVEL\"" |
| 11 | Se Contato = SIM | CELULAR COM DDD (Txt_Celular) | "Preencha Campo \"CELULAR COM DDD\"" |
| 12 | Se Contato = SIM | TELEFONE FIXO (Txt_Telefone_Fixo) | "Preencha Campo \"TELEFONE FIXO\"" |
| 13 | Se Contato = SIM | EMAIL (Txt_Email_Contato) | "Preencha Campo \"EMAIL\"" |

> Nota: Há duas funções de validação quase idênticas para PRE-APR:
> - lambda74 (linha 18120): Usada na Tela_PRE_APR
> - lambda86 (linha 18238): Usada na Tela_Corte_de_UC_por_def_Tecnico
> Ambas validam os mesmos campos com a mesma lógica.

---

## p$Verificar_Telemedicao_Retirada (Lit590)

Valida:
- MARCA REMOTA RETIRADA (Ls_Marca_Remota_Retirada) - primeiro verificado
- OPERADORA CHIP RETIRADO (Ls_Operadora_Chip_Retirada) - segundo verificado

Mensagens: "Preencha Campo \"MARCA REMOTA RETIRADA\"" e "Preencha Campo \"OPERADORA CHIP RETIRADO\""

Retorna "TELEMEDICAO RETIRADO OK" se passar.

---

## p$Verificar_Telemedicao_Instalada (Lit455)

Valida:
- MARCA REMOTA INSTALADA (Ls_Marca_Remota_Instalada)
- OPERADORA CHIP INSTALADO (Ls_Operadora_Chip_Instalada)

Mensagens: "Preencha Campo \"MARCA REMOTA INSTALADA\"" e "Preencha Campo \"OPERADORA CHIP INSTALADO\""

Retorna "TELEMEDICAO INSTALADO OK" se passar.

---

## Observações sobre o padrão de validação

- **Notifier.ShowAlert**: chamado com `runtime.callComponentMethod(Lit94, Lit95, list3, pairWithPosition)`
  - Lit94 = Notifier1, Lit95 = ShowAlert
  - list3 = `List("", "mensagem", "OK")` 
  - pairWithPosition = referência de linha no .yail
- **string$Mnempty$Qu**: verifica se campo está vazio (`runtime.callYailPrimitive(runtime.string$Mnempty$Qu, LList.list1(...), ...)`)
- **yail$Mnequal$Qu**: compara se campo = "SIM" (comparação case-sensitive)
- **Condicionais**: usam `runtime.processAndDelayed$V(new Object[]{lambdaCondicao, lambdaErro})`
  - Se `lambdaCondicao` retorna TRUE, executa `lambdaErro` (validação condicional)
- **Variável de controle**: `Lit6` (g$Verificacao) usada como flag de controle:
  - 0 = padrão/inicial
  - 1 = "OK" (passou)
  - 2 = "pular verificação" (vai direto para envio)

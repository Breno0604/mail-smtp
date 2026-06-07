# Modelo de Dados

## Estrutura por Tipo de Ordem

Cada tipo de ordem de serviço pode ter:
1. **Campos comuns** (sempre presentes): Tipo, Cliente, Ordem, UC, Município, APR, PRE APR, Notificado, Muck B&Q, Placa, Técnicos, Data/Hora, Observação
2. **Campos de template** (15 tipos que preenchem Txt_Retorno com texto modelo com placeholders)
3. **Campos específicos** (tipos que têm tela própria com campos adicionais)

---

## 1. LIGAÇÃO NOVA (SIMULTÂNEA / ISOLADA / MT)

**Tela**: Tela_Execucao_Ligacao_Nova
**Função de verificação**: p$Verificar_Execucao_Ligacao_nova → p$Retorno_Execucao_Ligacao_Nova

Campos específicos:
| Campo | ID | Tipo |
|-------|------|------|
| Tombamento | Txt_Tombamento | Text |
| Coordenada X | Txt_COORD_X | Text |
| Coordenada Y | Txt_COORD_Y | Text |
| Qtde Medidor BT | Ls_Qtde_Medididor_BT | Spinner (1-4) |
| Medidor BT Retirado/Cortado | Ls_Medididor_BT_Retirado_ou_Cortado | Spinner (SIM/NÃO) |
| Ligação Executada | Ls_Ligacao_Executada | Spinner (SIM/NÃO) |

---

## 2. Substituição de Equipamentos (7 tipos)

**Aplica-se a**:
- LIGACAO NOVA MT - CLIENTE LIVRE
- RETIRAR EQUIPAMENTOS
- SUBST. MEDIDOR INICIATIVA COELCE
- SUBST. MEDIDOR A PEDIDO
- AFERIÇÃO DE MEDIDOR
- SUBST. DE EQUIPAMENTO DE MEDICAO
- EXECUCAO DO DECRESCIMO DE POTENCIA
- EXECUCAO DO ACRESCIMO DE POTENCIA

**Tela**: Tela_Substituicao_de_Equipamentos (compartilhada)
**Função de verificação**: p$Verificar_Substituicao_de_Equipamentos → p$Retorno_Substituicao_de_Equipamentos

Campos específicos:
| Campo | ID | Tipo |
|-------|------|------|
| Serviço Executado | Ls_Substituicao_de_Equipamentos_Executada | Spinner (INSTALAR CONJUNTO/RETIRADO/TROCA/SEM ALTERAÇÃO) |
| Medidor Instalado | Cs_Informar_Medidor_Instalado | CheckBox |
| Conjunto Instalado | Cs_Informar_Conjunto_Instalado | CheckBox |
| Display Instalado | Cs_Informar_Display_Instalado | CheckBox |
| TC Fase A Instalado | Cs_Informar_TC_FASE_A_Instalado | CheckBox |
| TC Fase B Instalado | Cs_Informar_TC_FASE_B_Instalado | CheckBox |
| TC Fase C Instalado | Cs_Informar_TC_FASE_C_Instalado | CheckBox |
| TP Fase A Instalado | Cs_Informar_TP_FASE_A_Instalado | CheckBox |
| TP Fase B Instalado | Cs_Informar_TP_FASE_B_Instalado | CheckBox |
| TP Fase C Instalado | Cs_Informar_TP_FASE_C_Instalado | CheckBox |
| Medidor Retirado | Cs_Informar_Medidor_Retirado | CheckBox |
| Conjunto Retirado | Cs_Informar_Conjunto_Retirado | CheckBox |
| Display Retirado | Cs_Informar_Display_Retirado | CheckBox |
| TC Fase A Retirado | Cs_Informar_TC_FASE_A_Retirado | CheckBox |
| TC Fase B Retirado | Cs_Informar_TC_FASE_B_Retirado | CheckBox |
| TC Fase C Retirado | Cs_Informar_TC_FASE_C_Retirado | CheckBox |
| TP Fase A Retirado | Cs_Informar_TP_FASE_A_Retirado | CheckBox |
| TP Fase B Retirado | Cs_Informar_TP_FASE_B_Retirado | CheckBox |
| TP Fase C Retirado | Cs_Informar_TP_FASE_C_Retirado | CheckBox |

---

## 3. SUBSTITUIÇÃO DE DISPLAY

**Tela**: Tela_Substituicao_de_Display
**Função**: p$Retorno_Substituicao_de_Display (dentro de p$Verificar_Tipo_Ordem_de_Servico, grupo 3)

Campos específicos:
| Campo | ID | Tipo |
|-------|------|------|
| Serviço Executado | Ls_Substituicao_de_Display_Executada | Spinner |
| Número Display | Txt_Numero_Display | Text |
| Observação Display | Txt_Observacao_Display | Text |

---

## 4. INSTALACAO DO DISPLAY

**Tela**: Tela_Substituicao_de_Display (reutilizada)
**Função**: p$Retorno_Instalacao_de_Display

Campos específicos: (mesmos da substituição de display)

---

## 5. Inspeção UC Cortada (4 subtipos + EXECUCAO DO ACRESCIMO DE POTENCIA)

**Aplica-se a**:
- INSPECAO UC CORTADA (I15)
- INSPECAO UC CORTADA (I30)
- INSPECAO UC CORTADA (I90)
- INSPECAO UC CORTADA (I180)
- EXECUCAO DO ACRESCIMO DE POTENCIA

**Tela**: Tela_Inspecao_UC_Cortada
**Função**: p$Retorno_Inspecao_de_UC_Cortada

Campos específicos:
| Campo | ID | Tipo |
|-------|------|------|
| TOI | Ls_TOI | Spinner (APLICADO/NAO APLICADO/PERDAS JÁ APLICOU) |
| Número TOI | Txt_Numero_TOI | Text (condicional) |
| Por que não aplicado TOI | Txt_Pq_Nao_Foi_Aplicado_TOI | Text (condicional) |
| Observação Inspeção | Txt_Observacao_Inspecao | Text |

---

## 6. CORTE POR FALTA DE PAGAMENTO

**Tela**: Tela_Corte_Por_Falta_de_Pagamento
**Função**: p$Retorno_Corte_Por_Falta_de_Pagamento

Campos específicos:
| Campo | ID | Tipo |
|-------|------|------|
| Corte/Religação | Ls_Corte_ou_Religacao_Apos_Corte | Spinner (EXECUTOU CORTE/EXECUTOU RELIGAÇÃO) |
| Observação | Txt_Observacao_Corte_Pagamento | Text |

---

## 7. CORTE DE UC POR DEF TECNICO

**Tela**: Tela_Corte_de_UC_por_def_Tecnico
**Função**: p$Retorno_Corte_de_UC_Por_Def_Tecnico (usa p$Retorno_PRE_APR)

Campos específicos:
| Campo | ID | Tipo |
|-------|------|------|
| Motivo da PRE APR | Txt_Motivo_PRE_APR | Text |
| Medição Avariada | Ls_Medicao_Avariada | Spinner (SIM/NÃO) |
| Problema Medição | Txt_Problema_Medicao | Text (condicional) |
| Necessário Linha Viva | Ls_Necessario_Linha_Viva | Spinner (SIM/NÃO) |
| Por que Linha Viva | Txt_Porque_Linha_Viva | Text (condicional) |
| Chave de Corte | Txt_Chave_Corte | Text |
| Chave Cliente | Txt_Chave_Cliente | Text |
| Qtd Aterramentos | Ls_Quantidade_Aterramento | Spinner (1-10) |
| Contato Cliente | Ls_Contato_Cliente | Spinner (SIM/NÃO/N/A) |
| Nome Responsável | Txt_Nome_Responsavel | Text (condicional) |
| Celular | Txt_Celular | Text (condicional) |
| Telefone Fixo | Txt_Telefone_Fixo | Text (condicional) |
| Email Contato | Txt_Email_Contato | Text (condicional) |
| Corte/Religação | Ls_Corte_ou_Religacao_Apos_Corte | Spinner |

---

## 8. DESLIG.PROG.MANUTENÇÃO

**Tela**: Tela_Desligamento_Programado
**Função**: p$Retorno_Desligamento_Programado

Campos específicos:
| Campo | ID | Tipo |
|-------|------|------|
| Data Desligamento | Txt_Data_Desligamento | Text |
| Hora Desligamento | Txt_Hora_Desligamento | Text |
| Previsão Retorno | Txt_Hora_Previsao_Retorno | Text |
| Observação | Txt_Observacao_Desligamento | Text |

---

## 9. ET: VISTORIA - LIGACAO NOVA MEDIA TENSAO

**Tela**: Tela_Vistoria_ligacao
**Função**: p$Retorno_Viistoria_Ligacao (typo mantido)

Campos específicos:
| Campo | ID | Tipo |
|-------|------|------|
| Tombamento Vistoria | Txt_Tombamento_Vistoria | Text |
| Coordenada X Vistoria | Txt_COORD_X_Vistoria | Text |
| Coordenada Y Vistoria | Txt_COORD_Y_Vistoria | Text |
| Observação Vistoria | Txt_Observacao_Vistoria | Text |

---

## 10. Tipos com Template (15 tipos)

Estes tipos não têm tela específica — usam template de texto com placeholders que preenchem Txt_Retorno:

| Tipo | Template |
|------|----------|
| ADEQUACAO SMF | "FOI REALIZADO ADEQUAÇÃO SMF" |
| COLHER LEITURA | "FOI EFETUADO COLHER LEITURA" |
| CORTE DEFINITIVO A PEDIDO | "FOI REALIZADO CORTE DEFINITIVO A PEDIDO" |
| EXECUÇÃO DE MUDANÇA DE TARIFA | "FOI REALIZADO EXECUÇÃO DE MUDANÇA DE TARIFA" |
| GRANDES CLIENTES SEM MEDIÇÃO | "FOI REALIZADO GRANDES CLIENTES SEM MEDIÇÃO" |
| LIBERAÇÃO DE PULSO | "FOI REALIZADO LIBERAÇÃO DE PULSO" |
| RELIGAÇÃO (RURAL/URBANA) | "FOI EFETUADO RELIGAÇÃO" |
| RETIRAR RAMAL | "FOI RETIRADO RAMAL" |
| SERVIÇO ESPECIAL OPERAÇÃO | "FOI REALIZADO SERVIÇO ESPECIAL OPERAÇÃO" |
| SUBSTITUIÇÃO DA BATERIA/MEDIDOR | "FOI REALIZADO SUBSTITUIÇÃO DA BATERIA/MEDIDOR" |
| VISTORIA (vários) | "FOI REALIZADO VISTORIA" |
| VISITA TECNICA MIGRAÇÃO | "FOI REALIZADO VISITA TECNICA MIGRAÇÃO" |
| GRANDES CLIENTES SELO ROMPIDO | "FOI REALIZADO GRANDES CLIENTES SELO ROMPIDO" |

---

## 11. Tipos sem verificação específica (vão direto para envio)

Qualquer tipo que não seja correspondido por nenhum dos grupos acima segue o fluxo:
- Lit6 = 2 (pular verificação)
- p$EnviarEmail() é chamado diretamente

---

## Relacionamentos

- **Tela_Corte_de_UC_por_def_Tecnico** reusa a lógica de validação e texto de retorno de **Tela_PRE_APR** através das funções compartilhadas `p$verificarCamposPRE_APR` e `p$Retorno_PRE_APR`
- **Checkboxes** Cs_Informar_* são compartilhados entre 3 telas: Equip_Instalados, Equip_Retirados, Substituicao_de_Equipamentos
- **Campos de contato** (Ls_Contato_Cliente, Txt_Nome_Responsavel, etc.) são compartilhados entre Tela_PRE_APR e Tela_Corte_de_UC_por_def_Tecnico
- **Timer_Desligamento_Programado** controla tempo na Tela_Desligamento_Programado

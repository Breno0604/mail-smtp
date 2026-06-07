# Fluxo de Navegação

## Visão Geral

O app usa **1 única tela Android** (Screen1/Form) com múltiplos `VerticalArrangement` que são mostrados/escondidos via `Visible` property.

```
[App Inicia]
    |
    v
[Tela_inicial] - Campos: Tipo, Cliente, Ordem, UC, Município, APR, PRE APR,
                 Notificado, Muck B&Q, Placa, Técnicos, Data/Hora, Obs
    |
    | (seleciona Tipo de Ordem)
    v
[Ls_Tipo_de_ordem$AfterSelecting]
    |-- Fecha todas as telas (p$Fechar_Telas)
    |-- Match do tipo:
    |     |- Se tem tela específica: mostra o arrangement principal
    |     |- Se tem template: preenche Txt_Retorno com o texto modelo
    |
    | (clica "PRÓXIMO")
    v
[Btn_Proximo$Click]
    |
    v
[p$verificarCamposTelaInicio]  -- Valida campos básicos
    |
    |- Se falhou: Notifier.ShowAlert + STOP
    |
    v (passou)
[p$Verificar_Tipo_Ordem_de_Servico]  -- Match por tipo
    |
    |- Match -> Chama função de verificação específica
    |    |- valida campos
    |    |- monta texto de retorno
    |    |- se OK -> chama próximo passo
    |
    |- No match -> vai direto para envio
    |
    v
[Tela_Anexos] + [Tela_Finalizacao]
    |
    v
[p$EnviarEmail] -> SmtpClient.send
    |
    v
[Callback: Sucesso | Erro]
```

## Funções de Navegação

### p$Fechar_Telas (p$Fn68 - linha 18058)
Chama sequencialmente 12 funções para esconder todos os arrangements:
1. p$Fechar_Tela_Execucao_Ligacao_Nova (Lit70)
2. p$Fechar_Tela_Equipamentos_Instalados (Lit71)
3. p$Fechar_Tela_Telemedicao_Instalada (Lit72)
4. p$Fechar_Tela_Telemedicao_Retirada (Lit73)
5. p$Fechar_Tela_Equipamentos_Retirados (Lit74)
6. p$Fechar_Tela_Substituicao_de_Equipamentos (Lit75)
7. p$Fechar_Tela_Substituicao_de_Display (Lit76)
8. p$Fechar_Tela_Inspecao_de_UC_Cortada (Lit77)
9. p$Fechar_Tela_Corte_Por_Falta_de_pagamentos (Lit78)
10. p$Fechar_Tela_Corte_de_UC_Por_Def_Tecnico (Lit79)
11. p$Fechar_Desligamento_Programado (Lit80)
12. p$Fechar_Tela_Vistoria_Ligacao (Lit81)

### Ls_Tipo_de_ordem$AfterSelecting (linha 36549)
Evento principal que reage à seleção do tipo de ordem:

1. **Sempre**: Fecha todas as telas, limpa Txt_Retorno, limpa g$Observacao
2. **RETIRAR EQUIPAMENTOS**: Mostra Tela_Substituicao_de_Equipamentos, texto "FOI RETIRADO EQUIPAMENTOS?"
3. **ADEQUACAO SMF**: Preenche template no Txt_Retorno
4. **COLHER LEITURA**: Preenche template no Txt_Retorno
5. **CORTE DE UC POR DEF TECNICO**: Mostra Tela_Corte_de_UC_por_def_Tecnico
6. **CORTE DEFINITIVO A PEDIDO**: Preenche template
7. **DESLIG.PROG.MANUTENÇÃO**: Mostra Tela_Desligamento_Programado
8. **CORTE POR FALTA DE PAGAMENTO**: Mostra Tela_Corte_Por_Falta_de_Pagamento
9. **EXECUÇÃO DE MUDANÇA DE TARIFA**: Preenche template
10. **GRANDES CLIENTES SEM MEDIÇÃO**: Preenche template
11. **INSPECAO UC CORTADA (I15/I30/I90/I180)**: Mostra Tela_Inspeca_UC_Cortada, esconde Tela_TOI_Inspeca_UC_Cortada
12. **INSTALACAO DO DISPLAY**: Mostra Tela_Substituicao_de_Display
13. **LIBERACAO DE PULSO**: Preenche template
14. **LIGAÇÃO NOVA (SIMULTÂNEA/ISOLADA/MT)**: Mostra Tela_Execucao_Ligacao_Nova
15. **RELIGAÇÃO (RURAL/URBANA)**: Preenche template
16. **RETIRAR RAMAL**: Preenche template
17. **SERVIÇO ESPECIAL OPERAÇÃO**: Preenche template
18. **SUBSTITUIÇÃO DA BATERIA/MEDIDOR**: Preenche template
19. **SUBSTITUIÇÃO DE DISPLAY**: Mostra Tela_Substituicao_de_Display
20. **TELEMEDIÇÃO MANUTENÇÃO/LOTE**: Preenche template + mostra telas de telemedição
21. **VISTORIA (ACRESCIMO/DECRESCIMO/DA UC/GERAÇÃO/PONTO ENTREGA/MIGRAÇÃO)**: Preenche templates
22. **ET: VISTORIA - LIGACAO NOVA MEDIA TENSAO**: Mostra Tela_Vistoria_ligacao
23. **VISITA TECNICA MIGRAÇÃO**: Preenche template
24. **GRANDES CLIENTES SELO ROMPIDO**: Preenche template
25. **Não match**: Apenas fecha telas

### Btn_Proximo$Click (linha 48553)
```java
public Object Btn_Proximo$Click() {
    Lit6 = 0;  // "sucesso" flag
    p$verificarCamposTelaInicio();  // validação inicial
    if (Lit6 != 1) {  // se falhou, para
        return;
    }
    Lit6 = 0;
    p$Verificar_Tipo_Ordem_de_Servico();  // match por tipo e validação específica
}
```

### p$Verificar_Tipo_Ordem_de_Servico (lambda549 - linha 34388)
Função central que decide o próximo passo baseado no tipo de ordem:

1. **Grupo Ligação Nova** (3 tipos) → p$Verificar_Execucao_Ligacao_nova
2. **Grupo Substituição** (7 tipos) → p$Verificar_Substituicao_de_Equipamentos
3. **SUBSTITUIÇÃO DE DISPLAY** → p$Retorno_Substituicao_de_Display
4. **INSTALACAO DO DISPLAY** → p$Retorno_Instalacao_de_Display
5. **Grupo Inspeção UC Cortada** (4 tipos + EXECUCAO DO ACRESCIMO DE POTENCIA) → p$Retorno_Inspecao_de_UC_Cortada
6. **ET: VISTORIA - LIGACAO NOVA MEDIA TENSAO** → p$Retorno_Viistoria_Ligacao
7. **CORTE POR FALTA DE PAGAMENTO** → p$Retorno_Corte_Por_Falta_de_Pagamento
8. **CORTE DE UC POR DEF TECNICO** → p$Retorno_Corte_de_UC_Por_Def_Tecnico
9. **DESLIG.PROG.MANUTENÇÃO** → p$Retorno_Desligamento_Programado
10. **Default (nenhum match)** → Lit6 = 2, chama p$EnviarEmail diretamente

---

## Eventos AfterSelecting Importantes

### Ls_Contato_Cliente$AfterSelecting (linha 47162)
Quando "Contato Cliente" é selecionado:
- Se SIM: mostra campos Nome, Celular, Fixo, Email
- Se NÃO/N/A: esconde campos, limpa valores

### Ls_TOI$AfterSelecting
- Se "APLICADO TOI": mostra Tela_Numero_TOI, esconde Tela_Pq_Nao_Foi_Aplicado_TOI
- Se "NAO FOI APLICADO TOI": mostra Tela_Pq_Nao_Foi_Aplicado_TOI, esconde Tela_Numero_TOI
- Se "PERDAS JÁ APLICOU TOI": esconde ambos

### Ls_Marca_Remota_Instalada$AfterSelecting e Ls_Marca_Remota_Retirada$AfterSelecting
Habilita o campo "Porta" quando uma marca diferente de "SEM ALTERAÇÃO" é selecionada.

---

## Callbacks de Envio

### SmtpClient1$GotResult (linha 48672)
- Se resultado = TRUE: Notifier "ORDEM DE SERVIÇO ENVIADA COM SUCESSO" / "RETORNO DE ORDEM DE SERVIÇO" / "Sair"
- Senão: Notifier "ERRO 001" / "ERRO AO ENVIAR RETORNO" / "SAIR"
- Reabilita Botão "Próximo"

### SmtpClient1$GotError (linha 48698)
- Notifier com lista: "VERFIQUE CONEXÃO COM INTERNET.", "TENTE REDUZIR A QUANTIDADE DE ANEXOS E REENVIAR NOVAMENTE.", "CONSIDERE REDUZIR RESOLUÇÃO DAS FOTOS."
- Título: "ERRO NO ENVIO"
- Reabilita Botão "Próximo"

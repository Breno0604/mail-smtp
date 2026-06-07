# Funções do App

## Funções Globais (p$*)

### Navegação (Fechar Telas)

| Função | Symbol | Lambda | Descrição |
|--------|--------|--------|-----------|
| p$Fechar_Telas | Lit69 | lambda68 | Esconde todos os 12 arrangements principais |
| p$Fechar_Tela_Execucao_Ligacao_Nova | Lit70 | lambda71 | Esconde tela de ligação nova |
| p$Fechar_Tela_Equipamentos_Instalados | Lit71 | lambda73 | Esconde tela de equipamentos instalados |
| p$Fechar_Tela_Telemedicao_Instalada | Lit72 | lambda147 | Esconde tela de telemedição instalada |
| p$Fechar_Tela_Telemedicao_Retirada | Lit73 | lambda144 | Esconde tela de telemedição retirada |
| p$Fechar_Tela_Equipamentos_Retirados | Lit74 | lambda121 | Esconde tela de equipamentos retirados |
| p$Fechar_Tela_Substituicao_de_Equipamentos | Lit75 | lambda140 | Esconde tela de substituição de equipamentos |
| p$Fechar_Tela_Substituicao_de_Display | Lit76 | lambda134 | Esconde tela de substituição de display |
| p$Fechar_Tela_Inspecao_de_UC_Cortada | Lit77 | lambda127 | Esconde tela de inspeção UC cortada |
| p$Fechar_Tela_Corte_Por_Falta_de_pagamentos | Lit78 | lambda71 | Esconde tela de corte por falta de pagamento |
| p$Fechar_Tela_Corte_de_UC_Por_Def_Tecnico | Lit79 | lambda150 | Esconde tela de corte de UC por def técnico |
| p$Fechar_Desligamento_Programado | Lit80 | lambda153 | Esconde tela de desligamento programado |
| p$Fechar_Tela_Vistoria_Ligacao | Lit81 | lambda137 | Esconde tela de vistoria de ligação |

### Verificação/Validação

| Função | Symbol | Lambda | Função |
|--------|--------|--------|--------|
| p$verificarCamposTelaInicio | Lit1099 | - | Valida campos da tela inicial |
| p$Verificar_Tipo_Ordem_de_Servico | Lit1246 | lambda549 | Função central: match tipo de ordem → chama verificação específica |
| p$Verificar_Execucao_Ligacao_nova | Lit1211 | - | Valida execução de ligação nova (6 campos) |
| p$Verificar_Substituicao_de_Equipamentos | Lit1176 | - | Valida substituição de equipamentos (checkboxes) |
| p$Verificar_Equip_Instalados | Lit453 | - | Valida equipamentos instalados |
| p$Verificar_Equip_Retirados | Lit588 | - | Valida equipamentos retirados |
| p$Verificar_Telemedicao_Instalada | Lit455 | lambda569 | Valida telemedição instalada (marca, operadora) |
| p$Verificar_Telemedicao_Retirada | Lit590 | lambda565 | Valida telemedição retirada (marca, operadora) |

### Construção de Texto de Retorno

Estas funções montam o texto específico que vai no corpo do email, baseado nos campos preenchidos.

| Função | Symbol | Descrição |
|--------|--------|-----------|
| p$Retorno_PRE_APR | Lit91 | Monta texto de retorno para Pré-APR (ou Corte Def Técnico) |
| p$Texto_PRE_APR | Lit222 | Texto adicional condicional da PRE-APR |
| p$Retorno_Corte_Por_Falta_de_Pagamento | Lit406 | Texto para corte por falta de pagamento |
| p$Retorno_Corte_de_UC_Por_Def_Tecnico | Lit381 | Texto para corte de UC por def técnico (usa p$Retorno_PRE_APR) |
| p$Retorno_Execucao_Ligacao_Nova | Lit452 | Texto para execução de ligação nova |
| p$Texto_Execucao_Ligacao_Nova | Lit457 | Texto adicional para ligação nova |
| p$Retorno_Substituicao_de_Equipamentos | Lit586 | Texto para substituição de equipamentos |
| p$Texto_Substituicao_de_Equipamentos | Lit592 | Texto adicional para substituição de equipamentos |
| p$Retorno_Substituicao_de_Display | Lit575 | Texto para substituição de display |
| p$Retorno_Inspecao_de_UC_Cortada | Lit493 | Texto para inspeção de UC cortada |
| p$Retorno_Desligamento_Programado | Lit464 | Texto para desligamento programado |
| p$Retorno_Instalacao_de_Display | Lit483 | Texto para instalação de display |
| p$Retorno_Viistoria_Ligacao | Lit538 | Texto para vistoria de ligação (nome com typo: "Viistoria") |
| p$Texto_Equipamentos_Instalados | Lit458 | Texto adicional para equipamentos instalados |
| p$Texto_Equipamentos_Retirados | Lit593 | Texto adicional para equipamentos retirados |
| p$Texto_Telemedicao_Instalada | Lit459 | Texto adicional para telemedição instalada |
| p$Texto_Telemedicao_Retirada | Lit594 | Texto adicional para telemedição retirada |

### Email

| Função | Symbol | Lambda | Descrição |
|--------|--------|--------|-----------|
| p$corpoEmail | Lit169 | lambda97 | Monta corpo do email completo (TIPO, CLIENTE, ORDEM, etc.) |
| p$assuntoEmail | Lit277 | lambda118 | Monta assunto: "RETORNO DE ORDEM - <TIPO> - <ORDEM>" |
| p$EnviarEmail | Lit318 | lambda131 | Envia o email via SmtpClient com fotos anexadas |

### Utilitários

| Função | Symbol | Descrição |
|--------|--------|-----------|
| p$FormatarHoraMinuto | Lit444 | Formata hora/minuto para exibição |
| p$ocular_imagens | Lit431 | Gerencia exibição/esconder de imagens (fotos anexadas) |
| p$MELHORIAS | Lit490 | Função não identificada no código analisado |

---

## Eventos da UI

| Evento | Localização | Descrição |
|--------|-------------|-----------|
| Ls_Tipo_de_ordem$AfterSelecting | linha 36549 | **Principal**: seleciona tela baseada no tipo de ordem |
| Ls_Contato_Cliente$AfterSelecting | linha 47162 | Mostra/esconde campos Nome, Celular, Fixo, Email |
| Ls_Marca_Remota_Instalada$AfterSelecting | Implementação interna | Habilita campo Porta quando marca ≠ "SEM ALTERAÇÃO" |
| Ls_Marca_Remota_Retirada$AfterSelecting | Implementação interna | Habilita campo Porta quando marca ≠ "SEM ALTERAÇÃO" |
| Ls_TOI$AfterSelecting | Implementação interna | Mostra Nº TOI ou Pq não aplicado baseado na seleção |

## Eventos de Sistema

| Evento | Localização | Descrição |
|--------|-------------|-----------|
| Btn_Proximo$Click | linha 48553 | Avança: valida campos iniciais → verifica tipo → chama função específica |
| SmtpClient1$GotResult | linha 48672 | Callback de sucesso/erro do envio de email |
| SmtpClient1$GotError | linha 48698 | Callback de erro de conexão/rede |
| JewelFilePicker1$MultipleFilesPicked | linha 12897 | Callback com lista de arquivos de foto selecionados |
| InternetChecker1$InternetAccessSuccess | linha 12898 | Internet OK, prossegue com envio |
| InternetChecker1$InternetAccessFailed | linha 12899 | Internet falhou, mostra alerta |

---

## Variáveis de Controle (Globais Não-Exportadas)

| Symbol | Nome Aproximado | Função |
|--------|-----------------|--------|
| Lit6 | g$Verificacao | Flag de controle: 0=inicial, 1=OK, 2=pular |
| Lit18 | g$corpoEmailCompleto | Corpo completo do email em maiúsculas |
| Lit46 | g$Texto_Retorno_Final | Texto de retorno final concatenado |
| Lit47 | g$Observacao | Texto de observação |
| Lit11 | g$Texto_Aterramento | "SERA UTILIZADO N CONJUNTO DE ATERRAMENTO" |
| Lit12 | g$Texto_Chave_Cliente | "CHAVE DE CLIENTE: ..." |
| Lit13 | g$Texto_Chave_Corte | "CHAVE DE CORTE: ..." |
| Lit14 | g$Texto_Contato | Nome/celular/fixo/email do contato |
| Lit22 | g$Texto_Medicao_Avariada | "MEDICAO AVARIADA DEVIDO ..." |
| Lit23 | g$Texto_Medicao_Bypassada | "MEDICAO BYPASSADA" |
| Lit24 | g$Texto_PRE_APR_Realizado | "REALIZADO PRE APR PARA ..." |
| Lit25 | g$Texto_Linha_Viva | "NECESSARIO LINHA VIVA: ..." |

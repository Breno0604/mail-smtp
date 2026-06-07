# Estrutura do App

## Configuração Principal

- **Forma**: Screen1 (Android Form, Kodular App Inventor)
- **Título**: "Retorno de Ordens de Serviço"
- **Tema Negrito**: Habilitado (`ThemeBold = true`)
- **Background**: app_name_bg.png
- **Icone**: logo_com_roda.png
- **Alinhamento**: Centro (center)
- **Scroll**: Habilitado (`Scrollable = true`)
- **ActionBar**: Escondida (`ShowActionBar = false`)
- **Título no ActionBar**: Escondido (`TitleVisible = false`)
- **Orientação**: Não-especificada (padrão: retrato)

## Componentes Globais

### SmtpClient (Envio de Email)
- **SenderName**: "RetornoGrupoA"
- **SenderPassword**: "193267214196154465"
- **Encryption**: NONE (sem TLS/SSL)

### InternetChecker (Verificação de Rede)
- **Componente**: InternetChecker1
- **Função**: Verifica acesso à internet antes de enviar email

### Notifier (Alertas)
- **Componente**: Notifier1
- **Uso**: Mostra mensagens de erro e sucesso (validação, timeout, etc.)

### Timers
- **Timer_Desligamento_Programado**: Timer para controle de desligamento programado

---

## Micro-telas (VerticalArrangements)

### Tela_Inicial (Campos Básicos)

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Ls_Tipo_de_ordem | Spinner | 50 tipos de ordem de serviço |
| Ls_Cliente | Spinner | Lista de clientes (~130+) |
| Txt_Ordem | TextBox | Número da ordem |
| Txt_UC | TextBox | Unidade consumidora |
| Ls_Municipio | Spinner | Lista de municípios |
| Txt_APR | TextBox | Número APR |
| Txt_PRE_APR | TextBox | Número PRE APR |
| Ls_Notificado | Spinner | Status de notificação |
| Txt_Muck_BQ | TextBox | Muck B&Q |
| Txt_Placa | TextBox | Placa do veículo |
| Txt_Tecnicos | TextBox | Nome dos técnicos |
| Txt_Data_Hora | TextBox | Data/hora (preenchido automático) |
| Txt_Observacao | TextBox | Observação geral |
| Txt_Retorno | TextBox | Texto de retorno (preenchido automaticamente) |
| Btn_Camera | Button | Abrir câmera para foto |
| Btn_Galeria | Button | Abrir galeria para foto |
| Btn_Proximo | Button | Avançar para verificação/envio |

### Tela_Execucao_Ligacao_Nova (Grupo LIGAÇÃO NOVA)

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Txt_Tombamento | TextBox | Número do tombamento |
| Txt_COORD_X | TextBox | Coordenada X |
| Txt_COORD_Y | TextBox | Coordenada Y |
| Ls_Qtde_Medididor_BT | Spinner | Quantidade de medidor BT (1-4) |
| Ls_Medididor_BT_Retirado_ou_Cortado | Spinner | Medidor BT retirado/cortado |
| Ls_Ligacao_Executada | Spinner | Ligação executada? |
| Spinner_Ligacao_Executada_Detalhe | Spinner | Detalhe da execução |

### Tela_Equipamentos_Instalados (Grupo EQUIP. INSTALADOS)

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Cs_Informar_Medidor_Instalado | CheckBox | Medidor instalado |
| Cs_Informar_Conjunto_Instalado | CheckBox | Conjunto instalado |
| Cs_Informar_Display_Instalado | CheckBox | Display instalado |
| Cs_Informar_TC_FASE_A_Instalado | CheckBox | TC Fase A instalado |
| Cs_Informar_TC_FASE_B_Instalado | CheckBox | TC Fase B instalado |
| Cs_Informar_TC_FASE_C_Instalado | CheckBox | TC Fase C instalado |
| Cs_Informar_TP_FASE_A_Instalado | CheckBox | TP Fase A instalado |
| Cs_Informar_TP_FASE_B_Instalado | CheckBox | TP Fase B instalado |
| Cs_Informar_TP_FASE_C_Instalado | CheckBox | TP Fase C instalado |

### Tela_Telemedicao_Instalada (Grupo TELEMEDIÇÃO INSTALADA)

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Ls_Marca_Remota_Instalada | Spinner | Marca da remota instalada |
| Txt_Porta_Marca_Remota_Instalada | TextBox | Porta da remota instalada |
| Ls_Operadora_Chip_Instalada | Spinner | Operadora chip instalado |

### Tela_Equipamentos_Retirados (Grupo EQUIP. RETIRADOS)

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Cs_Informar_Medidor_Retirado | CheckBox | Medidor retirado |
| Cs_Informar_Conjunto_Retirado | CheckBox | Conjunto retirado |
| Cs_Informar_Display_Retirado | CheckBox | Display retirado |
| Cs_Informar_TC_FASE_A_Retirado | CheckBox | TC Fase A retirado |
| Cs_Informar_TC_FASE_B_Retirado | CheckBox | TC Fase B retirado |
| Cs_Informar_TC_FASE_C_Retirado | CheckBox | TC Fase C retirado |
| Cs_Informar_TP_FASE_A_Retirado | CheckBox | TP Fase A retirado |
| Cs_Informar_TP_FASE_B_Retirado | CheckBox | TP Fase B retirado |
| Cs_Informar_TP_FASE_C_Retirado | CheckBox | TP Fase C retirado |

### Tela_Telemedicao_Retirada (Grupo TELEMEDIÇÃO RETIRADA)

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Ls_Marca_Remota_Retirada | Spinner | Marca da remota retirada |
| Txt_Porta_Marca_Remota_Retirada | TextBox | Porta da remota retirada |
| Ls_Operadora_Chip_Retirada | Spinner | Operadora chip retirado |

### Tela_Substituicao_de_Equipamentos (Grupo SUBSTITUIÇÃO)

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Ls_Substituicao_de_Equipamentos_Executada | Spinner | Serviço executado? |
| Cs_Informar_Medidor_Instalado | CheckBox | (Compartilhado com Instalados) |
| Cs_Informar_Conjunto_Instalado | CheckBox | |
| ... (9 checkboxes instalados + 9 retirados) | | |
| Txt_Numero_Substituicao | TextBox | Número da substituição |
| Txt_Demanda_Substituicao | TextBox | Demanda da substituição |
| Txt_Tensao_Substituicao | TextBox | Tensão da substituição |
| Txt_Observacao_Substituicao | TextBox | Observação da substituição |

### Tela_Substituicao_de_Display (Grupo DISPLAY)

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Ls_Substituicao_de_Display_Executada | Spinner | Serviço executado? |
| Txt_Numero_Display | TextBox | Número do display |
| Txt_Observacao_Display | TextBox | Observação |

### Tela_Inspecao_UC_Cortada (Grupo INSPEÇÃO UC CORTADA)

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Ls_Inspecao_UC_Cortada_Status | Spinner | Status inspeção |
| Txt_Observacao_Inspecao | TextBox | Observação |
| Tela_Numero_TOI | Arrangement | Número do TOI |
| Tela_Pq_Nao_Foi_Aplicado_TOI | Arrangement | Por que não foi aplicado TOI |
| Ls_TOI | Spinner | TOI aplicado? |

### Tela_Corte_Por_Falta_de_Pagamento (Grupo CORTE FALTA PAG.)

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Ls_Corte_ou_Religacao_Apos_Corte | Spinner | Corte ou religação? |
| Txt_Observacao_Corte_Pagamento | TextBox | Observação |

### Tela_Corte_de_UC_por_def_Tecnico (Grupo CORTE DEF TÉCNICO)

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Txt_Motivo_PRE_APR | TextBox | Motivo da PRE APR |
| Ls_Medicao_Avariada | Spinner | Medição avariada? |
| Txt_Problema_Medicao | TextBox | Qual o problema (condicional) |
| Ls_Necessario_Linha_Viva | Spinner | Necessário linha viva? |
| Txt_Porque_Linha_Viva | TextBox | Por que linha viva (condicional) |
| Txt_Chave_Corte | TextBox | Tombamento chave de corte |
| Txt_Chave_Cliente | TextBox | Tombamento chave cliente |
| Ls_Quantidade_Aterramento | Spinner | Quantidade aterramentos |
| Ls_Contato_Cliente | Spinner | Contato cliente? |
| Txt_Nome_Responsavel | TextBox | Nome (condicional) |
| Txt_Celular | TextBox | Celular (condicional) |
| Txt_Telefone_Fixo | TextBox | Telefone fixo (condicional) |
| Txt_Email_Contato | TextBox | Email (condicional) |
| Ls_Corte_ou_Religacao_Apos_Corte | Spinner | Corte ou religação? |

### Tela_Desligamento_Programado (Grupo DESLIGAMENTO)

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Txt_Data_Desligamento | TextBox | Data do desligamento |
| Txt_Hora_Desligamento | TextBox | Hora do desligamento |
| Txt_Hora_Previsao_Retorno | TextBox | Previsão de retorno |
| Txt_Observacao_Desligamento | TextBox | Observação |
| Timer_Desligamento_Programado | Timer | Timer para controle |

### Tela_Vistoria_ligacao (Grupo VISTORIA)

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Txt_Tombamento_Vistoria | TextBox | Tombamento da vistoria |
| Txt_COORD_X_Vistoria | TextBox | Coordenada X vistoria |
| Txt_COORD_Y_Vistoria | TextBox | Coordenada Y vistoria |
| Txt_Observacao_Vistoria | TextBox | Observação vistoria |

### Tela_PRE_APR (Grupo PRÉ-APR)

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Txt_Motivo_PRE_APR | TextBox | Motivo da Pré-APR |
| Ls_Medicao_Avariada | Spinner | Medição avariada? |
| Txt_Problema_Medicao | TextBox | Qual o problema (condicional) |
| Ls_Necessario_Linha_Viva | Spinner | Necessário linha viva? |
| Txt_Porque_Linha_Viva | TextBox | Por que linha viva (condicional) |
| Txt_Chave_Corte | TextBox | Tombamento chave de corte |
| Txt_Chave_Cliente | TextBox | Tombamento chave cliente |
| Ls_Quantidade_Aterramento | Spinner | Quantidade aterramentos |
| Ls_Contato_Cliente | Spinner | Contato cliente? |
| Txt_Nome_Responsavel | TextBox | Nome (condicional) |
| Txt_Celular | TextBox | Celular (condicional) |
| Txt_Telefone_Fixo | TextBox | Telefone fixo (condicional) |
| Txt_Email_Contato | TextBox | Email (condicional) |

### Tela_TOI_Inspeca_UC_Cortada (Sub-tela TOI)
(Sub-arrangement da Tela_Inspecao_UC_Cortada)

### Tela_Anexos (Passo Final - Fotos)
(Container para imagens anexadas)

### Tela_Finalizacao (Passo Final - Botão Enviar)
(Container para botão de envio)

---

## Componentes Compartilhados

### Across Telas
- Checkboxes `Cs_Informar_*` são **compartilhados** entre Tela_Equipamentos_Instalados, Tela_Equipamentos_Retirados, e Tela_Substituicao_de_Equipamentos
- Ls_Contato_Cliente e seus sub-campos (Nome, Celular, Fixo, Email) são **compartilhados** entre Tela_PRE_APR e Tela_Corte_de_UC_por_def_Tecnico
- Ls_Corte_ou_Religacao_Apos_Corte é **compartilhado** entre Tela_Corte_Por_Falta_de_Pagamento e Tela_Corte_de_UC_por_def_Tecnico

### Layout de Fotos
- **Btn_Camera**: abre câmera para tirar foto
- **Btn_Galeria**: abre galeria para selecionar fotos
- **JewelFilePicker1$MultipleFilesPicked**: Callback que recebe lista de arquivos

---

## Estrutura do Email

### Lista de Destinatários (9 emails)
1. nobrebeq10@hotmail.com
2. nogueiracordeiro107@gmail.com
3. maria_zildene2021@outlook.com
4. edvando.alves@grupoafro.com
5. retorno.grupoa@gmail.com
6. jose_nilton_bezerra@hotmail.com
7. amanda.barbosa@grupoafro.com
8. josefranca.100@hotmail.com
9. suporte@grupoafro.com

### Configuração SMTP
- **SenderName**: "RetornoGrupoA"
- **SenderPassword**: "193267214196154465"
- **Encryption**: NONE

### Assunto
```
"RETORNO DE ORDEM - <TIPO> - <ORDEM>"
```
Onde:
- `<TIPO>` = tipo de ordem selecionado
- `<ORDEM>` = número da ordem

### Corpo do Email
Construído por p$corpoEmail (Lit169 - lambda97):
1. Prefixo: "**SEGUE INFORMAÇÕES REFERENTE A ORDEM DE SERVIÇO**\n\n"
2. TIPO: valor selecionado
3. CLIENTE: valor selecionado
4. ORDEM: número da ordem
5. UC: número da UC
6. TECNICO(S): nomes dos técnicos
7. DATA/HORA: data e hora
8. Texto de retorno específico (montado pela função de verificação do tipo)
9. MUNICIPIO: município selecionado
10. APR: número APR (se preenchido)
11. PRE APR: número PRE APR (se preenchido)
12. NOTIFICADO: status (se preenchido)
13. OBSERVAÇÃO: observação geral (se preenchida)
14. Assinatura: "\n\n**GRUPO A - RETORNO**"

# Domain Model — mail-mvp

> Gerado pelo Detetive em 2026-06-15
> Nível de documentação: **Completo**
> Escala: 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Glossário

| Termo | Definição | Confiança |
|-------|-----------|-----------|
| **UC** | Unidade Consumidora — identificador numérico do cliente/ponto de consumo | 🟢 CONFIRMADO |
| **OS** | Ordem de Serviço — identificador alfanumérico da ordem de serviço | 🟢 CONFIRMADO |
| **Tipo de Ordem** | Categoria do serviço a ser executado (ex: "CORTE POR FALTA DE PAGAMENTO", "LIGACAO NOVA MEDIA TENSAO") — 41 tipos suportados | 🟢 CONFIRMADO |
| **Líder / Parceiro** | Técnicos de campo responsáveis pela execução da ordem de serviço. Selecionados de uma lista fixa de 12 técnicos | 🟢 CONFIRMADO |
| **Município** | Cidade onde o serviço é executado — 29 municípios do Ceará na lista | 🟢 CONFIRMADO |
| **Notificado** | Indicador SIM/NÃO se o cliente foi notificado sobre o serviço | 🟢 CONFIRMADO |
| **Placa** | Veículo utilizado no deslocamento — 12 placas pré-cadastradas | 🟢 CONFIRMADO |
| **Equipamento** | Item instalado ou retirado durante a ordem de serviço (Medidor, Display, Conjunto, TC, TP) | 🟢 CONFIRMADO |
| **Retorno** | Seção dinâmica do formulário que exibe campos específicos conforme o Tipo de Ordem selecionado | 🟢 CONFIRMADO |
| **Rascunho (Draft)** | Registro salvo no IndexedDB que ainda não foi enviado por email | 🟢 CONFIRMADO |
| **Enviado (Sent)** | Registro que foi submetido com sucesso via Netlify Function SMTP | 🟢 CONFIRMADO |
| **Anexo** | Arquivo (imagem preferencialmente) anexado à OS — máximo 12, 8MB cada | 🟢 CONFIRMADO |
| **Complemento** | Texto livre opcional anexado ao final do corpo do email | 🟢 CONFIRMADO |
| **TOI** | Termo de Ocorrência de Irregularidade — usado em inspeções de UC cortada | 🟢 CONFIRMADO |
| **MUNK / Guincho / Linha Viva** | Tipos de equipamentos especiais necessários para retirada de ramal em inspeções | 🟢 CONFIRMADO |
| **Tombamento** | Número de identificação do poste/concessionária para ligações novas | 🟢 CONFIRMADO |

---

## Regras de Domínio

### Regras de Validação

| # | Regra | Origem | Confiança |
|---|-------|--------|-----------|
| RD01 | UC deve conter apenas dígitos numéricos | `validation.js:59` | 🟢 CONFIRMADO |
| RD02 | Data da OS não pode ser futura | `validation.js:72-74` | 🟢 CONFIRMADO |
| RD03 | Hora de término deve ser diferente da hora de início (permite overnight implícito) | `validation.js:84-86` | 🟢 CONFIRMADO |
| RD04 | Equipamentos não podem ter números duplicados (normalização: numérico → sem zeros à esquerda) | `validation.js:124-127` | 🟢 CONFIRMADO |
| RD05 | Máximo de 12 anexos por formulário | `validation.js:174` | 🟢 CONFIRMADO |
| RD06 | Cada anexo no máximo 8 MB | `validation.js:178` | 🟢 CONFIRMADO |
| RD07 | Campos obrigatórios são validados no blur (perda de foco) | `validation.js:252-267` | 🟢 CONFIRMADO |
| RD08 | Erros são limpos no input/change (não persistem após correção) | `validation.js:263-266` | 🟢 CONFIRMADO |
| RD09 | Seção 5 (Revisão) é sempre válida — não possui campos editáveis | `validation.js:196` | 🟢 CONFIRMADO |

### Regras de Persistência

| # | Regra | Origem | Confiança |
|---|-------|--------|-----------|
| RP01 | Auto-save só persiste quando UC **e** OS estão preenchidos (`iniciaisValido`) | `persistence.js:41` | 🟢 CONFIRMADO |
| RP02 | Não salva estado se não houver dados mínimos (nenhum campo preenchido) | `persistence.js:44-45` | 🟢 CONFIRMADO |
| RP03 | Debounce de 1000ms no save automático durante digitação | `persistence.js:89` | 🟢 CONFIRMADO |
| RP04 | Anexos têm dirty tracking — só re-serializam se marcados como sujos | `persistence.js:28-35` | 🟢 CONFIRMADO |
| RP05 | UUID gerado via `crypto.randomUUID()` com fallback manual (timestamp + random) | `persistence.js:96-100` | 🟢 CONFIRMADO |
| RP06 | DeleteRecord é atômico: deleta registro + anexos na mesma transação IndexedDB | `db.js:88-107` | 🟢 CONFIRMADO |
| RP07 | Anexos são armazenados em store separado (desde v3). Registros v2 com anexos inline são migrados transparentemente no restore | `restore.js:27-47` | 🟢 CONFIRMADO |

### Regras de Composição de Email

| # | Regra | Origem | Confiança |
|---|-------|--------|-----------|
| RE01 | Assunto do email: `OS #{os} - UC {uc} - {tipoLabel}` | `send.js` | 🟢 CONFIRMADO |
| RE02 | Datas são invertidas de YYYY-MM-DD para DD-MM-YYYY no corpo do email | `email.js:25-26` | 🟢 CONFIRMADO |
| RE03 | Texto é normalizado: remove acentos (NFD), substitui ç→c, converte para MAIÚSCULAS | `email.js:10-18` | 🟢 CONFIRMADO |
| RE04 | Complemento de texto é anexado ao final do corpo se preenchido | `send.js` | 🟢 CONFIRMADO |
| RE05 | Campos de retorno ocultos (condicionais não atendidos) são excluídos do email | `retornos.js:131`, `email.js:43` | 🟢 CONFIRMADO |
| RE06 | Seção "RETORNO" sempre presente no email, mesmo sem tipo de ordem — fica vazia | `email.js:38-46` | 🟢 CONFIRMADO |
| RE07 | Seção "EQUIPAMENTOS" só aparece se houver equipamentos adicionados | `email.js:31-36` | 🟢 CONFIRMADO |

### Regras de Envio (Backend)

| # | Regra | Origem | Confiança |
|---|-------|--------|-----------|
| RB01 | Apenas método HTTP POST é aceito | `send.js:4` | 🟢 CONFIRMADO |
| RB02 | Subject e text do email são obrigatórios | `send.js:12-20` | 🟢 CONFIRMADO |
| RB03 | SMTP_FROM é validado por regex de email | `send.js:24` | 🟢 CONFIRMADO |
| RB04 | SMTP_TO é lista separada por vírgula, cada email validado individualmente — **não vem do formulário** | `send.js:32-44` | 🟢 CONFIRMADO |
| RB05 | TLS com `rejectUnauthorized: false` (certificados auto-assinados em produção) | `send.js:67` | 🟢 CONFIRMADO |
| RB06 | 6 variáveis de ambiente obrigatórias: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_TO | `send.js` | 🟢 CONFIRMADO |

### Regras de Duplicidade

| # | Regra | Origem | Confiança |
|---|-------|--------|-----------|
| RDUP01 | Se registro já foi enviado (status=sent), exibe modal de confirmação antes de reenviar | `duplicate.js:14-35` | 🟢 CONFIRMADO |
| RDUP02 | Modal exibe OS e data do envio anterior | `duplicate.js:20-24` | 🟢 CONFIRMADO |
| RDUP03 | Cancelar no modal → bloqueia o envio | `duplicate.js:27-30` | 🟢 CONFIRMADO |
| RDUP04 | Confirmar no modal → permite reenvio | `duplicate.js:32-35` | 🟢 CONFIRMADO |

### Regras de Interface

| # | Regra | Origem | Confiança |
|---|-------|--------|-----------|
| RI01 | Sidebar ordena registros por `updatedAt` decrescente | `sidebar.js` | 🟢 CONFIRMADO |
| RI02 | Filtro da sidebar é case-insensitive por UC, OS ou tipo de ordem | `sidebar.js:43-49` | 🟢 CONFIRMADO |
| RI03 | Toast de notificação desaparece após 3500ms | `ui.js:21` | 🟢 CONFIRMADO |
| RI04 | Geolocalização com timeout de 10s e baixa precisão (não bloqueia formulário) | `utils.js:60-62` | 🟢 CONFIRMADO |
| RI05 | Service Worker segue estratégia cache-first para assets estáticos | `sw.js` | 🟢 CONFIRMADO |
| RI06 | Ao atualizar SW, exibe modal de atualização → recarrega página | `sw-update.js` | 🟢 CONFIRMADO |

---

## Regras de Negócio Implícitas (Extraídas do Comportamento)

| # | Regra | Evidência | Confiança |
|---|-------|-----------|-----------|
| RNI01 | O sistema é **single-user** (não há login, autenticação ou multi-tenancy). Qualquer pessoa com acesso ao URL pode usar | Ausência total de auth em toda a codebase | 🟢 CONFIRMADO |
| RNI02 | O formulário é preenchido **em campo** por técnicos de manutenção elétrica — daí a captura de coordenadas e datas | Natureza dos campos (coordenadas, placa, hora) | 🟡 INFERIDO |
| RNI03 | Os técnicos têm uma lista fixa de 12 nomes — não há cadastro dinâmico de técnicos | `fields.js:1` | 🟢 CONFIRMADO |
| RNI04 | Veículos usados no deslocamento são pré-cadastrados (12 placas fixas) | `fields.js:11` | 🟢 CONFIRMADO |
| RNI05 | 29 municípios de atuação — todos no estado do Ceará | `fields.js:7` | 🟢 CONFIRMADO |
| RNI06 | O email gerado é **texto plano** (não HTML) — compatibilidade máxima com sistemas legados | `email.js`, `send.js` | 🟢 CONFIRMADO |
| RNI07 | Destinatários do email são **fixos** (definidos em variável de ambiente) — o técnico não escolhe para quem enviar | `send.js:32-33` | 🟢 CONFIRMADO |
| RNI08 | O sistema funciona **offline-first**: PWA com Service Worker + IndexedDB local | `sw.js`, `db.js` | 🟢 CONFIRMADO |
| RNI09 | Não há recurso de edição de registro enviado — apenas visualização e reenvio | `db.js:115` | 🟢 CONFIRMADO |
| RNI10 | A compressão de imagens é lossy (JPEG) — prioriza tamanho sobre qualidade | `compress.js` | 🟢 CONFIRMADO |
| RNI11 | A normalização de número de equipamento funde formatos numérico e string: "00123" → "123" | `validation.js:124` | 🟢 CONFIRMADO |
| RNI12 | O campo UC aceita apenas números mas é armazenado como string (type=text com inputMode=numeric) — preserva formatação futura | `validation.js:59`, `iniciais.js:36-38` | 🟡 INFERIDO |
| RNI13 | A seção de Retorno é **sempre** renderizada, mesmo sem tipo de ordem selecionado — mostra placeholder | `retornos.js:16-19` | 🟢 CONFIRMADO |
| RNI14 | Ao mudar o tipo de ordem, os dados de retorno anteriores são **descartados** (`state.retorno = {}`) | `retornos.js:160` | 🟢 CONFIRMADO |
| RNI15 | Campos condicionais quando ocultos têm seu valor **zerado** | `retornos.js:116-117` | 🟢 CONFIRMADO |

---

## Dicionário de Estado (Entidades)

### Record (IndexedDB)

```js
{
  uuid: string,          // Chave primária
  status: "draft"|"sent",// Estado do registro
  createdAt: string,     // ISO date
  updatedAt: string,     // ISO date
  iniciais: object,      // Dados da seção Início
  retorno: object,       // Dados da seção Retorno
  tipoOrdem: string,     // Tipo de ordem selecionado
  equipamentos: array,   // Lista de equipamentos
  lastTipoOrdem: string, // Último tipo (para detecção de mudança)
  composicao: object,    // { complementoCorpo: string }
  attachmentCount: number,// Só contagem (anexos em store separado)
  sentData: object|null  // { sentAt, response } quando enviado
}
```

### Attachment (IndexedDB, store separado)

```js
{
  id: string,    // "{uuid}_{index}"
  uuid: string,  // FK para records
  index: number, // Ordem do anexo
  name: string,  // Nome original
  type: string,  // MIME type
  data: string   // Base64
}
```

### Equipamento (em memória)

```js
{
  status: "Instalado"|"Retirado",
  categoria: "Medidor"|"Display"|"Conjunto"|"TC"|"TP",
  numero: string
}
```

---

## Resumo de Confiança

| Categoria | 🟢 Confirmed | 🟡 Inferred | 🔴 Gap |
|-----------|:---:|:---:|:---:|
| Regras de Validação | 9 | 0 | 0 |
| Regras de Persistência | 7 | 0 | 0 |
| Regras de Email | 6 | 1 | 0 |
| Regras de Backend | 6 | 0 | 0 |
| Regras de Duplicidade | 4 | 0 | 0 |
| Regras de Interface | 6 | 0 | 0 |
| Regras Implícitas | 13 | 2 | 0 |
| **Total** | **51** | **3** | **0** |

---

*Fim do documento de domínio.*

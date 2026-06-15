# Análise de Código — mail-mvp

> Gerado pelo Arqueólogo em 2026-06-15
> Nível de documentação: **Completo**
> Escala: 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## 1. Módulo `app` (app.js, dom.js, styles.js)

### Arquivos
- `scripts/app.js` — Entry point principal
- `scripts/dom.js` — Cache de elementos DOM
- `scripts/styles.js` — Constantes de classes CSS

### Fluxo de controle

**app.js** orquestra toda a aplicação:

1. **DOMContentLoaded** — Inicialização sequencial:
   - `cacheDOM()` — popula objeto `DOM` com referências a ~25 elementos
   - `initSidebarFilter()` — configura filtro da sidebar
   - `renderIniciais()` — renderiza seção 1 dinamicamente
   - `initEvents()` — vincula event listeners a todos os controles
   - `updateFileCount()` e `renderPreviews()` — estado inicial dos anexos
   - `captureCoordinates()` — tenta obter geolocalização
   - `updateLivePreview()` — preview inicial do email
   - `clearCurrentUUID()` — garante formulário limpo

2. **initEvents()** registra listeners para:
   - Botão Enviar → `sendEmail()`
   - Botão Novo Formulário → save + reset + coords + update classes
   - Botão +Equipamento → `addEquip()`
   - Select Tipo de Ordem → `handleTipoChange()`
   - Upload área/file → gerenciamento de anexos
   - Lightbox fechar
   - Hamburguer/sidebar → abrir/fechar
   - Input/change globais (event delegation) → `updateFilledClass()`, `debouncedSave()`, `updateLivePreview()`, `checkInitialPersistence()`
   - Pointerdown → blur do activeElement (para mobile)

### Estruturas de dados

**DOM** (objeto singleton, exportado):
```js
{
  hamburger, btnNovoForm,
  secInicio, secRetorno, secEquipamentos, secAnexos, secRevisao,
  errorMsg, toast,
  iniciaisCampos, tipoOrdem,
  retornoDesc, retornoPlaceholder, retornoCampos,
  equipList, btnAddEquip,
  fileInput, fileCount, previewGrid, fileUploadArea,
  previewCorpo, complementoCorpo,
  btnEnviar,
  sidebar, sidebarOverlay, sidebarClose, sidebarList, sidebarFilter,
  dupModal, dupModalTitle, dupModalBody, dupModalCancel, dupModalConfirm,
  lightbox, lightboxImg, lightboxClose,
  confirmModal, confirmModalText, confirmModalOk, confirmModalCancel
}
```

### Algoritmos
- **checkInitialPersistence()**: guarda que só ativa auto-save quando UC **e** OS estão preenchidos
- **updateFilledClass()**: adiciona/remove classe `.is-filled` nos inputs para estilização
- **Event delegation**: captura input/change globalmente com `document.addEventListener` em vez de listener por campo — evita memory leaks em campos dinâmicos

🟢 CONFIRMADO — Código lido integralmente

---

## 2. Módulo `form` (iniciais.js, retornos.js, fields.js, validation.js)

### Arquivos
- `scripts/iniciais.js` — Renderização e leitura da seção "Início"
- `scripts/retornos.js` — Renderização e leitura da seção "Retorno"
- `scripts/fields.js` — Definição de todos os campos (iniciais + retorno por tipo de ordem)
- `scripts/validation.js` — Validação das 5 seções do formulário

### Fluxo de controle — iniciais.js

**renderIniciais()**: Itera `iniciaisFields[]`, agrupa por `linha` (grid/flex), cria label + input + error span para cada campo. Suporta 6 tipos de input via `INPUT_CREATORS` (select, number, date, time, text, textarea) + tipo especial `coordinates`.

**getIniciaisData()**: Lê o DOM (por `document.getElementById(field.nome)`) e retorna objeto `{ [nome]: valor }`.

### Fluxo de controle — retornos.js

**renderRetorno()**: Ao selecionar Tipo de Ordem, busca `getRetornoFields(tipo)`, agrupa por linha, renderiza dinamicamente. Suporta campos condicionais (ocultos via `style.display = "none"`).

**handleTipoChange()**: Guarda `state.lastTipoOrdem`, limpa `state.retorno`, chama `renderRetorno()`, salva estado.

**updateConditionalFields()**: Para cada campo com `condicional`, verifica o valor do campo de referência no DOM e mostra/esconde o grupo. Aceita `condicional.valor` como string ou array. Suporta `condicional.negado` para inverter lógica.

**getRetornoData()**: Lê apenas campos visíveis (`display !== "none"`) — proteção contra envio de dados ocultos.

### Fluxo de controle — validation.js

**validateAll()**: Valida seções 1, 2, 3, 4 (seção 5 é sempre válida). Usa `SECTION_VALIDATORS` (Strategy Pattern). Rolagem suave até o primeiro erro.

**validateSection1()**: Verifica obrigatórios, UC só números, data não futura, hora_fim ≠ hora_inicio. POPULA `_validatedData[1]` com cache.

**validateSection2()**: Valida equipamentos: tipo + categoria + número obrigatórios, detecta números duplicados normalizados.

**validateSection3()**: Valida campos de retorno visíveis (pula `display: none`).

**validateSection4()**: Valida máximo 12 anexos e tamanho máximo 8 MB cada.

**addBlurValidation()**: Validação no blur para campos obrigatórios. Limpa erro no input/change.

### Campos de Início (fields.js)

| Linha | Campo         | Tipo        | Obrigatório | Opções                                          |
|-------|---------------|-------------|-------------|--------------------------------------------------|
| 0     | coordenadas   | coordinates | não         | —                                                |
| 1     | lider         | select      | sim         | 12 técnicos                                      |
| 2     | parceiro      | select      | sim         | 12 técnicos                                      |
| 3     | municipio     | select      | sim         | 29 municípios                                    |
| 4     | uc            | number      | sim         | —                                                |
| 4     | os            | text        | sim         | —                                                |
| 5     | notificado    | select      | sim         | SIM / NÃO                                        |
| 5     | placa         | select      | sim         | 12 placas de veículo                             |
| 6     | data          | date        | sim         | —                                                |
| 6     | hora_inicio   | time        | sim         | step=300 (5 min)                                 |
| 6     | hora_fim      | time        | sim         | —                                                |
| 7     | tipo-ordem    | select      | sim         | 41 tipos de ordem                                |

### Campos de Retorno

Definidos em `retornoFieldsByTipo`. Cada tipo de ordem tem seu próprio conjunto de campos. Destaques:

- **UC CORTADA (I15/I30/I90/I180)**: 7 campos + condicional TOI
- **Ligação Nova MT**: 10+ campos com 3 níveis de condicionais (retorno_ligacao → outros → sub-campos)
- **SUBST. MEDIDOR A PEDIDO**: 6 campos condicionais por tipo de serviço
- **VISTORIA DA UC**: 4 campos por resultado
- **GRANDES CLIENTES SELO ROMPIDO**: 3 campos em cascata
- **CORTE POR FALTA DE PAGAMENTO**: 1 campo (situação)
- **DESLIG.PROG.MANUTENÇÃO**: 2 campos com condicional negado

### Algoritmos de validação

- **Normalização de número de equipamento**: `isNaN(Number(val)) ? val.replace(/^0+/, '') : String(Number(val))` — detecta duplicatas entre formato numérico e string
- **Validação UC**: regex `/^\d+$/`
- **Validação data**: `new Date(data) > today` com `today.setHours(0,0,0,0)`
- **Validação hora**: `hora_fim === hora_inicio` → erro (permite overnight implícito)

🟢 CONFIRMADO — Código lido integralmente

---

## 3. Módulo `email` (email.js, send.js)

### Arquivos
- `scripts/email.js` — Composição do corpo do email + preview
- `scripts/send.js` — Envio via Netlify Function

### Fluxo de controle — email.js

**composeEmail(data)**: 
1. Itera `iniciaisFields` → monta corpo com label + valor normalizados
2. Se houver equipamentos → adiciona seção EQUIPAMENTOS
3. Se houver retorno → adiciona seção RETORNO com campos do tipo de ordem
4. Datas são invertidas de YYYY-MM-DD para DD-MM-YYYY

**normalizeText(str)**: Remove acentos (NFD), substitui ç→c, converte para MAIÚSCULAS.

**updateLivePreview()**: Lê dados atuais do DOM + state, renderiza preview no `DOM.previewCorpo`.

### Fluxo de controle — send.js

**sendEmail()**: 
1. `validateAll()` — se falhar, retorna false
2. `checkDuplicate()` — modal de confirmação se já enviado
3. Monta subject: `OS #{os} - UC {uc} - {tipoLabel}`
4. Monta text: corpo + complemento opcional
5. `compressAttachments()` — comprime imagens
6. `fetch("/api/send", POST)` — envia para Netlify Function
7. Se sucesso: toast verde + `updateRecordStatus()`
8. Se erro: toast vermelho com mensagem
9. Botão desabilitado durante envio

### Algoritmos

- **Assunto do email**: `OS #{os} - UC {uc} - {tipoLabel}` — formato padronizado
- **Complemento**: texto opcional anexado ao final do corpo, separado por `\n\n`
- **Dados ocultos**: `composeEmail()` dupla-checagem `field.nome in data.retorno` antes de incluir

🟢 CONFIRMADO — Código lido integralmente

---

## 4. Módulo `attachments` (attachments.js, compress.js)

### Arquivos
- `scripts/attachments.js` — Upload, preview, remoção de anexos
- `scripts/compress.js` — Compressão de imagens para envio

### Fluxo de controle — attachments.js

**handleFileChange(e)**: 
1. Converte FileList para Array
2. Limita a 12 arquivos (descarta excesso com warning)
3. Adiciona ao `state.attachments[]`
4. Marca dirty, renderiza previews, atualiza contador, salva

**renderPreviews()**: 
1. Revoga Object URLs antigas (memory leak prevention)
2. Cria grid de thumbnails com imagem, nome e botão remover
3. Click na imagem → lightbox

**removeFile(index)**: Remove do array, marca dirty, re-renderiza

### Fluxo de controle — compress.js

**compressAttachments(files)**: 
1. Arquivos ≤ SKIP_SIZE (670KB) ou não-imagem: apenas converte para base64
2. Imagens > SKIP_SIZE: algoritmo de compressão progressiva:
   - Canvas com qualidade JPEG 0.9
   - Até 10 tentativas reduzindo largura em 80% a cada iteração
   - Tentativa 11 (fallback): qualidade 0.7 sem redução adicional
3. Nome do arquivo: `{basename}_red.jpg`

### Algoritmo de compressão

```
MAX_SIZE = 650KB
SKIP_SIZE = 670KB
qualidade inicial = 0.9
largura inicial = naturalWidth

for tentativa = 0..10:
    if tentativa == 10: qualidade = 0.7 (fallback)
    blob = drawImage(canvas, img, largura, qualidade)
    if blob.size <= MAX_SIZE: break
    if not fallback: largura *= 0.8
```

🟢 CONFIRMADO — Código lido integralmente

---

## 5. Módulo `equipment` (equipment.js)

### Arquivo
- `scripts/equipment.js` — Gerenciamento de equipamentos

### Fluxo de controle

**addEquip(data?)**: Cria uma linha de equipamento com:
- Select **Tipo**: Instalado / Retirado
- Select **Categoria**: Medidor / Display / Conjunto / TC / TP
- Input **Número**: type="number"
- Botão **Remover**: ✕

Se `data` for passado (restore), preenche valores. Adiciona validação blur nos 3 campos. Coleta dados e salva após adicionar.

**collectEquipamentos()**: Itera `.equip-row` no DOM → atualiza `state.equipamentos[]`.

**renderEquipamentos()**: Restaura lista de equipamentos do state para o DOM.

**showEmptyEquip() / hideEmptyEquip()**: Gerencia mensagem "Nenhum equipamento adicionado."

### Estruturas

```js
state.equipamentos = [
  { status: "Instalado"|"Retirado", categoria: "Medidor"|"Display"|..., numero: "12345" }
]
```

🟢 CONFIRMADO — Código lido integralmente

---

## 6. Módulo `persistence` (persistence.js, restore.js, db.js, storage.js, state.js)

### Arquivos
- `scripts/persistence.js` — Save/restore do estado completo
- `scripts/restore.js` — Aplicação de registro ao formulário
- `scripts/db.js` — IndexedDB CRUD (v3)
- `scripts/storage.js` — localStorage UUID (quebra ciclo de import)
- `scripts/state.js` — Estado global reativo

### Arquitetura de persistência

```
state.js ─→ persistence.js ─→ db.js (IndexedDB)
  │               │
  │               └→ storage.js (localStorage — UUID)
  │
  └→ re-exporta: saveState, debouncedSave, markAttachmentsDirty, etc.
```

**Circular import quebrado por storage.js**:
- `state.js` importa `getRawUUID()` de `storage.js` (sem dependências)
- `state.js` re-exporta funções de `persistence.js`
- `persistence.js` importa `state` de `state.js`
- `storage.js` é o intermediário sem dependências circulares

### Fluxo de save

**saveState()**:
1. Guard: só salva se `state.iniciaisValido` (UC+OS preenchidos)
2. Guard: só salva se há dados mínimos
3. `_ensureUUID()` — gera UUID via `crypto.randomUUID()` com fallback
4. Monta objeto `data` com: uuid, status, createdAt, updatedAt, iniciais, retorno, tipoOrdem, equipamentos, composicao, attachmentCount
5. `saveDraft(data)` → IndexedDB store `records`
6. Se `attachmentsDirty`: serializa anexos para base64 → `saveAttachments()` → IndexedDB store `attachments`

**debouncedSave()**: Timer de 1000ms — evita saves excessivos durante digitação.

### Schema IndexedDB

**DB**: `mail-mvp` v3
**Store `records`**: keyPath = `uuid`
**Store `attachments`**: keyPath = `id` (composto `{uuid}_{index}`), index em `uuid`

### Migrações

- v1→v2: Remove store `sent_emails`
- v2→v3: Adiciona store `attachments`, separa anexos do record principal

### Fluxo de restore

**applyRecord(record)**: 
1. Seta UUID, validação, dados no state
2. Restaura anexos com migração transparente:
   - v2: inline em `record.attachments[]`
   - v3: busca em `getAttachmentsByUuid(uuid)`
3. Re-renderiza seções: Início → Retorno → Equipamentos → Anexos
4. Re-attach event listeners (renderIniciais recria elementos)

### Funções CRUD (db.js)

| Função | Operação | Transação |
|--------|----------|-----------|
| `saveDraft()` | put records | readwrite |
| `getRecord()` | get by uuid | readonly |
| `getAllRecords()` | getAll | readonly |
| `deleteRecord()` | delete record + attachments | atômica (2 stores) |
| `updateRecordStatus()` | get + put (sent) | readwrite |
| `saveAttachments()` | delete old + put new | readwrite |
| `getAttachmentsByUuid()` | index.getAll | readonly |
| `deleteAttachmentsByUuid()` | cursor.delete | readwrite |

### Algoritmos

- **UUID fallback**: `crypto.randomUUID()` → `Date.now().toString(36) + Math.random().toString(36).slice(2)` 🟡 INFERIDO (fallback seguro)
- **Dirty tracking**: `attachmentsDirty` flag — evita re-serializar anexos se não mudaram
- **DeleteRecord atômico**: Transação com 2 stores — ou deleta tudo ou nada
- **SaveAttachments**: Cursor deleta antigos, depois insere novos na mesma transação

🟢 CONFIRMADO — Código lido integralmente

---

## 7. Módulo `sidebar` (sidebar.js)

### Arquivo
- `scripts/sidebar.js` — Sidebar de histórico de registros

### Fluxo de controle

**renderSidebar(filterTerm?)**: 
1. Busca todos registros via `getAllRecords()`
2. Ordena por `updatedAt` decrescente
3. Filtra por termo (UC, OS, tipo de ordem) se fornecido
4. Renderiza cada registro como card com:
   - Título (resumo: `{UC}-{OS}-{tipo}`)
   - Status (Enviado/Rascunho) com classe CSS
   - Data formatada
   - Botões Editar + Excluir

**loadRecord(record)**: `applyRecord()` + fecha sidebar + scroll to top.

**getRecordSummary(record)**: Heurística de 5 níveis para exibir resumo legível.

### Algoritmos

- **Filtro**: case-insensitive com `includes()`
- **Ordenação**: `new Date(b.updatedAt) - new Date(a.updatedAt)`
- **Resumo**: prioridade: UC+OS+tipo → UC+OS → OS → UC → "(rascunho vazio)"

🟢 CONFIRMADO — Código lido integralmente

---

## 8. Módulo `duplicate` (duplicate.js)

### Arquivo
- `scripts/duplicate.js` — Prevenção de reenvio acidental

### Fluxo de controle

**checkDuplicate()**: Promise que:
1. Se não há UUID: resolve true (pode enviar)
2. Busca registro por UUID
3. Se registro não existe ou não está "sent": resolve true
4. Se já enviado: exibe modal de confirmação com data do envio
5. Cancelar → resolve false (bloqueia envio)
6. Confirmar → resolve true (reenvia)

🟢 CONFIRMADO — Código lido integralmente

---

## 9. Módulo `tools` (reset.js, ui.js, utils.js, sw-update.js)

### Arquivos
- `scripts/reset.js` — Reset completo do formulário
- `scripts/ui.js` — Utilitários de interface (toast, erro, modal confirmação)
- `scripts/utils.js` — Utilitários diversos (base64, coordenadas, data)
- `scripts/sw-update.js` — Gerenciamento de Service Worker

### Fluxo de controle — reset.js

**resetForm()**: 
1. Zera state (equipamentos, attachments, iniciais, retorno, etc.)
2. Marca attachmentsDirty
3. Re-renderiza Início + coordenadas
4. Re-attach tipoOrdem listener
5. Limpa todas as seções do DOM
6. Chama `clearCurrentUUID()`

### Fluxo de controle — ui.js

- **showError(msg)**: Exibe barra vermelha no topo
- **hideError()**: Oculta barra de erro
- **showToast(msg, success)**: Toast animado (3500ms)
- **setFieldError(el, msg)**: Mostra erro no span abaixo do campo
- **clearFieldError(el)**: Remove erro do span
- **showConfirm(msg)**: Promise. Exibe modal com OK/Cancelar

### Utilitários (utils.js)

- **toBase64(file)**: File → base64 (sem header data:)
- **blobToBase64(blob)**: Blob → base64
- **loadImage(file)**: File → Image (com Object URL e revogação)
- **formatDate(iso)**: ISO → "DD/MM/YYYY HH:mm"
- **base64ToBlob(base64, type)**: base64 → Blob
- **captureCoordinates()**: Geolocation → "lat, lon" ou "Não disponível"

### Constantes

```js
MAX_SIZE = 665600  // 650KB
SKIP_SIZE = 686080 // 670KB
```

### Service Worker Update

**initSW()**: Registra `/sw.js`, chama `registration.update()`, monitora `controllerchange` → exibe modal de atualização → reload.

🟢 CONFIRMADO — Código lido integralmente

---

## 10. Módulo `backend` (netlify/functions/send.js)

### Arquivo
- `netlify/functions/send.js` — Netlify Function de envio SMTP

### Fluxo de controle

1. Valida método HTTP (POST apenas)
2. Parse do body JSON
3. Valida subject e text obrigatórios
4. Valida SMTP_FROM (regex de email)
5. Valida SMTP_TO (lista separada por vírgula, cada um validado por regex)
6. Valida máximo 12 anexos
7. Valida tamanho máximo 8MB por anexo (via Buffer.from base64)
8. Configura transporte SMTP com nodemailer:
   - TLS com `rejectUnauthorized: false` (self-signed certs)
   - Porta 465 → secure: true, demais → false
9. Envia email
10. Retorna `{ success: true, to: [...] }` ou `{ error: "..." }`

### Variáveis de ambiente (6 obrigatórias)

| Var       | Propósito            |
|-----------|----------------------|
| SMTP_HOST | Servidor SMTP        |
| SMTP_PORT | Porta SMTP           |
| SMTP_USER | Usuário              |
| SMTP_PASS | Senha                |
| SMTP_FROM | Remetente            |
| SMTP_TO   | Destinatário(s)      |

### Segurança

- `rejectUnauthorized: false` — intencional (produção com certificados auto-assinados) 🟡 INFERIDO
- Destinatários vêm **apenas** de env var, não do formulário
- Validação de email com regex

🟢 CONFIRMADO — Código lido integralmente

---

## Resumo de Confiança

| Módulo       | Confiança | Observação                       |
|--------------|-----------|----------------------------------|
| app          | 🟢        | 100% lido                        |
| form         | 🟢        | 100% lido                        |
| email        | 🟢        | 100% lido                        |
| attachments  | 🟢        | 100% lido                        |
| equipment    | 🟢        | 100% lido                        |
| persistence  | 🟢        | 100% lido                        |
| sidebar      | 🟢        | 100% lido                        |
| duplicate    | 🟢        | 100% lido                        |
| tools        | 🟢        | 100% lido                        |
| backend      | 🟢        | 100% lido                        |

## Total de entidades identificadas

- **12+ estruturas de dados** (DOM, state, records, attachments, equipamentos, iniciais, retorno, etc.)
- **41 tipos de ordem** suportados
- **~334 testes** confirmados (AGENTS.md)
- **3 stores IndexedDB v3** (records, attachments)

---

*Fim da análise de código.*

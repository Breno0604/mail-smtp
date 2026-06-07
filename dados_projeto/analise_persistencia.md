# Análise de Persistência — mail-smtp

> Revisão geral cobrindo: estado do formulário durante preenchimento, persistência entre sessões (IndexedDB + sessionStorage) e envio/retorno do backend (Netlify Function).

---

## 1. Estado do Formulário Durante Preenchimento

### P1 — Listeners de `debouncedSave` não cobrem campos criados dinamicamente

**Arquivo:** `app.js` (linha `initEvents`)  
**Problema:** O loop que adiciona `change` e `input` em `input, select, textarea` roda uma única vez no `DOMContentLoaded`, antes de qualquer interação. Os campos da seção **Iniciais** são renderizados por `renderIniciais()` e os campos de **Retorno** por `renderRetorno()` — ambos criam elementos no DOM _após_ esse loop. Esses campos nunca recebem os listeners de auto-save.  
**Sintoma:** Alterações nos campos de Iniciais e Retorno não disparam o `debouncedSave` automaticamente (o save só acontece ao navegar de seção, via `saveState()` em `showSection`).  
**Sugestão:** Adicionar os listeners dentro de `renderIniciais()` e `renderRetorno()` logo após criar cada campo, ou usar delegação de eventos no container pai (`iniciaisCampos`, `retornoCampos`).

---

### P2 — `state.iniciais` só é populado ao avançar da seção 1

**Arquivo:** `validation.js` (`collectSectionData`)  
**Problema:** `state.iniciais` recebe os dados via `collectSectionData(1)`, que só é chamado em `nextSection()`. Se o usuário preenche a seção 1 e recarrega sem avançar, `state.iniciais` permanece `{}` no objeto de estado. O `saveState` salva corretamente via `getIniciaisData()` (lê direto do DOM), mas na restauração (`restoreSavedState`) os campos são re-populados a partir de `record.iniciais` — que estará com os dados corretos do IndexedDB. Porém, `state.iniciais` em memória continua `{}` após a restauração.  
**Sintoma:** Módulos que consultam `state.iniciais` (ex.: `composeEmail`) podem receber dados vazios caso o usuário não tenha avançado de seção ao menos uma vez.  
**Sugestão:** Após restaurar os campos no DOM em `restoreSavedState`, também popular `state.iniciais` com `getIniciaisData()`.

---

### P3 — Equipamentos não são coletados para o `state` antes do save automático

**Arquivo:** `equipment.js` / `validation.js`  
**Problema:** `state.equipamentos` só é atualizado via `collectSectionData(2)` (chamado em `nextSection`). O `saveState` serializa `state.equipamentos` — não relê o DOM. Se o usuário adiciona/remove equipamentos e o save automático dispara (via blur em campo de equipamento), ele salva o array desatualizado em memória.  
**Sintoma:** Ao recarregar, o número de equipamentos pode estar desatualizado se o usuário não avançou de seção.  
**Sugestão:** Em `equipment.js`, após cada `addEquip` / `removeFile` que já chama `saveState()`, garantir que `state.equipamentos` seja atualizado lendo o DOM antes do save (similar ao que `saveState` já faz para `iniciais` via `getIniciaisData`).

---

### P4 — Campo `retorno` (`descricao-retorno`) nunca é persistido

**Arquivo:** `state.js` (`saveState`) / `retornos.js`  
**Problema:** O objeto salvo no IndexedDB (`data`) não inclui o conteúdo do textarea de retorno (`descricao-retorno`). Não há nenhuma referência a `DOM.retornoCampos` ou ao campo `descricao-retorno` no `saveState`. Da mesma forma, `restoreSavedState` não restaura esse campo.  
**Sintoma:** Ao recarregar, o campo de descrição de retorno estará sempre vazio, mesmo que o usuário o tenha preenchido.  
**Sugestão:** Incluir o valor de `descricao-retorno` no objeto salvo (ex.: `retorno: { descricao: DOM.retornoCampos.querySelector('#descricao-retorno')?.value || '' }`) e restaurá-lo em `restoreSavedState`.

---

### P5 — Anexos (arquivos) não são persistidos entre sessões

**Arquivo:** `attachments.js` / `state.js`  
**Problema:** `state.attachments` armazena objetos `File` (API do browser), que não são serializáveis via IndexedDB da forma como o `saveDraft` os trata. O objeto `data` em `saveState` inclui `state.equipamentos` mas **não inclui `state.attachments`**. Mesmo que fossem incluídos, objetos `File` não sobrevivem a uma serialização JSON nem a uma reinicialização da aba.  
**Sintoma:** Após recarregar, todos os anexos são perdidos — o array `state.attachments` volta a `[]` e `renderPreviews()` não exibe nenhuma imagem.  
**Sugestão (curto prazo):** Avisar o usuário explicitamente (toast/mensagem) que os anexos precisam ser re-adicionados após recarregar.  
**Sugestão (longo prazo):** Converter cada `File` para `ArrayBuffer` ou base64 e persistir no IndexedDB (pode impactar performance com imagens grandes). Avaliar se o MVP necessita dessa persistência.

---

## 2. Persistência Entre Sessões (IndexedDB + sessionStorage)

### P6 — `sessionStorage` apaga o UUID ao fechar a aba; IndexedDB fica com o rascunho órfão

**Arquivo:** `state.js` / `app.js`  
**Problema:** O `currentUUID` é gravado em `sessionStorage`, que é limpo quando a aba é fechada (não apenas recarregada). Ao abrir o app em uma nova aba ou após fechar e reabrir o browser, o UUID some e o registro no IndexedDB fica inacessível pelo fluxo de "continuar de onde parou", tornando-se um rascunho órfão.  
**Sintoma:** Rascunhos acumulam indefinidamente no IndexedDB sem possibilidade de recuperação automática pelo usuário (apenas via sidebar).  
**Sugestão:** Usar `localStorage` para o UUID atual (persiste entre sessões). Ou, alternativamente, na ausência do UUID em `sessionStorage`, buscar no IndexedDB o rascunho mais recente com `status: "draft"` e oferecer continuar.

---

### P7 — Ausência de limpeza automática de rascunhos antigos

**Arquivo:** `db.js`  
**Problema:** Não existe nenhum mecanismo para deletar rascunhos antigos ou enviados. Com uso continuado, o IndexedDB acumula registros. O `AGENTS.md` cita "deleção automática de registros ≥ 90 dias" como escopo futuro, mas hoje não há nenhuma política.  
**Sintoma:** Crescimento ilimitado da base local; sidebar pode acumular entradas antigas sem relevância.  
**Sugestão:** Adicionar uma rotina simples no bootstrap (`DOMContentLoaded`) que busca todos os registros e deleta os com `updatedAt` anterior a N dias (ex.: 90 dias) ou com `status: "sent"` anterior a X dias.

---

### P8 — `state._createdAt` não é restaurado após recarregar

**Arquivo:** `state.js` (`saveState`)  
**Problema:** `state._createdAt` é um campo interno usado para não sobrescrever a data de criação do rascunho. Ele é populado na primeira chamada a `saveState`, mas não é restaurado em `restoreSavedState`. Após um reload, na primeira chamada a `saveState`, o código tenta buscar o `createdAt` do IndexedDB via `getRecord` — o que funciona, mas adiciona uma operação assíncrona desnecessária a cada save, pois `state._createdAt` estará sempre vazio até o primeiro salvamento pós-restore.  
**Sugestão:** Em `restoreSavedState`, após recuperar o `record`, atribuir `state._createdAt = record.createdAt`.

---

### P9 — Sem tratamento de erro de quota no IndexedDB

**Arquivo:** `state.js` / `db.js`  
**Problema:** O `saveDraft` usa `.catch((err) => console.error(...))` — erros silenciosos para o usuário. Em dispositivos com pouco espaço disponível (comum em celulares Android), o IndexedDB pode lançar `QuotaExceededError` e o rascunho simplesmente não é salvo sem nenhum aviso.  
**Sugestão:** No `.catch` de `saveDraft` em `saveState`, verificar se o erro é `QuotaExceededError` e exibir um `showToast` informando o usuário.

---

## 3. Envio e Retorno do Backend (Netlify Function)

### P10 — Sem retry em caso de falha de rede

**Arquivo:** `send.js`  
**Problema:** Se o `fetch('/api/send')` falhar por timeout ou instabilidade de conexão, o erro é capturado e exibe um toast — mas o estado da OS permanece como `draft` no IndexedDB. O usuário precisa clicar em "Enviar" novamente manualmente.  
**Sintoma:** Em conexões móveis instáveis, o envio pode falhar silenciosamente sem indicar ao usuário que pode tentar novamente.  
**Sugestão:** Implementar 1–2 tentativas automáticas com delay (ex.: 2s) antes de exibir o erro final. Manter o botão "Enviar" ativo com indicação de retry.

---

### P11 — `updateRecordStatus` não aguarda confirmação antes de liberar o botão

**Arquivo:** `send.js`  
**Problema:** O bloco `finally` do `sendEmail` reabilita o botão e restaura o texto **antes** que o `updateRecordStatus` (chamado com `.catch(() => {})`) termine de gravar no IndexedDB. Se o usuário clicar em "Enviar" novamente rapidamente, `checkDuplicate` pode não encontrar o status `"sent"` ainda.  
**Sugestão:** Aguardar o `updateRecordStatus` antes de liberar o botão, ou mover a atualização de status para antes do `finally`.

---

### P12 — Validação do `text` ausente no backend

**Arquivo:** `netlify/functions/send.js`  
**Problema:** O backend valida `subject` como obrigatório, mas `text` pode chegar vazio ou `undefined` sem erro. O frontend envia `text: text || ""` — o que protege no cliente — mas o backend não valida essa condição.  
**Sugestão:** Adicionar validação de `text` no backend (ao menos verificar se é string).

---

### P13 — `SMTP_FROM` não é validado no backend

**Arquivo:** `netlify/functions/send.js`  
**Problema:** `SMTP_TO` passa por validação de formato de e-mail, mas `SMTP_FROM` é usado diretamente em `mailOptions.from` sem nenhuma verificação. Um valor inválido ou ausente pode causar erro no nodemailer com mensagem genérica difícil de diagnosticar.  
**Sugestão:** Adicionar validação de `SMTP_FROM` com o mesmo regex usado para `SMTP_TO`.

---

## Resumo por Severidade

| # | Problema | Severidade | Área |
|---|----------|-----------|------|
| P4 | Campo de retorno nunca persistido | 🔴 Alta | Estado |
| P5 | Anexos perdidos ao recarregar | 🔴 Alta | Estado |
| P1 | Listeners não cobrem campos dinâmicos | 🟠 Média | Estado |
| P6 | UUID some ao fechar aba (rascunho órfão) | 🟠 Média | IndexedDB |
| P2 | `state.iniciais` vazio após restore | 🟡 Baixa | Estado |
| P3 | `state.equipamentos` desatualizado no save | 🟡 Baixa | Estado |
| P8 | `_createdAt` não restaurado | 🟡 Baixa | IndexedDB |
| P9 | Sem tratamento de QuotaExceededError | 🟡 Baixa | IndexedDB |
| P10 | Sem retry em falha de rede | 🟡 Baixa | Backend |
| P11 | `updateRecordStatus` não aguardado | 🟡 Baixa | Backend |
| P7 | Sem limpeza de rascunhos antigos | 🔵 Info | IndexedDB |
| P12 | `text` não validado no backend | 🔵 Info | Backend |
| P13 | `SMTP_FROM` não validado | 🔵 Info | Backend |

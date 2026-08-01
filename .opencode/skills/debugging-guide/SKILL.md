---
name: debugging-guide
description: Use quando o usuário reportar bug, comportamento inesperado, regressão, ou teste falhando. Sintomas: 'algo não está funcionando', 'quebra ao fazer X', 'antes funcionava e agora não', 'algum teste quebrou'.
---

# Guia de Debugging

## Quando usar

Use esta skill quando:

- O usuário reportar um bug, comportamento inesperado ou regressão
- Um teste está falhando e precisa de investigação
- "Algo não está funcionando", "quebra ao fazer X", "antes funcionava e agora não"
- A tarefa é de diagnóstico, não de implementação

## O processo em 4 fases

| Fase            | Objetivo                          | Pergunta-chave                   |
| --------------- | --------------------------------- | -------------------------------- |
| 1. Isolar       | Reduzir o escopo do problema      | Em qual camada o bug está?       |
| 2. Reproduzir   | Criar teste que falha             | Consigo fazer acontecer de novo? |
| 3. Diagnosticar | Encontrar a causa raiz            | Por que isso acontece?           |
| 4. Corrigir     | Resolver sem introduzir regressão | A correção é segura?             |

Cada fase é detalhada abaixo. Seguir a ordem — pular fases leva a correções superficiais.

---

## Fase 1: Isolar — em qual camada o bug está?

O projeto tem 5 camadas (ver `feature-development-guide`). Identificar a camada antes de abrir qualquer arquivo evita debugging cego.

### Tabela de sintomas → camada

| Sintoma                               | Camada provável         | Arquivos a verificar                                           |
| ------------------------------------- | ----------------------- | -------------------------------------------------------------- |
| Elemento não aparece na tela          | Feature Module          | `iniciais.js`, `retornos.js`, `equipment.js`, `attachments.js` |
| Campo condicional não mostra/esconde  | Feature Module          | `retornos.js` (`updateConditionalFields`)                      |
| Dado some após recarregar             | Persistence / IndexedDB | `persistence.js`, `db.js`, `state.js`                          |
| Erro de validação onde não deveria    | Cross-Cutting           | `validation.js`, `collectors.js`                               |
| Email com formatação ou dados errados | Cross-Cutting           | `email.js`, `retorno-templates.js`                             |
| Erro ao enviar email                  | Orchestration / Backend | `send.js`, `send.cjs`                                          |
| Dados antigos aparecendo (cache)      | Service Worker          | `sw.js`, DevTools Application                                  |
| Registro não aparece no sidebar       | Sidebar / IndexedDB     | `sidebar.js`, `db.js`                                          |
| Botão não responde ao clique          | Event System            | `app.js` (`initEvents`), `dom.js`                              |
| Erro no console (exceção JS)          | Stack trace             | Seguir o stack trace até a origem                              |

### Perguntas para estreitar o escopo

1. O bug acontece **sempre** ou **intermitentemente**?
   - Sempre → lógica quebrada, estado inválido
   - Intermitente → race condition, cache, timing

2. Acontece com **qualquer Tipo de Ordem** ou só um específico?
   - Só um → dados em `fields-data.js` ou `retorno-templates.js`
   - Qualquer → lógica compartilhada em `retornos.js`, `email.js`, `validation.js`

3. Acontece em **dev local** (`npx netlify dev`) ou só em produção?
   - Só produção → Netlify (backend, deploy, variáveis de ambiente) ou SW cache
   - Ambos → bug no código frontend

4. O **console do DevTools** mostra algum erro?
   - Sim → seguir o stack trace
   - Não → bug silencioso (estado inconsistente, validação silenciosa)

---

## Fase 2: Reproduzir — criar um teste que falha

Antes de mexer no código, criar um teste que reproduza o bug. Um teste que falha:

- Confirma que você entendeu o bug
- Garante que a correção funciona (teste passa depois do fix)
- Previne regressão futura (teste fica na suite)

### Padrão de teste para reproduzir bug

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { DOM } from '../scripts/dom.js';
import { state } from '../scripts/state.js';
import { cacheDOM } from '../scripts/dom.js';
import { handleTipoChange } from '../scripts/retornos.js';
import { createTestDOM } from './helpers/dom-fixture.js';

describe('BUG: descrição do comportamento esperado', () => {
  beforeEach(() => {
    document.body.innerHTML = createTestDOM();
    cacheDOM();
    Object.keys(state).forEach(k => delete state[k]); // reset state
  });

  it('deve fazer X quando Y acontece', () => {
    // 1. Arrange: recriar o estado que causa o bug
    DOM.tipoOrdem.value = 'CORTE POR FALTA DE PAGAMENTO';
    handleTipoChange();

    // 2. Act: executar a ação que dispara o bug
    const situacaoEl = document.getElementById('situacao_corte');
    situacaoEl.value = 'CORTADO';
    situacaoEl.dispatchEvent(new Event('change', { bubbles: true }));

    // 3. Assert: verificar o comportamento CORRETO (não o quebrado)
    // Se o campo condicional deveria estar visível:
    const condGroup = document.getElementById('campo_condicional').closest('.form-group');
    expect(condGroup.style.display).not.toBe('none');
  });
});
```

### Onde colocar o teste

| Tipo de bug                         | Arquivo de teste                                                |
| ----------------------------------- | --------------------------------------------------------------- |
| Renderização de campo / condicional | `tests/retornos.test.js`                                        |
| Validação (erro ou falta de erro)   | `tests/validation.test.js`                                      |
| Persistência / save / restore       | `tests/persistence.test.js` ou `tests/persistence-flow.test.js` |
| Fluxo completo (múltiplas seções)   | `tests/integration.test.js`                                     |
| Template / corpo do email           | `tests/email.test.js`                                           |
| Sidebar (lista, filtro, ações)      | `tests/sidebar.test.js`                                         |
| Envio (subject, payload, erros)     | `tests/send.test.js`                                            |
| IndexedDB (CRUD, migrações)         | `tests/db.test.js`                                              |
| Definição de campos                 | `tests/fields.test.js`                                          |

### Rodar só o teste novo

```powershell
npx vitest run tests/retornos.test.js -t "BUG"
```

### Se não conseguir reproduzir em teste

Alguns bugs dependem de timing, cache do SW, ou estado real do IndexedDB. Nesses casos:

1. Testar manualmente com `npx netlify dev`
2. Adicionar `console.log('[DEBUG]', variavelRelevante)` no ponto suspeito
3. Inspecionar o state real adicionando temporariamente `window.__state = state` em `scripts/state.js`
4. Verificar IndexedDB em DevTools > Application > IndexedDB > mail-mvp

---

## Fase 3: Diagnosticar — encontrar a causa raiz

Com o teste falhando, investigar o fluxo de dados até a origem.

### Abordagem: seguir o fluxo de dados

```
Evento (clique, change) → Handler → State → Persistência → Renderização
```

**Exemplo para campo condicional que não aparece:**

| Passo | Verificar                                  | Arquivo                                                                                   |
| ----- | ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| 1     | O evento `change` está disparando?         | `initEvents()` — busca por `document.addEventListener('input', handleFieldChange)`        |
| 2     | O handler está sendo chamado?              | `updateConditionalFields()` — busca por `function updateConditionalFields(`               |
| 3     | O `campoRef` do condicional está correto?  | `fields-data.js` — `condicional.campoRef`                                                 |
| 4     | O valor do campo de controle é o esperado? | `state.retorno[condicional.campoRef]`                                                     |
| 5     | A condição está batendo?                   | `updateConditionalFields()` — busca por `const match = valores.includes(controlEl.value)` |
| 6     | O display do grupo está sendo alterado?    | `updateConditionalFields()` — busca por `group.style.display = 'none'`                    |

### Técnicas de diagnóstico por camada

**State (`scripts/state.js`):**

- Adicionar `window.__state = state` e inspecionar no console do DevTools
- Verificar se `state.iniciaisValido` está `true` (se não, `saveState()` não persiste)
- Verificar se `state.currentUUID` não está vazio após o primeiro save

**DOM (`scripts/dom.js`):**

- Verificar se o elemento está no cache: `console.log(DOM.nomeDoElemento)`
- Se for campo dinâmico, usar `document.getElementById('nome_do_campo')`

**Persistence (`scripts/persistence.js`):**

- Logs já existem: `console.error('getRecord in saveState:', ...)` e `console.error('saveRecordAtomic error:', ...)`
- Verificar DevTools > Application > IndexedDB > records — o registro foi salvo?
- Verificar `state.iniciaisValido` — se `false`, `saveState()` retorna sem salvar

**Email (`scripts/email.js`):**

- Verificar se o template existe: `retornoTemplates[tipo]` não é `undefined`
- Verificar se a variante bateu: `applyRetornoTemplate()` retorna `null`?
- O placeholder `{campo}` existe em `data.retorno`?

**Netlify Function (`netlify/functions/send.cjs`):**

- Logs no terminal: `npx netlify dev` mostra `[send] Function invoked` e `[send] SMTP error`
- Health check: `curl http://localhost:8888/api/send` — retorna `{"status":"ok"}`
- Logs em produção: Netlify Dashboard > Functions > send > Logs

**Service Worker (`sw.js`):**

- DevTools > Application > Service Workers > "Bypass for network"
- Verificar `CACHE_NAME` — busca por `const CACHE_NAME = 'retorno-` no `sw.js`
- Verificar `STATIC_ASSETS` — busca por `const STATIC_ASSETS = [` no `sw.js` — o arquivo que você editou está listado?

---

## Fase 4: Corrigir — resolver com segurança

### Regras antes de corrigir

1. **Fazer a correção mínima** — resolver só o bug, sem refatorar código não relacionado
2. **Seguir os padrões existentes** — usar `markError()`/`clearError()` para validação, `debouncedSave()` para persistência, `DOM.` para referências
3. **Verificar código similar** — se o bug está em `validateSection1()`, verificar `validateSection3()` para o mesmo padrão
4. **Rodar a suite completa** — `npm test`, não só o teste do bug
5. **Verificar no navegador** — `npx netlify dev` e testar manualmente

### Checklist de verificação pós-correção

- [ ] O teste que reproduzia o bug agora passa
- [ ] Nenhum outro teste quebrou (`npm test`)
- [ ] Testar manualmente no navegador com `npx netlify dev`
- [ ] Verificar preview de email se a mudança afeta `email.js` ou `retorno-templates.js`
- [ ] Verificar sidebar se a mudança afeta persistência
- [ ] Se criou novo arquivo JS, adicionar ao `STATIC_ASSETS` no `sw.js`
- [ ] Husky bumpa `CACHE_NAME` automaticamente no commit

---

## Padrões comuns de bugs (por categoria)

### 1. Campo condicional não aparece ou não esconde

**Causa mais comum:** `campoRef` no condicional não bate com o `nome` do campo de controle.
**Verificar:** `scripts/data/fields-data.js` — `condicional.campoRef` === `nome` do campo pai? Está no mesmo array?
**Outra causa:** campo filho está antes do campo pai no array. O pai deve vir primeiro.

### 2. Dado some após recarregar a página

**Causa mais comum:** `state.iniciaisValido` está `false` — UC ou OS não preenchidos.
**Verificar:** `saveState()` — busca por `if (!state.iniciaisValido) return;` em `persistence.js`.
**Outra causa:** `state.currentUUID` vazio — verificar `localStorage` no DevTools.

### 3. Teste de integridade cruzada falha (fields.test.js)

**Causa:** tipo adicionado ao `tipoOrdemOptions` mas não registrado em `retornoFieldsByTipo` ou `retornoTemplates`.
**Verificar:** `tests/fields.test.js` — busca por `describe('Integridade cruzada` — o teste itera `tipoOrdemOptions` e verifica cada entrada.

### 4. "Sem internet" quando deveria ser "Erro no servidor"

**Causa:** `navigator.onLine` retornando `false` mesmo com rede disponível.
**Verificar:** `sendEmail()` em `send.js` — busca por `if (!navigator.onLine)` (dentro do catch do fetch).
**Outra causa:** fetch falhou por CORS, timeout, ou resposta não-JSON. Verificar console e Network tab.

### 5. SW servindo cache antigo após deploy

**Causa:** `CACHE_NAME` não foi bumpado. `STATIC_ASSETS` não inclui o arquivo novo.
**Verificar:** `sw.js` — busca por `const CACHE_NAME = 'retorno-` e `const STATIC_ASSETS = [` — o arquivo está listado?
**Solução rápida:** DevTools > Application > Service Workers > Unregister + Clear storage.

### 6. Erro de validação em campo que deveria estar oculto

**Causa:** campo com `display: none` não está sendo pulado pela validação.
**Verificar:** `validateSection3()` — busca por `if (group.style.display === 'none') return;` em `validation.js`.
**Outra causa:** campo foi coletado por `collectRetorno()` mesmo oculto. Verificar `collectRetorno()` em `collectors.js` — busca por `group.style.display === 'none'`.

### 7. IndexedDB: "QuotaExceededError" ou transação travada

**Causa:** armazenamento cheio ou transação concorrente.
**Verificar:** DevTools > Application > IndexedDB > mail-mvp — quantos registros? Tamanho dos attachments?
**Solução:** `cleanupOldSentRecords()` remove registros > 90 dias. Executar manualmente ou esperar o startup.

### 8. Erro 502 no Netlify (backend)

**Causa:** timeout do SMTP, variável de ambiente faltando, ou crash na function.
**Verificar:** `netlify/functions/send.cjs` — as 6 variáveis de ambiente estão configuradas no Netlify?
**Logs:** Netlify Dashboard > Functions > send > Logs — procurar `[send] SMTP error`.

---

## Toolbox: comandos e ferramentas

### Testes

```powershell
npm test                                    # todos os testes
npx vitest run tests/arquivo.test.js        # um arquivo
npx vitest run tests/arquivo.test.js -t "BUG"  # filtrar por nome
npx vitest run --reporter verbose           # output detalhado
```

### Dev local

```powershell
npx netlify dev                             # servidor + function emulator
```

### Browser DevTools — abas relevantes

| Aba                                            | O que inspecionar                                |
| ---------------------------------------------- | ------------------------------------------------ |
| **Console**                                    | Erros JS, logs com prefixo `[send]`, `[SW]`      |
| **Sources**                                    | Breakpoints nos scripts em `scripts/`            |
| **Network**                                    | Requisições para `/api/send`, status HTTP        |
| **Application > IndexedDB > mail-mvp**         | `records` e `attachments` stores                 |
| **Application > localStorage**                 | Chave `currentUUID`                              |
| **Application > Cache Storage > retorno-v{N}** | Arquivos cacheados pelo SW                       |
| **Application > Service Workers**              | Status do SW, "Bypass for network", "Unregister" |

### Acesso rápido ao state

Adicionar temporariamente em `scripts/state.js` após `export const state`:

```js
window.__state = state;
```

Depois no console do DevTools: `__state.iniciais`, `__state.retorno`, etc.

### Logs existentes no código

| Prefixo                    | Arquivo                 | Significado                 |
| -------------------------- | ----------------------- | --------------------------- |
| `[send]`                   | `send.js`, `send.cjs`   | Fluxo de envio de email     |
| `[SW]`                     | `sw-update.js`, `sw.js` | Service Worker              |
| `saveRecordAtomic error`   | `persistence.js`        | Falha ao salvar             |
| `getRecord in saveState`   | `persistence.js`        | Falha ao recuperar registro |
| `Erro ao carregar/excluir` | `sidebar.js`            | Falha no sidebar            |

---

## Situações a evitar

- ❌ Corrigir sem reproduzir — você não sabe se realmente resolveu
- ❌ Corrigir o sintoma em vez da causa — "esconder o erro" em vez de consertar a lógica
- ❌ Fazer refatoração junto com o fix — um commit = um propósito
- ❌ Rodar só o teste do bug e pular `npm test` — pode ter regressão
- ❌ Esquecer de adicionar novo script ao `STATIC_ASSETS` no `sw.js` — bug volta em produção
- ❌ Usar `saveState()` direto em event handler em vez de `debouncedSave()` — performance
- ❌ Criar dependência circular entre módulos — extrair para módulo separado
- ❌ Bump `DB_VERSION` sem migração no `onupgradeneeded` — browsers com versão antiga quebram

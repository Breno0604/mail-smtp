# Plano de Correções — Seção Revisão

Gerado em: 16/06/2026
Baseado na análise dos agentes explore, detetive e revisor.

## Resumo das Descobertas

| # | Tarefa | Prioridade | Esforço | Risco | Intencional? |
|---|--------|-----------|---------|-------|-------------|
| 1 | Unificar fonte de verdade no sendEmail | 🔴 Alta | 10 min | Baixo | Não — oversight na refatoração `81ca7b4` |
| 2 | Proteger normalizeText contra tipos não-string | 🔴 Alta | 5 min | Baixo | Não — proteção defensiva incompleta |
| 3 | Eliminar duplicação handlers input/change | 🟠 Média | 20 min | Médio | Não — copy-paste |
| 4 | Remover código morto retornoFields | 🟢 Baixa | 5 min | Mínimo | Não — resquício de refatoração |
| 5 | Remover complementoCorpo duplicado | 🟢 Baixa | 10 min | Mínimo | Parcial — atalho não usado |

Descartados:
- **Eventos retornos.js + app.js redundantes**: Inofensivo (debounce), manter como está
- **Complemento perdido se UC/OS vazios**: Não é bug — `checkInitialPersistence()` captura
- **Retorno não persistido se UC/OS vazios**: Não é bug — `collectRetorno()` roda em `saveState()`

---

## Tarefa 1: 🔴 Unificar fonte de verdade no sendEmail

**Arquivo:** `scripts/send.js:24`

**Problema:** `baseBody` lê de `DOM.previewCorpo.textContent` (DOM) enquanto `compCorpo` lê de `state.composicao` (state). Duas fontes de verdade. Se o preview desatualizar em relação ao state, o email enviado pode divergir do que o usuário viu.

**Evidência:** Commit `81ca7b4` refatorou `compCorpo` de DOM→state mas esqueceu `baseBody`. A mensagem do commit diz: "make state single source of truth for data consumers".

**O que fazer:**

1. Importar `composeEmail` de `./email.js` e `collectAllData` de `./collectors.js`
2. Substituir o bloco:
   ```js
   const baseBody = DOM.previewCorpo.textContent;
   const compCorpo = (state.composicao?.complementoCorpo || '').trim();
   const text = compCorpo ? `${baseBody}\n\n${compCorpo}` : baseBody;
   ```
   Por:
   ```js
   const data = collectAllData();
   const baseBody = composeEmail(data);
   const compCorpo = data.composicao?.complementoCorpo?.trim() || '';
   const text = compCorpo ? `${baseBody}\n\n${compCorpo}` : baseBody;
   ```
3. Ajustar `tests/send.test.js` se necessário (o mock de `DOM.previewCorpo.textContent` não será mais usado).

---

## Tarefa 2: 🔴 Proteger normalizeText contra tipos não-string

**Arquivo:** `scripts/email.js:8-9`

**Problema:** `if (!str) return str` não protege contra objetos — `!{}` é `false`, então `{}.normalize("NFD")` lança `TypeError`.

**O que fazer:**

1. Substituir:
   ```js
   function normalizeText(str) {
     if (!str) return str;
   ```
   Por:
   ```js
   function normalizeText(str) {
     if (typeof str !== 'string' || !str) return str;
   ```
2. (Opcional) Exportar a função para permitir teste unitário direto.

---

## Tarefa 3: 🟠 Eliminar duplicação dos handlers input/change

**Arquivo:** `scripts/app.js:83-123`

**Problema:** Dois handlers de evento (input e change) com exatamente o mesmo código (~20 linhas cada). Copy-paste.

**O que fazer:**

1. Extrair para função única:
   ```js
   function handleFieldChange(e) {
     if (!["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
     updateFilledClass(e.target);
     syncIniciaisField(e.target);
     if (e.target.closest('.equip-row')) collectEquipamentos();
     if (e.target.id === "complemento-corpo") state.composicao.complementoCorpo = e.target.value;
     debouncedSave();
     updateLivePreview();
     if (e.target.id === "uc" || e.target.id === "os") checkInitialPersistence();
   }
   document.addEventListener("input", handleFieldChange);
   document.addEventListener("change", handleFieldChange);
   ```
2. Remover os dois handlers antigos (linhas 83-123).
3. (Opcional) Em `retornos.js`, avaliar remoção do `debouncedSave()` dos handlers individuais (linhas 57, 61) — o document handler já chama. **Manter** a atualização de `state.retorno[field.nome]` para responsividade.

**Riscos:** 
- Testes que dependem de eventos específicos (input vs change) precisam ser verificados
- Retornos.js tem handlers próprios que disparam `debouncedSave()` extra — inofensivo, mas vale auditar

---

## Tarefa 4: 🟢 Remover código morto retornoFields

**Arquivos:** `scripts/fields.js:124-126`, `tests/fields.test.js`

**Problema:** `export const retornoFields` é um array de 1 entrada que não é usado em produção. Foi criado antes de `retornoFieldsByTipo` e nunca removido.

**O que fazer:**

1. Remover de `scripts/fields.js`:
   ```js
   export const retornoFields = [
     { label: "Descrição", id: "descricao-retorno", type: "textarea", required: true },
   ];
   ```
2. Remover `retornoFields` do import em `tests/fields.test.js` (linha 2)
3. Remover o bloco `describe('retornoFields', ...)` de `tests/fields.test.js` (linhas 110-122)

---

## Tarefa 5: 🟢 Remover complementoCorpo duplicado de collectAllData

**Arquivos:** `scripts/collectors.js:76`, `tests/collectors.test.js`

**Problema:** `collectAllData()` retorna `complementoCorpo` duas vezes: dentro de `composicao` (objeto) e como chave avulsa na raiz. Nenhum consumidor usa a chave avulsa.

**O que fazer:**

1. Remover de `scripts/collectors.js` (linha 76):
   ```js
   complementoCorpo: state.composicao?.complementoCorpo || '',
   ```
2. Ajustar `tests/collectors.test.js`:
   - Remover ou atualizar o teste que verifica `result.complementoCorpo` (linha 114)
   - Substituir por verificação em `result.composicao.complementoCorpo`

---

## Verificação

Após todas as tarefas: rodar `npm test` e confirmar que todos os 394+ testes passam.

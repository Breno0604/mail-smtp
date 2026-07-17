# Issues — `restore.js`

Análise pontual do arquivo `restore.js`, sem conhecimento do restante do projeto. Assunções feitas em cada item estão marcadas como tal.

---

## ISSUE-01 — Aliasing de objetos ao invés de cópia (bug potencial de mutação)

**Local:**

```js
state.iniciais = record.iniciais || {};
state.retorno = record.retorno || {};
```

**Problema:**
`state.iniciais` e `state.retorno` recebem a **mesma referência** do objeto vindo de `record`, não uma cópia. Se `record` for reutilizado depois (ex: vindo de um cache, de uma lista em memória, ou reaproveitado em outra chamada), qualquer mutação futura em `state.iniciais`/`state.retorno` vai alterar `record` também — e vice-versa.

**Risco:** corrupção silenciosa de dados entre o registro original e o estado do formulário. Difícil de reproduzir e depurar, pois não gera erro.

**Sugestão:** usar `structuredClone(record.iniciais || {})` e `structuredClone(record.retorno || {})`, ou um deep clone equivalente compatível com o ambiente.

---

## ISSUE-02 — Duplicação de lógica de conversão base64 → File

**Local:**

```js
if (record.attachments && Array.isArray(record.attachments) && record.attachments.length > 0) {
  state.attachments = record.attachments.map(att => {
    const blob = base64ToBlob(att.data, att.type);
    return new File([blob], att.name, { type: att.type });
  });
} else if (record.attachmentCount > 0 || record.attachments === undefined) {
  try {
    const storedAttachments = await getAttachmentsByUuid(record.uuid);
    state.attachments = storedAttachments.map(att => {
      const blob = base64ToBlob(att.data, att.type);
      return new File([blob], att.name, { type: att.type });
    });
  } catch (err) { ... }
}
```

**Problema:** o mapeamento `base64ToBlob` → `new File(...)` é idêntico nos dois branches (v2 inline vs v3 store separado).

**Sugestão:** extrair para uma função utilitária, ex.:

```js
function filesFromAttachments(list) {
  return list.map(att => {
    const blob = base64ToBlob(att.data, att.type);
    return new File([blob], att.name, { type: att.type });
  });
}
```

---

## ISSUE-03 — Condição de fallback pode zerar anexos válidos

**Local:**

```js
if (record.attachments && Array.isArray(record.attachments) && record.attachments.length > 0) {
  // v2
} else if (record.attachmentCount > 0 || record.attachments === undefined) {
  // v3
} else {
  state.attachments = [];
}
```

**Problema:** o caso `record.attachments === []` (array vazio, não `undefined`) **e** `record.attachmentCount` ausente ou `0` cai direto no `else`, zerando `state.attachments` sem tentar buscar no store v3. Não está claro (sem contexto do resto do projeto) se esse caso é impossível na prática ou se pode ocorrer legitimamente com um registro que tem anexos no store mas não seta `attachmentCount`.

**Sugestão:** revisar se `attachmentCount` é sempre populado de forma confiável ao salvar. Se não houver garantia, considerar sempre tentar `getAttachmentsByUuid` como fallback antes de assumir lista vazia.

---

## ISSUE-04 — Possível acúmulo de event listeners

**Local:**

```js
if (DOM.tipoOrdem) {
  DOM.tipoOrdem.addEventListener('change', handleTipoChange);
}
```

**Problema:** o comentário no código assume que `renderIniciais()` sempre recria o elemento DOM do zero (por isso o listener "precisa" ser reanexado). Essa suposição não é verificada aqui — se `renderIniciais()` não recriar o elemento em algum caminho de execução, listeners vão se acumular a cada chamada de `applyRecord`, causando `handleTipoChange` disparando múltiplas vezes por uma única mudança.

**Sugestão:** confirmar a garantia dentro de `renderIniciais()` (fora do escopo deste arquivo). Como defesa adicional, considerar `removeEventListener` antes do `addEventListener`, ou delegação de evento no elemento pai (que não é recriado).

---

## ISSUE-05 — Race condition entre chamadas concorrentes de `applyRecord`

**Local:**

```js
const storedAttachments = await getAttachmentsByUuid(record.uuid);
```

**Problema:** se `applyRecord` for chamado novamente antes que este `await` resolva (ex: usuário troca de registro rapidamente), a resposta da chamada antiga pode chegar depois e sobrescrever `state.attachments` com dados do registro errado.

**Sugestão:** implementar um token/guard de requisição:

```js
const requestId = ++state._restoreToken;
// ...após o await:
if (requestId !== state._restoreToken) return; // resposta obsoleta
```

---

## ISSUE-06 — Ausência de tratamento de erro abrangente

**Local:** função inteira.

**Problema:** apenas o `try/catch` em torno de `getAttachmentsByUuid` existe. Qualquer erro em `renderIniciais()`, `renderRetorno()`, `renderEquipamentos()`, `collectIniciais()` ou `updateLivePreview()` propaga sem tratamento, deixando o formulário em estado parcialmente restaurado sem feedback ao usuário.

**Sugestão:** decidir uma estratégia consistente — ex.: envolver a função inteira (ou os blocos de render) em try/catch com exibição de erro amigável, e possivelmente reverter para um estado seguro em caso de falha.

---

## ISSUE-07 — Sem validação do argumento `record`

**Local:** início da função:

```js
export async function applyRecord(record) {
  setCurrentUUID(record.uuid);
```

**Problema:** não há checagem de que `record` é um objeto válido nem que `record.uuid` existe antes de usá-lo. Um `record` nulo/indefinido ou malformado quebra imediatamente com erro genérico de "cannot read property of undefined".

**Sugestão:** validar no início e falhar com mensagem clara, ou tratar `record` ausente como no-op.

---

## ISSUE-08 — `markAttachmentsDirty()` chamado incondicionalmente no carregamento

**Local:**

```js
// Marcar dirty para que próximos saves persistam corretamente
markAttachmentsDirty();
```

**Problema:** isso marca os anexos como "sujos" (pendentes de persistência) imediatamente após **carregar** um registro existente, antes de qualquer edição do usuário. Sem conhecer o restante do fluxo de persistência, não é possível confirmar se isso é intencional (ex: necessário para normalizar o formato) ou um efeito colateral indesejado que pode disparar um save desnecessário no próximo evento de persistência.

**Sugestão:** confirmar a necessidade real desta chamada neste ponto específico do fluxo de restauração.

---

## ISSUE-09 — Função com múltiplas responsabilidades (baixa coesão)

**Local:** função inteira (~100 linhas).

**Problema:** `applyRecord` concentra: migração de formato de dados, mutação de estado global, manipulação direta de DOM, gerenciamento de listeners, disparo de múltiplos renders e sincronização de estado pós-render. Isso dificulta testes unitários (não é possível testar a migração de dados isoladamente da manipulação de DOM, por exemplo) e aumenta o custo de qualquer mudança futura.

**Sugestão:** dividir em funções menores com responsabilidade única, por exemplo:

- `migrateEquipamentos(record)`
- `restoreAttachments(record)`
- `restoreFormFields(record)` (iniciais + retorno)
- `syncControlVisibility()` (blocos `instaladoEquip`/`retiradoEquip`)

mantendo `applyRecord` como orquestrador que apenas chama essas funções em sequência.

---

## Resumo de prioridade sugerida

| Issue    | Severidade  | Motivo                                           |
| -------- | ----------- | ------------------------------------------------ |
| ISSUE-01 | Alta        | Mutação silenciosa de dados                      |
| ISSUE-05 | Alta        | Race condition pode restaurar registro errado    |
| ISSUE-06 | Média-Alta  | Sem visibilidade de falhas parciais              |
| ISSUE-03 | Média       | Pode zerar anexos existentes em caso não coberto |
| ISSUE-04 | Média       | Depende de garantia externa não verificada aqui  |
| ISSUE-07 | Média       | Falha genérica sem validação de entrada          |
| ISSUE-08 | Baixa-Média | Depende de confirmação do fluxo de persistência  |
| ISSUE-02 | Baixa       | Duplicação de código, sem risco funcional direto |
| ISSUE-09 | Baixa       | Débito técnico estrutural, sem bug imediato      |

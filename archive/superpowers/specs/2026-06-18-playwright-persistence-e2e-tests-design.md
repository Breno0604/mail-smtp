# Playwright E2E Persistence Tests — Design

> **Status:** Design revisado via graphify
> **Data:** 2026-06-18
> **Context:** Os testes Vitest unitários cobrem lógica de persistência, mas não há nenhum teste Playwright E2E que verifique se dados sobrevivem a reload, crash, abas simultâneas, etc.

---

## Descoberta Crítica (via graphify)

O app **NÃO auto-restaura** dados após reload. Em `app.js:L127`, o `DOMContentLoaded` chama `clearCurrentUUID()`, iniciando sempre com formulário limpo. Para recuperar dados, o usuário deve:

1. Clicar no hamburger (`#hamburger`) → abre sidebar
2. Clicar no botão "✏️ Editar" (`.sidebar-btn-edit`) no registro desejado
3. `loadRecord()` → `applyRecord()` restaura todos os campos

Isso significa que todos os testes de reload precisam:

1. Verificar que os dados estão no IndexedDB (sobreviveram ao reload)
2. Abrir sidebar → clicar "Editar" → verificar campos restaurados no formulário

Outras descobertas:

- Auto-save é disparado por **cada evento input/change** via `debouncedSave()` (app.js:L93)
- O **primeiro save** requer UC **E** OS preenchidos (`checkInitialPersistence()` em app.js:L28-36)
- `navigator.storage.persist()` é solicitado no load (app.js:L115-117), protegendo IndexedDB contra limpeza automática
- Delete na sidebar chama `closeSidebar()` antes de `showConfirm()`, e resetForm se o UUID deletado é o mesmo do current

---

## Estratégia

**Abordagem B** — múltiplos spec files por categoria, sem Page Object Model.

Cada spec file:

- Tem seu próprio `beforeEach` com `page.goto('/')`
- É independente e executável isoladamente
- Usa helpers compartilhados em `tests-e2e/helpers/persistence.js`

---

## Estrutura de Arquivos

```
tests-e2e/
  helpers/
    persistence.js          # Helpers: readIndexedDB, fillCompleteForm, etc.
  form-fill.spec.js              # (existente — sem alterações)
  persistence-reload.spec.js     # Cenários 1, 3, 6
  persistence-indexeddb.spec.js  # Cenário 2
  persistence-multi-tab.spec.js  # Cenário 4
  persistence-attachments.spec.js# Cenário 5
  persistence-stateful.spec.js   # Cenários 8, 9, 10
  persistence-sw.spec.js         # Cenário 7 (simplificado)
```

Nenhum arquivo existente é alterado — apenas adições.

---

## Arquivo: `helpers/persistence.js`

Funções auxiliares compartilhadas entre os spec files:

```js
import { expect } from '@playwright/test';

// Lê todos os registros do IndexedDB diretamente
export async function readIndexedDB(page) {
  return page.evaluate(() => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('mail-mvp', 3);
      req.onsuccess = () => {
        const tx = req.result.transaction('records', 'readonly');
        const getAll = tx.objectStore('records').getAll();
        getAll.onsuccess = () => resolve(getAll.result);
        getAll.onerror = () => reject(getAll.error);
      };
      req.onerror = () => reject(req.error);
    });
  });
}

// Lê anexos do IndexedDB por UUID
export async function readAttachments(page, uuid) {
  return page.evaluate(uuid => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('mail-mvp', 3);
      req.onsuccess = () => {
        const tx = req.result.transaction('attachments', 'readonly');
        const index = tx.objectStore('attachments').index('uuid');
        const getAll = index.getAll(uuid);
        getAll.onsuccess = () => resolve(getAll.result);
        getAll.onerror = () => reject(getAll.error);
      };
      req.onerror = () => reject(req.error);
    });
  }, uuid);
}

// Preenche formulário completo com dados deterministicos
export async function fillCompleteForm(page, suffix = '') {
  await page.fill('#uc', `11111${suffix}`);
  await page.fill('#os', `22222${suffix}`);
  await page.selectOption('#lider', { label: 'ANDRE DE SOUSA CARVALHO' });
  await page.selectOption('#parceiro', { label: 'JOSE DOGIVAN DA SILVA' });
  await page.selectOption('#municipio', { label: 'FORTALEZA' });
  await page.selectOption('#notificado', { label: 'SIM' });
  await page.selectOption('#placa', { label: 'RHS6G02' });
  await page.fill('#data', '2026-06-13');
  await page.fill('#hora_inicio', '08:00');
  await page.fill('#hora_fim', '17:00');
  await page.fill('#coordenadas', '-3.71839\u00b0 S, -38.5434\u00b0 O');
}

// Preenche só UC+OS (mínimo para ativar primeiro save)
export async function fillMinimal(page, uc = '11111', os = '22222') {
  await page.fill('#uc', uc);
  await page.fill('#os', os);
}

// Adiciona uma linha de equipamento e preenche
export async function addEquipRow(page, status, categoria, numero) {
  await page.click('#btn-add-equip');
  await page.waitForSelector('.equip-row');
  const lastRow = page.locator('.equip-row').last();
  await lastRow.locator('select').nth(0).selectOption(status);
  await lastRow.locator('select').nth(1).selectOption(categoria);
  await lastRow.locator('input.equip-numero').fill(numero);
}

// Abre sidebar e clica "Editar" no registro com o summaryText
export async function restoreViaSidebar(page, summaryText) {
  await page.click('#hamburger');
  await page.waitForSelector('#sidebar-list .sidebar-item');
  const item = page.locator('#sidebar-list .sidebar-item', { hasText: summaryText }).first();
  await item.locator('.sidebar-btn-edit').click();
  await page.waitForSelector('#sidebar-list', { state: 'hidden' }).catch(() => {});
}

// Confirma modal de confirmação (#confirm-modal)
export async function confirmModal(page) {
  await page.waitForSelector('#confirm-modal:not(.hidden)', { timeout: 3000 });
  await page.click('#confirm-modal-ok');
  await page.waitForSelector('#confirm-modal.hidden', { timeout: 3000 });
}

// Aguarda debounce (1s save timer + margem)
export async function waitForSave(page, ms = 1500) {
  await page.waitForTimeout(ms);
}

// Cria buffer PNG 1x1 para testes de upload
export function createPngBuffer() {
  // Minimal valid 1x1 PNG: 67 bytes
  const header = Buffer.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a, // signature
    0x00,
    0x00,
    0x00,
    0x0d,
    0x49,
    0x48,
    0x44,
    0x52, // IHDR
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x01, // 1x1
    0x08,
    0x02,
    0x00,
    0x00,
    0x00,
    0x90,
    0x77,
    0x53, // 8bit RGB
    0xde,
    0x00,
    0x00,
    0x00,
    0x0c,
    0x49,
    0x44,
    0x41, // IDAT
    0x54,
    0x08,
    0xd7,
    0x63,
    0xf8,
    0xcf,
    0xc0,
    0x00, // data
    0x00,
    0x00,
    0x02,
    0x00,
    0x01,
    0xe2,
    0x21,
    0xbc, //
    0x33,
    0x00,
    0x00,
    0x00,
    0x00,
    0x49,
    0x45,
    0x4e, // IEND
    0x44,
    0xae,
    0x42,
    0x60,
    0x82, //
  ]);
  return header;
}
```

---

## Spec: `persistence-reload.spec.js`

Testa sobrevivência de dados a recarregamento de página e navegação.

**Importante:** Após reload, o app inicia com form limpo (`clearCurrentUUID`). Dados sobrevivem no IndexedDB e podem ser restaurados via sidebar.

### Testes

**1a — Dados completos sobrevivem a F5 e são restauráveis via sidebar**

1. `page.goto('/')`
2. `fillCompleteForm(page)`
3. Seleciona tipo-ordem "CORTE POR FALTA DE PAGAMENTO"
4. Aguarda `#situacao_corte`
5. Seleciona `#situacao_corte` = "CLIENTE CORTADO"
6. `addEquipRow(page, 'Instalado', 'Medidor', '99999')`
7. Preenche `#complemento-corpo` com "Teste E2E persistência"
8. `waitForSave(page)` (debounce finaliza)
9. `page.reload()`
10. Aguarda `#uc` carregar
11. Verifica: `#uc` value = "" (form limpo após reload — clearCurrentUUID)
12. `readIndexedDB(page)` → verifica 1 registro com `iniciais.uc === '11111'`
13. `restoreViaSidebar(page, '11111')`
14. Aguarda `#uc` preenchido
15. Verifica: `#uc` = "11111"
16. Verifica: `#os` = "22222"
17. Verifica: `#lider` = "ANDRE DE SOUSA CARVALHO"
18. Verifica: `#complemento-corpo` = "Teste E2E persistência"
19. Verifica: `.equip-row` existe com numero "99999"
20. Verifica: `#preview-corpo` contém "11111" e "CLIENTE CORTADO"

**1b — Dados sobrevivem a fechar e reabrir aba**

1. `page.goto('/')`
2. `fillCompleteForm(page)`
3. Seleciona tipo-ordem "ADEQUACAO SMF"
4. `waitForSave(page)`
5. Fecha página: `page.close()`
6. Abre nova página: `const page2 = await context.newPage()`
7. `page2.goto('/')`
8. `readIndexedDB(page2)` → verifica 1 registro com `iniciais.uc === '11111'`
9. `restoreViaSidebar(page2, '11111')`
10. Verifica: `#uc` = "11111"

**1c — Navegação abrupta durante debounce não crasha**

1. `page.goto('/')`
2. `fillMinimal(page, '99999', '88888')`
3. Imediatamente `page.goto('/')` (antes do debounce de 1s)
4. Verifica: página carregou sem erros (`page.locator('#uc')` visível)
5. Preenche novamente UC + OS
6. Verifica: UC aparece no preview

**1d — Auto-save progressivo sobrevive a múltiplos reloads**

1. `page.goto('/')`
2. `fillMinimal(page, '33333', '44444')`
3. `waitForSave(page)`
4. `page.reload()`
5. Aguarda `#uc`
6. Verifica: IndexedDB tem 1 registro com `iniciais.uc === '33333'`
7. `restoreViaSidebar(page, '33333')`
8. Preenche `#lider` = "ANDRE DE SOUSA CARVALHO"
9. `waitForSave(page)`
10. `page.reload()`
11. `restoreViaSidebar(page, '33333')`
12. Verifica: `#uc` = "33333" e `#lider` = "ANDRE DE SOUSA CARVALHO"

---

## Spec: `persistence-indexeddb.spec.js`

Testa leitura direta do IndexedDB para verificar estrutura e conteúdo.

### Testes

**2a — Schema do banco**

1. `page.goto('/')`
2. `page.evaluate()` para abrir `mail-mvp` DB
3. Verifica: DB existe, versão 3
4. Verifica: objectStoreNames contém `records` e `attachments`

**2b — Conteúdo salvo no IndexedDB**

1. `page.goto('/')`
2. `fillCompleteForm(page)`
3. Seleciona "CORTE POR FALTA DE PAGAMENTO"
4. Preenche `#situacao_corte` = "CLIENTE CORTADO"
5. `addEquipRow(page, 'Instalado', 'Medidor', '99999')`
6. Preenche `#complemento-corpo` com "Teste IndexedDB"
7. `waitForSave(page)`
8. `readIndexedDB(page)` → `records`
9. Verifica: 1 registro
10. Verifica: `record.iniciais.uc === '11111'`
11. Verifica: `record.iniciais['tipo-ordem'] === 'CORTE POR FALTA DE PAGAMENTO'`
12. Verifica: `record.retorno.situacao_corte === 'CLIENTE CORTADO'`
13. Verifica: `record.composicao.complementoCorpo` === "Teste IndexedDB"
14. Verifica: `record.uuid` é string de 36 chars
15. Verifica: `record.createdAt` é ISO string
16. Verifica: `record.updatedAt` é ISO string
17. Verifica: `record.equipamentos.length === 1`
18. Verifica: `record.equipamentos[0].numero === '99999'`

**2c — attachmentCount correto**

1. `page.goto('/')`
2. `fillMinimal(page)`
3. Cria 2 buffers PNG: `createPngBuffer()`
4. `page.setInputFiles('#file-input', [ { name: 'a.png', mimeType: 'image/png', buffer: buf1 }, { name: 'b.png', mimeType: 'image/png', buffer: buf2 } ])`
5. Aguarda `.preview-item` aparecer (2x)
6. `waitForSave(page)`
7. `readIndexedDB(page)` → `records[0].attachmentCount === 2`
8. `readAttachments(page, uuid)` → 2 entries com `name`, `type`, `data`

**2d — UUID único por registro**

1. `page.goto('/')`
2. `fillMinimal(page, '11111', '22222')`
3. `waitForSave(page)`
4. `readIndexedDB(page)` → `records[0].uuid` = uuid1
5. Clica "Novo" (`#btn-novo-form`)
6. `fillMinimal(page, '33333', '44444')`
7. `waitForSave(page)`
8. `readIndexedDB(page)` → 2 registros, uuid2 ≠ uuid1

---

## Spec: `persistence-multi-tab.spec.js`

Testa concorrência entre abas.

### Config

- `fullyParallel: false` no config (já existente)
- 2 páginas no mesmo `browserContext`
- Testes com `test.serial()` para garantir ordem

### Testes

**3a — Aba B vê dados salvos pela Aba A**

1. `pageA.goto('/')`
2. `fillMinimal(pageA, '11111', '22222')`
3. `waitForSave(pageA)`
4. `pageB = await context.newPage()`
5. `pageB.goto('/')`
6. `readIndexedDB(pageB)` → verifica 1 registro com `iniciais.uc === '11111'`
7. Na pageB, abre sidebar → verifica "11111" aparece

**3b — Aba A edita, Aba B reload vê atualização**

1. Continuação do 3a
2. `pageA` preenche `#lider` = "ANDRE DE SOUSA CARVALHO"
3. `waitForSave(pageA)`
4. `pageB.reload()`
5. `restoreViaSidebar(pageB, '11111')`
6. Verifica: `#lider` = "ANDRE DE SOUSA CARVALHO"

**3c — Aba B deleta registro, Aba A cria novo sem crashar**

1. `pageA.goto('/')`
2. `fillMinimal(pageA, '55555', '66666')`
3. `waitForSave(pageA)`
4. `pageB.goto('/')`
5. Na pageB, abre sidebar → clica "🗑️ Excluir" (`.sidebar-btn-delete`) no registro "55555"
6. `confirmModal(pageB)` — confirma exclusão
7. `pageA` preenche `#lider` = "NOVO LIDER"
8. `waitForSave(pageA)` — pageA cria novo UUID (o anterior foi deletado)
9. Verifica: `pageA` não crashou, `#lider` = "NOVO LIDER"
10. `readIndexedDB(pageA)` → verifica que novo registro existe

---

## Spec: `persistence-attachments.spec.js`

Testa upload de arquivos e persistência pós-reload.

### Testes

**4a — Arquivo único sobrevive a reload**

1. Cria Buffer de PNG: `createPngBuffer()`
2. `page.goto('/')`
3. `fillMinimal(page, '11111', '22222')`
4. `page.setInputFiles('#file-input', [{ name: 'test.png', mimeType: 'image/png', buffer }])`
5. Aguarda `.preview-item` aparecer
6. `waitForSave(page)`
7. `page.reload()`
8. `restoreViaSidebar(page, '11111')`
9. Aguarda `.preview-item` ou verifica `#file-count` contém "1 / 12"

**4b — Múltiplos arquivos sobrevivem a reload**

1. Cria 3 buffers PNG
2. `page.goto('/')` + `fillMinimal(page, '11111', '22222')`
3. `page.setInputFiles('#file-input', [file1, file2, file3])`
4. Aguarda 3 `.preview-item`
5. `waitForSave(page)`
6. `page.reload()`
7. `restoreViaSidebar(page, '11111')`
8. Verifica: 3 `.preview-item` restaurados (ou `#file-count` contém "3 / 12")

**4c — Arquivo inválido não quebra a persistência**

1. `page.goto('/')`
2. `fillMinimal(page)`
3. `page.setInputFiles('#file-input', [{ name: 'script.exe', mimeType: 'application/x-msdownload', buffer: Buffer.from('MZ') }])`
4. Verifica: toast de erro aparece OU arquivo rejeitado (`.preview-item` não aparece)
5. Verifica: página não crashou, IndexedDB não corrompido

---

## Spec: `persistence-stateful.spec.js`

Testa fluxos de estado: tipo-ordem, sidebar múltipla, novo+restore.

### Testes

**5a — Troca de tipo-ordem limpa retorno e persiste no IndexedDB**

1. `page.goto('/')`
2. `fillMinimal(page, '11111', '22222')`
3. Seleciona "VISTORIA DA UC"
4. Aguarda `#resultado`
5. Seleciona `#resultado` = "Regular"
6. `waitForSave(page)`
7. Seleciona tipo-ordem "CORTE POR FALTA DE PAGAMENTO"
8. Aguarda: `#situacao_corte` visível
9. Verifica: `#resultado` não está no DOM
10. `waitForSave(page)`
11. `readIndexedDB(page)` → `record.retorno.resultado` deve ser `undefined`
12. `record.retorno` não deve conter campos de "VISTORIA DA UC"

**5b — 5+ registros na sidebar sem vazamento de dados**

1. `page.goto('/')`
2. Para i = 1..5:
   - Se i > 1: clica "Novo" (`#btn-novo-form`)
   - `fillMinimal(page, \`\`${i}${i}${i}${i}${i}\`\`, \`\`OS-${i}\`\`)`
   - `waitForSave(page)`
3. Para i = 1..5:
   - `restoreViaSidebar(page, \`\`${i}${i}${i}${i}${i}\`\`)`
   - Verifica: `#uc` = \`\`${i}${i}${i}${i}${i}\`\`
   - Verifica: `#os` = \`\`OS-${i}\`\`
4. `readIndexedDB(page)` → 5 registros, todos com UUIDs diferentes

**5c — Novo + restore ciclo completo**

1. `page.goto('/')`
2. `fillMinimal(page, '11111', '22222')`
3. Preenche `#lider` = "ANDRE DE SOUSA CARVALHO"
4. `waitForSave(page)`
5. Clica "Novo" (`#btn-novo-form`)
6. Verifica: `#uc` = "", `#os` = ""
7. `restoreViaSidebar(page, '11111')`
8. Verifica: `#uc` = "11111", `#lider` = "ANDRE DE SOUSA CARVALHO"

**5d — Editar após restore e recarregar**

1. Continuação do 5c (registro já restaurado)
2. Altera `#uc` para "99999"
3. `waitForSave(page)`
4. `page.reload()`
5. `restoreViaSidebar(page, '99999')` (summary agora é "99999")
6. Verifica: `#uc` = "99999"

---

## Spec: `persistence-sw.spec.js`

Teste simplificado do Service Worker.

### Testes

**6a — Service Worker está registrado**

1. `page.goto('/')`
2. Aguarda SW registrar (2s)
3. `page.evaluate(async () => { const reg = await navigator.serviceWorker.getRegistration(); return !!reg; })` → true

**6b — SW não interfere na persistência IndexedDB**

1. `page.goto('/')`
2. `fillMinimal(page)`
3. `waitForSave(page)`
4. `page.reload()`
5. `readIndexedDB(page)` → verifica 1 registro com dados intactos

**6c — `navigator.storage.persist()` foi solicitado**

1. `page.goto('/')`
2. `page.evaluate(async () => { return navigator.storage.persisted(); })` → true (se o browser concedeu)

---

## Config Playwright

Nenhuma alteração no `playwright.config.js` existente — os novos spec files estão dentro de `tests-e2e/` já configurado.

Nota: execução sequencial (`fullyParallel: false`, `workers: 1`) já está no config — necessário para testes de persistência que compartilham o mesmo IndexedDB.

---

## Critério de Sucesso

- Todos os 18 testes passam consistentemente (3 execuções consecutivas sem falha)
- `npx playwright test tests-e2e/persistence-reload.spec.js` roda sozinho sem depender de outros specs
- `npx playwright test` roda todos os specs (antigos + novos) sem quebrar
- Nenhum arquivo existente é modificado (apenas adições)

# Sidebar, Tarefas de Implementação

> Gerado pelo Redator em 2026-06-15

---

## Pré-requisitos

- [ ] Módulo `dom.js` com `DOM.sidebarList`, `DOM.sidebarFilter`, `DOM.dupModal`, `DOM.dupModalTitle`, `DOM.dupModalBody`, `DOM.dupModalCancel`, `DOM.dupModalConfirm`
- [ ] Módulo `db.js` com `getAllRecords()`, `getRecord()`, `deleteRecord()`
- [ ] Módulo `restore.js` com `applyRecord()`
- [ ] Módulo `ui.js` com `showConfirm()`
- [ ] Módulo `utils.js` com `formatDate()`, `captureCoordinates()`
- [ ] Módulo `iniciais.js` com `renderIniciais()`
- [ ] Módulo `retornos.js` com `renderRetorno()`, `handleTipoChange()`
- [ ] Módulo `equipment.js` com `showEmptyEquip()`
- [ ] Módulo `attachments.js` com `updateFileCount()`

## Tarefas

- [ ] T-01, Implementar `closeSidebar()` e toggle de sidebar
  - Origem no legado: `scripts/sidebar.js:8-10`
  - Critério de pronto: Remove classe `sidebar-open` do body
  - Confiança: 🟢

- [ ] T-02, Implementar `getRecordSummary(record)`
  - Origem no legado: `scripts/sidebar.js:12-21`
  - Critério de pronto: Retorna string `<UC>-<OS>-<Tipo>` com fallbacks progressivos
  - Confiança: 🟢

- [ ] T-03, Implementar `renderSidebar(filterTerm?)`
  - Origem no legado: `scripts/sidebar.js:23-118`
  - Critério de pronto: Busca records, ordena, filtra, cria elementos DOM com header/status/meta/actions
  - Confiança: 🟢

- [ ] T-04, Implementar `loadRecord(record)` com scroll-to-top
  - Origem no legado: `scripts/sidebar.js:120-124`
  - Critério de pronto: Chama `applyRecord()`, fecha sidebar, scroll para topo
  - Confiança: 🟢

- [ ] T-05, Implementar `initSidebarFilter()`
  - Origem no legado: `scripts/sidebar.js:126-130`
  - Critério de pronto: Input event → `renderSidebar()` com valor atual
  - Confiança: 🟢

- [ ] T-06, Implementar `checkDuplicate()` com modal
  - Origem no legado: `scripts/duplicate.js`
  - Critério de pronto: Se record.status === "sent", exibe modal; retorna boolean
  - Confiança: 🟢

- [ ] T-07, Implementar `resetForm()` completo
  - Origem no legado: `scripts/reset.js`
  - Critério de pronto: Limpa state, UUID, DOM sections, recaptura coordenadas, re-attach listener
  - Confiança: 🟢

## Tarefas de Teste

- [ ] TT-01, Testar `closeSidebar()` remove classe
- [ ] TT-02, Testar `getRecordSummary()` com UC+OS+Tipo, só UC, só OS, vazio
- [ ] TT-03, Testar `renderSidebar()` com lista vazia
- [ ] TT-04, Testar `renderSidebar()` com 2+ registros (ordenados)
- [ ] TT-05, Testar filtro sidebar por UC, OS, tipoOrdem
- [ ] TT-06, Testar `checkDuplicate()` com status draft (permite)
- [ ] TT-07, Testar `checkDuplicate()` com status sent (modal)
- [ ] TT-08, Testar `resetForm()` limpa state e DOM
- [ ] TT-09, Testar `resetForm()` chama captureCoordinates

## Ordem Sugerida

1. T-01, T-02 (sidebar base)
2. T-03, T-04, T-05 (render + load + filter)
3. T-06 (duplicate check)
4. T-07 (reset)
5. Testes na ordem correspondente

## Lacunas Pendentes (🔴)

Nenhuma.

---

*Fim das tarefas de sidebar.*

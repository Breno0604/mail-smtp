# Ferramentas, Tarefas de Implementação

> Gerado pelo Redator em 2026-06-15

---

## Pré-requisitos

- [ ] Todos os outros módulos de feature (iniciais, retornos, equipamentos, anexos, sidebar, persistência, validação)
- [ ] Módulo `compress.js` (compressão de anexos)

## Tarefas

- [ ] T-01, Implementar `dom.js` — cacheDOM() com todos os elementos
  - Origem no legado: `scripts/dom.js`
  - Critério de pronto: 30+ elementos cacheados; convenção: busca única, mutação de propriedades apenas
  - Confiança: 🟢

- [ ] T-02, Implementar `styles.js` — constantes CSS compartilhadas
  - Origem no legado: `scripts/styles.js`
  - Critério de pronto: `INPUT_CLASS` e `SELECT_CLASS` exportadas
  - Confiança: 🟢

- [ ] T-03, Implementar `ui.js` — showError, hideError, showToast, setFieldError, clearFieldError, showConfirm
  - Origem no legado: `scripts/ui.js`
  - Critério de pronto: Toast com auto-hide 3.5s; confirm retorna Promise<boolean> com cleanup
  - Confiança: 🟢

- [ ] T-04, Implementar `utils.js` — toBase64, blobToBase64, base64ToBlob, loadImage, formatDate, captureCoordinates
  - Origem no legado: `scripts/utils.js`
  - Critério de pronto: Conversões de arquivo; geolocalização com timeout 10s e fallback
  - Confiança: 🟢

- [ ] T-05, Implementar `sw-update.js` — initSW() com update detection
  - Origem no legado: `scripts/sw-update.js`
  - Critério de pronto: Registra sw.js; controllerchange → modal de reload
  - Confiança: 🟢

- [ ] T-06, Implementar `send.js` — sendEmail() (orquestração frontend)
  - Origem no legado: `scripts/send.js`
  - Critério de pronto: validateAll → checkDuplicate → compress → fetch POST; btn disabled durante; updateRecordStatus após sucesso
  - Confiança: 🟢

- [ ] T-07, Implementar `app.js` — inicialização e eventos globais
  - Origem no legado: `scripts/app.js`
  - Critério de pronto: DOMContentLoaded → cacheDOM, initSidebarFilter, renderIniciais, initEvents; eventos input/change/pointerdown; checkInitialPersistence
  - Confiança: 🟢

- [ ] T-08, Implementar `updateFilledClass()` e `updateAllFilledClasses()`
  - Origem no legado: `app.js:13-19,36-40`
  - Critério de pronto: Add/remove classe `.is-filled` baseado em valor
  - Confiança: 🟢

- [ ] T-09, Implementar `checkInitialPersistence()` — gate UC+OS
  - Origem no legado: `app.js:25-34`
  - Critério de pronto: Só salva quando uc e os preenchidos
  - Confiança: 🟢

## Tarefas de Teste

- [ ] TT-01, Testar dom.js cache contém todos os elementos esperados
- [ ] TT-02, Testar ui.js showToast/hide após 3.5s
- [ ] TT-03, Testar ui.js showConfirm resolve true/false
- [ ] TT-04, Testar ui.js setFieldError/clearFieldError
- [ ] TT-05, Testar utils.js toBase64 round-trip
- [ ] TT-06, Testar utils.js formatDate
- [ ] TT-07, Testar utils.js captureCoordinates fallback
- [ ] TT-08, Testar send.js validateAll é chamado
- [ ] TT-09, Testar app.js checkInitialPersistence só salva com UC+OS

## Ordem Sugerida

1. T-01, T-02 (dom.js + styles.js) — infraestrutura base
2. T-03, T-04 (ui.js + utils.js) — utilitários
3. T-05 (sw-update.js) — service worker (independente)
4. T-06 (send.js) — orquestração de envio
5. T-07, T-08, T-09 (app.js) — orquestração geral
6. Testes na ordem correspondente

## Lacunas Pendentes (🔴)

Nenhuma.

---

*Fim das tarefas de ferramentas.*

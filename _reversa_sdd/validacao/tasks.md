# Validação, Tarefas de Implementação

> Gerado pelo Redator em 2026-06-15

---

## Pré-requisitos

- [ ] Módulo `dom.js` com `DOM.equipList`, `DOM.retornoCampos`, `DOM.tipoOrdem`
- [ ] Módulo `state.js` com todos os campos do state
- [ ] Módulo `ui.js` com `showError()`, `hideError()`, `setFieldError()`, `clearFieldError()`
- [ ] Módulo `iniciais.js` com `getIniciaisData()`
- [ ] Módulo `retornos.js` com `getRetornoData()`
- [ ] Módulo `fields.js` com `iniciaisFields`
- [ ] Módulo `equipment.js` com `collectEquipamentos()`

## Tarefas

- [ ] T-01, Implementar `_resetValidationCache()` e cache `_validatedData`
  - Origem no legado: `validation.js:11-16`
  - Critério de pronto: Objeto vazio inicial; reset limpa todas as chaves
  - Confiança: 🟢

- [ ] T-02, Implementar helpers `markError(el, msg)` e `clearError(el)`
  - Origem no legado: `validation.js:20-28`
  - Critério de pronto: Adiciona/remove classe `error` + chama setFieldError/clearFieldError
  - Confiança: 🟢

- [ ] T-03, Implementar `validateSection1()` — iniciais
  - Origem no legado: `validation.js:32-100`
  - Critério de pronto: Valida obrigatórios, UC (só números), data (não futura), hora (fim != início); popula cache
  - Confiança: 🟢

- [ ] T-04, Implementar `validateSection2()` — equipamentos
  - Origem no legado: `validation.js:102-140`
  - Critério de pronto: Skip se vazio; valida tipo/categoria/numero; detecta duplicidade com normalização
  - Confiança: 🟢

- [ ] T-05, Implementar `validateSection3()` — retorno
  - Origem no legado: `validation.js:142-171`
  - Critério de pronto: Itera `[data-field-nome]` groups; skip hidden; valida obrigatórios
  - Confiança: 🟢

- [ ] T-06, Implementar `validateSection4()` — anexos
  - Origem no legado: `validation.js:173-188`
  - Critério de pronto: Verifica max 12 anexos e max 8MB cada
  - Confiança: 🟢

- [ ] T-07, Implementar `SECTION_VALIDATORS` + `validateSection(n)`
  - Origem no legado: `validation.js:191-206`
  - Critério de pronto: Dispatch por número de seção; seção 5 retorna true
  - Confiança: 🟢

- [ ] T-08, Implementar `validateAll()` com scroll para primeiro erro
  - Origem no legado: `validation.js:208-250`
  - Critério de pronto: Valida seções na ordem (1→3→2→4); scroll suave ao primeiro `.error`
  - Confiança: 🟢

- [ ] T-09, Implementar `collectSectionData(n)` com fallback
  - Origem no legado: `validation.js:269-294`
  - Critério de pronto: Usa cache se existir, senão relê DOM; consome o cache (delete)
  - Confiança: 🟢

- [ ] T-10, Implementar `addBlurValidation(el)`
  - Origem no legado: `validation.js:252-267`
  - Critério de pronto: Blur → valida required; input/change → clearError
  - Confiança: 🟢

## Tarefas de Teste

- [ ] TT-01, Testar markError/clearError (classes + ui.js)
- [ ] TT-02, Testar validateSection1 obrigatórios
- [ ] TT-03, Testar UC não-numérica → erro
- [ ] TT-04, Testar data futura → erro
- [ ] TT-05, Testar hora fim == hora início → erro
- [ ] TT-06, Testar validateSection2 equipamentos duplicados
- [ ] TT-07, Testar validateSection3 skip hidden
- [ ] TT-08, Testar validateSection4 max anexos
- [ ] TT-09, Testar validateAll scroll ao primeiro erro
- [ ] TT-10, Testar collectSectionData usa cache
- [ ] TT-11, Testar _resetValidationCache entre testes
- [ ] TT-12, Testar addBlurValidation valida on-blur

## Ordem Sugerida

1. T-01, T-02 (cache + helpers)
2. T-03 (section 1 — a mais complexa)
3. T-04, T-05, T-06 (sections 2, 3, 4)
4. T-07, T-08, T-09 (dispatch + validateAll + collect)
5. T-10 (blur validation)
6. Testes na ordem correspondente

## Lacunas Pendentes (🔴)

Nenhuma.

---

*Fim das tarefas de validação.*

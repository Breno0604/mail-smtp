# Equipamentos, Tarefas de Implementação

> Gerado pelo Redator em 2026-06-15

---

## Pré-requisitos

- [ ] Módulo `dom.js` com `DOM.equipList` e `DOM.emptyEquipMsg`
- [ ] Módulo `state.js` com `state.equipamentos` e `markDirty()`

## Tarefas

- [ ] T-01, Implementar `addEquip(tipo?, categoria?, numero?)`
  - Origem no legado: `scripts/equipment.js:1-43`
  - Critério de pronto: Cria row com 3 campos (Tipo select, Categoria select, Número input) + botão remover; aceita parâmetros opcionais para pré-preenchimento
  - Confiança: 🟢

- [ ] T-02, Implementar `collectEquipamentos()`
  - Origem no legado: `scripts/equipment.js:52-66`
  - Critério de pronto: Itera sobre `.equip-row` no DOM, extrai valores, retorna array de `{tipo, categoria, numero}`
  - Confiança: 🟢

- [ ] T-03, Implementar `renderEquipamentos()`
  - Origem no legado: `scripts/equipment.js:70-100`
  - Critério de pronto: Limpa `DOM.equipList`, itera sobre `state.equipamentos`, chama `addEquip()` para cada, decide mostrar/esconder mensagem vazia
  - Confiança: 🟢

- [ ] T-04, Implementar `showEmptyEquip()` e `hideEmptyEquip()`
  - Origem no legado: `scripts/equipment.js:47-50`
  - Critério de pronto: `show` seta `display: block`, `hide` seta `display: none`
  - Confiança: 🟢

- [ ] T-05, Integrar `collectEquipamentos()` no fluxo de envio e salvamento
  - Origem no legado: `scripts/app.js` (chamada em `collectAll()`)
  - Critério de pronto: Ao enviar email ou salvar rascunho, equipamentos são coletados e incluídos
  - Confiança: 🟢

- [ ] T-06, Garantir empty state na inicialização
  - Origem no legado: `scripts/equipment.js` (estado inicial)
  - Critério de pronto: Ao carregar o formulário sem equipamentos, mensagem vazia é exibida
  - Confiança: 🟢

## Tarefas de Teste

- [ ] TT-01, Testar `addEquip()` cria row com campos corretos
- [ ] TT-02, Testar preenchimento de parâmetros opcionais em `addEquip()`
- [ ] TT-03, Testar `collectEquipamentos()` retorna dados corretos
- [ ] TT-04, Testar `renderEquipamentos()` reconstrói rows do state
- [ ] TT-05, Testar empty state (show/hide)
- [ ] TT-06, Testar remoção de equipamento individual
- [ ] TT-07, Testar que ao remover último equipamento, mensagem vazia aparece

## Ordem Sugerida

1. T-04 (show/hide empty) — base
2. T-01 (addEquip) — funcionalidade principal
3. T-02 (collect) — leitura
4. T-03 (render) — restauração
5. T-05, T-06 — integração
6. Testes na ordem correspondente

## Lacunas Pendentes (🔴)

Nenhuma.

---

*Fim das tarefas de equipamentos.*

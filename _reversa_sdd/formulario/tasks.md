# Formulário, Tarefas de Implementação

> Gerado pelo Redator em 2026-06-15

---

## Pré-requisitos

- [ ] Módulo `dom.js` com cache DOM contendo `iniciaisCampos`, `retornoCampos`, `retornoDesc`, `retornoPlaceholder`
- [ ] Módulo `state.js` com `state.lastTipoOrdem`, `state.retorno`, `state.iniciais`
- [ ] Módulo `validation.js` com `addBlurValidation()`
- [ ] Módulo `styles.js` exportando `INPUT_CLASS`, `SELECT_CLASS`
- [ ] Módulo `utils.js` com `captureCoordinates()`

## Tarefas

- [ ] T-01, Criar schema `iniciaisFields[]` com 12 campos fixos
  - Origem no legado: `scripts/fields.js:3-16`
  - Critério de pronto: Array exportado contém todos os 12 campos com tipos, labels e opções corretos
  - Confiança: 🟢

- [ ] T-02, Criar schema `retornoFieldsByTipo` para 41 tipos de ordem
  - Origem no legado: `scripts/fields.js:49-118`
  - Critério de pronto: Mapa contém entry para cada tipo (ou usa "default" como fallback) com campos, opções e condicionais
  - Confiança: 🟢

- [ ] T-03, Criar `INPUT_CREATORS` (factory de elementos HTML)
  - Origem no legado: `scripts/iniciais.js:126-133`
  - Critério de pronto: Suporta select (com placeholder "Selecione"), number (inputMode=numeric), date, time (step=300), text, textarea
  - Confiança: 🟢

- [ ] T-04, Implementar `renderIniciais()` com agrupamento por linha
  - Origem no legado: `scripts/iniciais.js:137-187`
  - Critério de pronto: Renderiza 12 campos agrupados por linha, com labels, inputs, error spans, blur validation, debouncedSave
  - Confiança: 🟢

- [ ] T-05, Implementar widget de coordenadas com botão de refresh
  - Origem no legado: `scripts/iniciais.js:74-123`
  - Critério de pronto: Input readonly com botão refresh que chama `captureCoordinates()`, estilizado com paddingRight para o botão
  - Confiança: 🟢

- [ ] T-06, Implementar `getIniciaisData()` para leitura do DOM
  - Origem no legado: `scripts/iniciais.js:189-196`
  - Critério de pronto: Itera `iniciaisFields`, lê `document.getElementById(field.nome).value`, retorna objeto
  - Confiança: 🟢

- [ ] T-07, Implementar `renderRetorno()` com renderização dinâmica
  - Origem no legado: `scripts/retornos.js:8-74`
  - Critério de pronto: Renderiza campos por tipo de ordem, agrupa por linha, cria grupos com `dataset.fieldNome` e dados condicionais
  - Confiança: 🟢

- [ ] T-08, Implementar `handleTipoChange()` com detecção de mudança
  - Origem no legado: `scripts/retornos.js:154-164`
  - Critério de pronto: Compara com `lastTipoOrdem`, zera `state.retorno`, chama `renderRetorno()` + `saveState()`
  - Confiança: 🟢

- [ ] T-09, Implementar `updateConditionalFields()` com suporte a string, array e negação
  - Origem no legado: `scripts/retornos.js:96-120`
  - Critério de pronto: Avalia `condicional.valor` (string ou array), suporta `condicional.negado`, oculta/mostra grupos e zera valores ocultos
  - Confiança: 🟢

- [ ] T-10, Implementar `getRetornoData()` filtrando campos ocultos
  - Origem no legado: `scripts/retornos.js:122-138`
  - Critério de pronto: Retorna apenas campos com `display !== "none"`, lê valores do DOM
  - Confiança: 🟢

- [ ] T-11, Implementar `setRetornoData()` com reavaliação de condicionais
  - Origem no legado: `scripts/retornos.js:140-152`
  - Critério de pronto: Preenche valores no DOM, chama `updateConditionalFields()` para sincronizar visibilidade
  - Confiança: 🟢

- [ ] T-12, Garantir que `DOM.tipoOrdem` seja cacheado após `renderIniciais()`
  - Origem no legado: `scripts/iniciais.js:172`
  - Critério de pronto: `DOM.tipoOrdem` aponta para o select tipo-ordem recém-criado, com event listener `change → handleTipoChange`
  - Confiança: 🟢

## Tarefas de Teste

- [ ] TT-01, Testar renderização dos 12 campos iniciais com tipos corretos
- [ ] TT-02, Testar agrupamento por linha (mesma linha = mesma grid row)
- [ ] TT-03, Testar renderRetorno para cada um dos 41 tipos de ordem
- [ ] TT-04, Testar condicionais: valor único, array (any match) e negação
- [ ] TT-05, Testar que campos ocultos têm valor zerado
- [ ] TT-06, Testar que getRetornoData exclui campos ocultos
- [ ] TT-07, Testar handleTipoChange descarta dados anteriores
- [ ] TT-08, Testar setRetornoData + updateConditionalFields
- [ ] TT-09, Testar widget de coordenadas (render + botão refresh)

## Ordem Sugerida

1. T-01 e T-02 (schemas) — base para tudo
2. T-03 (INPUT_CREATORS) — factory de elementos
3. T-04 e T-05 (renderIniciais + coordenadas) — formulário base
4. T-07, T-08, T-09 (retorno dinâmico + condicionais) — formulário avançado
5. T-06, T-10, T-11 (coleta de dados) — leitura/escrita
6. T-12 (cache DOM.tipoOrdem) — integração
7. TT-01 a TT-09 (testes)

T-04 bloqueia T-12. T-07/T-08/T-09 devem vir depois de T-01/T-02/T-03.

## Lacunas Pendentes (🔴)

Nenhuma — todos os comportamentos foram extraídos do código.

---

*Fim das tarefas do formulário.*

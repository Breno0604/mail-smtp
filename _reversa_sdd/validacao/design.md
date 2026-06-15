# Validação, Design

> Gerado pelo Redator em 2026-06-15

---

## Arquitetura

```
validateAll()
  │
  ├─ validateSection1()  — Iniciais
  │   ├─ Itera fieldsIniciais (obrigatório → markError se vazio)
  │   ├─ UC: /^\d+$/ regex
  │   ├─ Data: selectedDate > today → erro
  │   └─ Hora: fim === inicio → erro
  │
  ├─ validateSection3()  — Retorno (só se tipo selecionado)
  │   ├─ Itera [data-field-nome] groups
  │   └─ Skip se group.style.display === "none"
  │
  ├─ validateSection2()  — Equipamentos
  │   ├─ Skip se 0 rows
  │   ├─ Tipo, categoria, número obrigatórios
  │   └─ Número normalizado + duplicidade check
  │
  └─ validateSection4()  — Anexos
      ├─ max 12
      └─ max 8MB cada

Scroll → primeiro .error encontrado
```

## Strategy Pattern

```js
const SECTION_VALIDATORS = {
  1: validateSection1,
  2: validateSection2,
  3: validateSection3,
  4: validateSection4,
  5: () => true,  // Revisão — sem validação
};

validateSection(n) → SECTION_VALIDATORS[n]()  // dispatch
```

## Cache de Dados

```
validateSection1()
  ├─ Popula _validatedData[1] = { uc, os, tipo-ordem, ... }
  ├─ state.iniciais = _validatedData[1]
  └─ collectSectionData(1) → usa cache se existir, senão getIniciaisData()

validateSection2()
  ├─ Popula _validatedData[2] = [{tipo, categoria, numero}, ...]
  ├─ collectEquipamentos() (já popula state)
  └─ collectSectionData(2) → usa state.equipamentos

validateSection3()
  ├─ Popula _validatedData[3] = { situacao_corte, ... }
  ├─ state.retorno = getRetornoData()
  └─ collectSectionData(3) → usa cache se existir, senão getRetornoData()
```

## Sistema de Erros

```
markError(el, msg)
  ├─ el.classList.add("error")
  └─ setFieldError(el, msg)  → ui.js: insere span.erro-campo ao lado do input

clearError(el)
  ├─ el.classList.remove("error")
  └─ clearFieldError(el)    → ui.js: remove span.erro-campo

showError(msg)   → ui.js: exibe toast/alert global
hideError()      → ui.js: oculta toast/alert global
```

## Blur Validation

```
addBlurValidation(el)
  ├─ blur: se required/data-required e vazio → markError
  ├─ input: se erro → clearError
  └─ change: se valor preenchido → clearError
```

## Fluxo de Envio com Validação

```
[Click Enviar]
     │
     ▼
validateAll()
     │
     ├─ if (!valid) → scroll to first error, return
     │
     └─ if (valid) → checkDuplicate()
                       │
                       ├─ if (bloqueado) → modal, stop
                       └─ if (permitido) → collectSectionData(1,2,3)
                                            → build email payload
                                            → fetch POST /api/send
```

## Normalização de Número de Equipamento

```js
// Equipamento número pode ser string numérica ou alfanumérica
const normalizedNum = isNaN(Number(inp.value))
  ? inp.value.replace(/^0+/, '')     // alfanumérico: remove leading zeros
  : String(Number(inp.value));       // numérico: converte para Number e volta
```

## Dependências

- `DOM` de `dom.js`: `DOM.equipList`, `DOM.retornoCampos`, `DOM.tipoOrdem`
- `state` de `state.js`: `state.iniciais`, `state.equipamentos`, `state.retorno`, `state.attachments`
- `ui.js`: `showError()`, `hideError()`, `setFieldError()`, `clearFieldError()`
- `iniciais.js`: `getIniciaisData()`, `iniciaisFields`
- `retornos.js`: `getRetornoData()`
- `fields.js`: `iniciaisFields`
- `equipment.js`: `collectEquipamentos()`

## API Pública

| Função | Parâmetros | Retorno | Descrição |
|--------|-----------|---------|-----------|
| `validateSection(n)` | `number` 1-5 | `boolean` | Valida seção, popula cache |
| `validateAll()` | `void` | `boolean` | Valida tudo, scrolla ao primeiro erro |
| `collectSectionData(n)` | `number` 1-3 | `void` | Coleta dados validados (cache → state) |
| `addBlurValidation(el)` | `HTMLElement` | `void` | Adiciona validação on-blur |
| `_resetValidationCache()` | `void` | `void` | Limpa cache (testes) |

## Estados de Tela

| Estado | Comportamento |
|--------|--------------|
| Formulário vazio | Sem erros visíveis; blur validation marca required ao sair |
| Erro de validação | Campo com borda vermelha + mensagem; scroll automático |
| Hidden conditional field | Ignorado na validação (retorno) |
| Equipamentos sem rows | Seção opcional — sempre válida |
| Anexos > 12 | Erro global no topo |
| Sucesso | Sem erros, prossegue para envio |

---

*Fim do design de validação.*

# ADR 004: Sistema de Validação com Erros Inline e Cache

**Data:** 2026-06-08 (v1.1.0)
**Confiança:** 🟢 CONFIRMADO

## Contexto

Originalmente, a validação exibia mensagens de erro globais no topo da página. Isso exigia que o usuário lesse a mensagem e encontrasse o campo problemático manualmente. Além disso, a validação relia o DOM múltiplas vezes — uma para validar e outra para coletar dados.

## Decisão

Implementar novo sistema com:
1. **Erros inline**: cada campo tem um `<span class="field-error">` abaixo dele
2. **Cache de validação**: `_validatedData[n]` — popula durante `validateSection`, consumido por `collectSectionData`
3. **Blur validation**: validação no blur (perda de foco) + limpeza no input/change
4. **Strategy Pattern**: `SECTION_VALIDATORS` — tabela de validadores por seção

## Alternativas Consideradas

- **Manter erros globais**: Rejeitado — UX pobre, usuário tinha que adivinhar qual campo estava errado
- **Validação apenas no submit**: Rejeitado — feedback muito tardio
- **Biblioteca de validação externa (yup, joi)**: Rejeitado — sem bundler, ES modules precisam ser nativos

## Consequências

- Positivas:
  - Feedback imediato para o usuário (blur + inline)
  - Cache evita re-leitura do DOM — `collectSectionData` reaproveita dados já validados
  - Código modular: adicionar nova seção = adicionar entry em `SECTION_VALIDATORS`
  - Scroll suave para o primeiro erro
- Negativas:
  - Necessário `_resetValidationCache()` entre execuções de teste
  - Cache pode ficar obsoleto se o DOM for modificado entre validação e coleta

## Commits Relacionados

- `9d1d7fa` feat: version 1.1.0 — validation system overhaul
- `51b8700` feat: add validateAll() for single-page validation
- `ea76813` feat: remove global error messages from validation (item 1)

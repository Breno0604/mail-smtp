# Relatório de Impacto — Princípios do Projeto

> Gerado em 2026-06-16
> Propõe ajustes nos templates do pipeline para refletir os princípios I (Preservação de Dados), II (Resiliência Offline) e III (Simplicidade).

---

## Template: `requirements-template.md`

**Status:** `não encontrado` — o template ainda não existe em `.reversa/templates/`.

### Sugestões para quando for criado:

1. **Adicionar seção "Alinhamento com Princípios"** no final do template, com checklist:
   - [ ] A feature preserva dados existentes? (Princípio I)
   - [ ] A feature funciona offline? (Princípio II)
   - [ ] A feature introduz nova dependência? Se sim, qual necessidade concreta justifica? (Princípio III)

2. **Adicionar campo "Risco aos Princípios"** na seção de restrições/riscos, com valores possíveis: `nenhum`, `baixo`, `médio`, `alto`.

---

## Template: `roadmap-template.md`

**Status:** `não encontrado` — o template ainda não existe em `.reversa/templates/`.

### Sugestões para quando for criado:

1. **Adicionar coluna "Princípios"** na tabela de itens do roadmap, listando quais princípios a feature impacta (ex: `I, III`).

2. **Adicionar nota** no cabeçalho:
   > Features que violam princípios ativos precisam de justificativa escrita aprovada antes de entrar no roadmap.

---

## Template: `actions-template.md`

**Status:** `não encontrado` — o template ainda não existe em `.reversa/templates/`.

### Sugestões para quando for criado:

1. **Adicionar coluna "Selo de Impacto"** na tabela de tarefas, com possibilidades:
   - `[PRESERV]` — risco ao Princípio I (Preservação de Dados)
   - `[OFFLINE]` — risco ao Princípio II (Resiliência Offline)
   - `[COMPLEX]` — risco ao Princípio III (Simplicidade)
   - `—` — nenhum impacto

2. **Adicionar instrução** no preâmbulo:
   > Toda task marcada com selo de impacto requer validação explícita no PR/code review.

---

## Templates não listados no Impacto

Os seguintes templates existem na pipeline mas não foram listados na seção "Impacto" de `principles.md`. Eles **não exigem** modificação, pois lidam com processos que os princípios não influenciam diretamente:

- `principles-template.md` — é o molde dos próprios princípios
- Nenhum outro template foi encontrado na pasta `.reversa/templates/`

---

## Resumo

| Template | Ação necessária |
|---|---|
| `requirements-template.md` | Criar com seção de alinhamento (quando for gerado) |
| `roadmap-template.md` | Criar com coluna de princípios (quando for gerado) |
| `actions-template.md` | Criar com selo de impacto (quando for gerado) |

**Nenhum template existente foi modificado** — pois nenhum template foi encontrado. As sugestões acima devem ser aplicadas **no momento da criação** de cada template.

---
name: retorno-fields-guide
description: Regras e boas práticas para adicionar novos campos de retorno aos Tipos de Ordem. Use quando o usuário solicitar adição, modificação ou criação de campos de retorno com base na planilha tipos_ordem_template.xlsx.
---

# Guia de Campos de Retorno

## Quando usar

Use esta skill quando:
- O usuário solicitar adição de novos campos de retorno a um Tipo de Ordem
- O usuário mencionar a planilha `dados_projeto/tipos_ordem_template.xlsx` (aba `corte`)
- A tarefa envolver modificar o arquivo `scripts/fields.js` para adicionar campos
- O usuário falar sobre "campos de retorno", "novos campos", "Tipo de Ordem"

## Fonte de verdade

A planilha `dados_projeto/tipos_ordem_template.xlsx`, aba `corte`, é a **única fonte de verdade** para definir campos de retorno.

**Colunas da planilha**:
- `ordem`: ordem de exibição (1, 2, 3...)
- `linha_campo`: agrupamento visual (mesmo valor = lado a lado)
- `tipo_ordem`: nome exato do Tipo de Ordem (múltiplos separados por vírgula = compartilhado)
- `campo_nome`: ID do campo (snake_case recomendado, kebab-case para legados)
- `campo_label`: texto visível do label
- `tipo`: `SELECT`, `TEXT`, `NUMBER`, `TEXTAREA` (converter para minúsculo no código)
- `opcoes`: opções do SELECT, separadas por vírgula
- `gatilho_campo`: campo pai (`NÃO TEM` = sem condicional)
- `gatilho_valor`: valor(es) que ativam o campo (separados por vírgula)

## Regras essenciais

### 1. Match exato do Tipo de Ordem
O `tipo_ordem` da planilha deve corresponder **exatamente** ao nome no dropdown `tipo-ordem` em `iniciaisFields`. Se divergir, **sinalizar ao usuário antes de implementar**.

### 2. Estrutura do campo
```js
{ linha: <linha_campo>, nome: "<campo_nome>", label: "<campo_label>", tipo: "<tipo_minúsculo>" }
```
- Para SELECT: adicionar `opcoes: ["OPCAO_1", "OPCAO_2", ...]`
- Não incluir manualmente o placeholder "Selecione" (sistema adiciona automaticamente)

### 3. Condicionais
- **Sem condicional** (`gatilho_campo = "NÃO TEM"`): não adicionar propriedade `condicional`
- **Condicional simples** (um valor): `condicional: { campoRef: "<campo>", valor: "<valor>" }`
- **Multi-valor** (vírgula): `condicional: { campoRef: "<campo>", valor: ["VALOR_1", "VALOR_2"] }`
- **Negado** (todos exceto um): `condicional: { campoRef: "<campo>", valor: "<valor_excluido>", negado: true }`

### 4. Campos compartilhados
Quando `tipo_ordem` contém múltiplos nomes (ex: `"TIPO_A,TIPO_B"`):
- Criar constante compartilhada: `const TIPO_AB_FIELDS = [...]`
- Declarar **antes** do `retornoFieldsByTipo`
- Ambos os tipos apontam para a mesma referência

### 5. Remoção do FIELD_DESCRICAO
Quando um Tipo de Ordem recebe campos específicos pela primeira vez:
- **Remover** o `FIELD_DESCRICAO` (placeholder do `default`)
- O novo array **não** deve incluir `FIELD_DESCRICAO` a menos que a planilha o liste

### 6. Ordenação
- Campos ordenados pela coluna `ordem` da planilha
- **Campo pai antes do filho** no array (cascata: se B depende de A, A deve vir antes)

## Comportamento automático (não implementar)

O sistema já cuida automaticamente de:
- Validação de campos visíveis (todos obrigatórios)
- Exclusão de campos ocultos de validação, email e persistência
- Limpeza automática de campos ocultos
- Persistência via `debouncedSave`
- Atualização do preview do email (normalização MAIÚSCULAS sem acentos)
- Reatividade de condicionais (listeners de `change`)

**Não implementar lógica customizada** para esses comportamentos.

## Checklist de implementação

### Antes
- [ ] Conferir se `tipo_ordem` da planilha existe exatamente em `iniciaisFields`
- [ ] Identificar tipos compartilhados → definir constante
- [ ] Verificar se tipos usam `default` (FIELD_DESCRICAO) → planejar remoção
- [ ] Identificar condicionais negados (todos exceto um) → usar `negado: true`

### Durante
- [ ] Campos ordenados pela coluna `ordem`
- [ ] Campo pai antes do filho (cascata)
- [ ] Tipos em minúsculo (`SELECT` → `select`)
- [ ] `linha` conforme `linha_campo`
- [ ] `opcoes` como array de strings
- [ ] `condicional` com `campoRef`, `valor` e `negado` quando aplicável
- [ ] Constantes compartilhadas antes do `retornoFieldsByTipo`
- [ ] `FIELD_DESCRICAO` removido dos tipos que receberam campos

### Após
- [ ] Rodar `npm test` — todos os testes devem passar
- [ ] Atualizar `CACHE_NAME` no `sw.js`
- [ ] Adicionar testes em `tests/fields.test.js` (estrutura, contagem, propriedades)
- [ ] Adicionar testes em `tests/retornos.test.js` (renderização, condicionais)
- [ ] Adicionar testes em `tests/email.test.js` se impacta composição do email
- [ ] Verificar match exato entre planilha e código
- [ ] Confirmar que nenhum campo compartilha referência indevidamente

## Situações a evitar

- ❌ Adicionar campos sem remover `FIELD_DESCRICAO`
- ❌ Nomes de campo duplicados no mesmo array
- ❌ Campo condicional antes do campo pai
- ❌ Compartilhar constante entre tipos com campos diferentes
- ❌ Incluir "Selecione" manualmente nas opções
- ❌ Implementar validação/persistência/reactividade customizada
- ❌ Alterar `retornos.js`, `validation.js`, `email.js` ou `persistence.js` — apenas `fields.js` e testes

## Spec completo

Para detalhes completos, exemplos práticos e explicações estendidas, leia:
`docs/superpowers/specs/2026-06-11-retorno-fields-guide-design.md`

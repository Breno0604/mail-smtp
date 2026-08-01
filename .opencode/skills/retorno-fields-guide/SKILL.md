---
name: retorno-fields-guide
description: Use quando o usuário solicitar adicionar, modificar, ou criar campos de retorno em um Tipo de Ordem EXISTENTE. Sintomas: 'campos de retorno', 'novos campos', menção à planilha dados_projeto/tipos_ordem_template.xlsx. Para NOVO tipo de ordem, use order-types-guide.
---

# Guia de Campos de Retorno

## Quando usar

Use esta skill quando:

- O usuário solicitar adição de novos campos de retorno a um Tipo de Ordem
- O usuário mencionar a planilha `dados_projeto/tipos_ordem_template.xlsx` (aba `corte`)
- A tarefa envolver modificar o arquivo `scripts/data/fields-data.js` para adicionar campos
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
- [ ] Confirmar que o Husky bumpou `CACHE_NAME` no `sw.js` (automático no pre-commit)
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
- ❌ Alterar `retornos.js`, `validation.js`, `email.js` ou `persistence.js` — exceto `retorno-templates.js` quando necessário para templates de email

## Arquitetura do Sistema de Retorno

O fluxo completo de renderização e coleta dos campos de retorno é:

```
scripts/fields.js  →  scripts/retornos.js  →  scripts/collectors.js  →  state → email.js
(definição)          (renderização DOM)      (coleta dados)           (composição)
```

1. **`scripts/fields.js`** — Define `iniciaisFields` (com `tipo-ordem` dropdown) e `retornoFieldsByTipo` (mapeamento tipo → array de campos)
2. **`scripts/retornos.js`** — `renderRetorno()` usa `getRetornoFields(tipo)` + `agruparPorLinha()` para renderizar campos; `updateConditionalFields()` gerencia visibilidade condicional
3. **`scripts/collectors.js`** — `collectRetorno()` percorre apenas campos visíveis (`display !== 'none'`) e coleta para o state
4. **`scripts/email.js`** — `composeEmail()` primeiro tenta `applyRetornoTemplate(tipo, data)`; se não houver template, faz fallback iterando `getRetornoFields(tipo)` campo a campo
5. **`scripts/validation.js`** — Valida apenas campos visíveis (pula grupos com `display: none`)

### Renderização de layout (agruparPorLinha)

Campos com mesmo valor de `linha` são renderizados lado a lado em um container `flex`. O agrupamento é feito pela função `agruparPorLinha()` em `retornos.js`:

```js
// Exemplo: linha 3 → ramal e medicao lado a lado
{ linha: 3, nome: "ramal", label: "Ramal", ... },
{ linha: 3, nome: "medicao", label: "Medição", ... },
```

Campos que omitem `linha` recebem fallback para sua posição no array (cada um em linha própria).

### Sistema de condicionais (updateConditionalFields)

A função `updateConditionalFields()` em `retornos.js`:

1. Para cada campo com `condicional`, localiza o elemento de controle (`campoRef`)
2. Se o controle não tem valor selecionado (placeholder "Selecione"), o campo permanece oculto
3. Compara o valor do controle com `condicional.valor` (array ou string)
4. Se `condicional.negado === true`, inverte a lógica (mostra quando NÃO corresponde)
5. Campos ocultos têm seu valor limpo automaticamente

### Sistema de templates de email (retorno-templates.js)

`retorno-templates.js` mapeia cada Tipo de Ordem para um template declarativo que controla o corpo do email:

```
retornoFieldsByTipo (fields-data.js)  →  retornoTemplates (retorno-templates.js)  →  composeEmail (email.js)
(definição dos campos)                   (template do email)                          (composição final)
```

- `applyRetornoTemplate(tipo, data)` resolve placeholders de `{campo}` usando `data.retorno`
- Se há template customizado para o tipo, ele é usado (substitui o fallback campo-a-campo)
- Se não há template, `composeEmail()` itera `getRetornoFields(tipo)` e inclui cada campo no email
- Para campos novos que devem aparecer no email, criar ou atualizar o template em `retorno-templates.js`
- `DESCRICAO_TEMPLATE` é o template padrão para tipos que só têm `FIELD_DESCRICAO`

## Panorama completo dos Tipos de Ordem

Todos os 43 tipos de ordem definidos em `iniciaisFields` (dropdown `tipo-ordem`) e seu status de implementação em `retornoFieldsByTipo`:

### Tipos com campos de retorno implementados (12)

| #   | Tipo de Ordem                        | Constante                | Campos | Condicionais |
| --- | ------------------------------------ | ------------------------ | ------ | ------------ |
| 1   | INSPECAO UC CORTADA I15              | `UC_CORTADA_FIELDS`      | 8      | sim          |
| 2   | INSPECAO UC CORTADA I30              | `UC_CORTADA_FIELDS`      | 8      | sim          |
| 3   | INSPECAO UC CORTADA I90              | `UC_CORTADA_FIELDS`      | 8      | sim          |
| 4   | INSPECAO UC CORTADA I180             | `UC_CORTADA_FIELDS`      | 8      | sim          |
| 5   | CORTE POR FALTA DE PAGAMENTO         | inline                   | 2      | não          |
| 6   | DESLIG.PROG.MANUTENÇÃO               | inline                   | 3      | negado       |
| 7   | LIGACAO NOVA MEDIA TENSAO            | `LIGACAO_NOVA_MT_FIELDS` | 11     | sim          |
| 8   | LIGACAO NOVA MT - CLIENTE LIVRE      | `LIGACAO_NOVA_MT_FIELDS` | 11     | sim          |
| 9   | TELEMEDIÇÃO MANUTENÇÃO               | `TELEMEDICAO_FIELDS`     | 6      | sim          |
| 10  | TELEMEDIÇÃO MANUTENÇÃO CLIENTE LIVRE | `TELEMEDICAO_FIELDS`     | 6      | sim          |
| 11  | TELEMEDIÇÃO MANUTENÇÃO LOTE          | `TELEMEDICAO_FIELDS`     | 6      | sim          |
| 12  | CORTE DE UC POR DEF TECNICO          | inline                   | 4      | sim          |

### Tipos usando `FIELD_DESCRICAO` (31)

| #   | Tipo de Ordem                      | Nota                               |
| --- | ---------------------------------- | ---------------------------------- |
| 1   | ADEQUACAO SMF                      |                                    |
| 2   | AFERIÇÃO DE MEDIDOR                |                                    |
| 3   | AFERIÇÃO MEDIDOR CLIENTE LIVRE     |                                    |
| 4   | COLHER LEITURA                     |                                    |
| 5   | CORTE DEFINITIVO A PEDIDO          |                                    |
| 6   | DESLOCAMENTO DE SUBESTAÇÃO         |                                    |
| 7   | DISPON. SAIDA SERIAL MEDIDOR       |                                    |
| 8   | EXECUÇÃO DE MUDANÇA DE TARIFA      |                                    |
| 9   | EXECUCAO DO ACRESCIMO DE POTENCIA  |                                    |
| 10  | EXECUCAO DO DECRESCIMO DE POTENCIA |                                    |
| 11  | GRANDES CLIENTES SEM MEDIÇÃO       |                                    |
| 12  | GRANDES CLIENTES SELO ROMPIDO      | simplificado para descrição apenas |
| 13  | INSTALACAO DO DISPLAY              | simplificado para descrição apenas |
| 14  | LIBERAÇÃO DE PULSO                 |                                    |
| 15  | LIGAÇÃO NOVA ISOLADA               |                                    |
| 16  | LIGAÇÃO NOVA SIMULTÂNEA            |                                    |
| 17  | RELIGACAO NORMAL RURAL             |                                    |
| 18  | RELIGAÇÃO NORMAL URBANA            |                                    |
| 19  | RESELAR MEDICAO                    |                                    |
| 20  | RESSERVICO                         |                                    |
| 21  | RETIRAR EQUIPAMENTOS               |                                    |
| 22  | RETIRAR RAMAL                      |                                    |
| 23  | SERVIÇO ESPECIAL OPERAÇÃO GRUPO A  |                                    |
| 24  | SUBST. DE EQUIPAMENTO DE MEDICAO   |                                    |
| 25  | SUBST. MEDIDOR A PEDIDO            |                                    |
| 26  | SUBST. MEDIDOR INICIATIVA COELCE   |                                    |
| 27  | SUBSTITUIÇÃO DA BATERIA DO MEDIDOR |                                    |
| 28  | SUBSTITUIÇÃO DE DISPLAY            | simplificado para descrição apenas |
| 29  | VISITA TECNICA GRUPO A             |                                    |
| 30  | VISTORIA DA UC                     |                                    |
| 31  | VISTORIA GERAÇÃO DISTRIBUIDA       |                                    |

## Pontos de Atenção

### Atenção 1: Match exato de nomes

Os nomes em `retornoFieldsByTipo` devem corresponder **exatamente** aos valores do dropdown `tipo-ordem` em `iniciaisFields`. Diferenças sutis de acentuação quebram o match:

- `"INSPECAO UC CORTADA I15"` (sem acento) ≠ `"EXECUÇÃO DE MUDANÇA DE TARIFA"` (com acento)
- `"LIGACAO NOVA MEDIA TENSAO"` (sem acento) ≠ `"LIGAÇÃO NOVA SIMULTÂNEA"` (com acento)
- `"AFERIÇÃO DE MEDIDOR"` (com acento) ≠ `"EXECUCAO DO ACRESCIMO DE POTENCIA"` (sem acento)

### Atenção 2: Ordem de campos condicionais em cascata

O campo pai deve vir **antes** do filho no array. Exemplo de cascata em `AFERICAO_MEDIDOR_FIELDS`:

```
medidor_afericao → leitura_afericao → motivo_nao_colher
                 → toi_afericao → numero_toi
                                → porque_nao_aplicado_toi
```

### Atenção 3: Negado vs. Multi-valor

- Use `negado: true` quando o campo deve aparecer para **todos exceto** um valor específico
- Use `valor: ["VAL1", "VAL2"]` (array) para múltiplos valores que ativam o campo
- Exemplo real: `DESLIG.PROG.MANUTENÇÃO` → campo `acesso_desligamento` aparece quando `desligamento` é qualquer valor exceto `"DESLIGAMENTO EXECUTADO"` — usa `negado: true` em vez de listar 4 valores

### Atenção 4: Consistência de nomenclatura de field names

O codebase atualmente mistura:

- `kebab-case`: `situacao-cliente`, `aplicado-toi`, `tipo-servico`
- `snake_case`: `situacao_corte`, `medidor_afericao`, `retorno_ligacao`
- Manter o padrão existente para cada grupo de campos, evitando misturar no mesmo array

### Atenção 5: Registro de `linha`

- Campos que ficam sozinhos na linha podem omitir `linha` (fallback para posição no array)
- Mas é mais seguro incluir `linha` explicitamente seguindo a coluna `linha_campo` da planilha
- Todos os campos na mesma `linha` devem ter o mesmo valor numérico

### Atenção 6: Registro de `obrigatorio`

- Campos de retorno **não** usam a propriedade `obrigatorio` — todos são obrigatórios por padrão
- A validação em `validation.js` trata todos os campos visíveis como obrigatórios
- Não incluir `obrigatorio: true` nos campos de retorno

### Atenção 7: Atualização do CACHE_NAME

Após adicionar campos estáticos, o `CACHE_NAME` no `sw.js` é atualizado automaticamente pelo hook do Husky quando arquivos JS/CSS/HTML são modificados.

### Atenção 8: Tipos que compartilham constantes

Ao implementar um tipo que pode compartilhar campos com outro existente, verificar:

- Se os campos são **exatamente iguais** → usar a mesma constante (ex: `UC_CORTADA_FIELDS`)
- Se os campos são **diferentes** → criar array separado (ex: `SUBST. MEDIDOR A PEDIDO` e `SUBST. MEDIDOR INICIATIVA COELCE` podem ser diferentes)

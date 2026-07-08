# Guia de Regras para Adição de Campos de Retorno

## Contexto

Este guia define regras e boas práticas para adicionar novos campos de retorno aos Tipos de Ordem do sistema Mail MVP. O público-alvo é o desenvolvedor humano e agentes de IA que implementam os campos com base na planilha de especificação.

**Fluxo de trabalho**: O desenvolvedor preenche a planilha `dados_projeto/tipos_ordem_template.xlsx` (aba `corte`) → o agente de IA implementa o código com base neste guia.

---

## Seção 1 — Contrato de Entrada (Planilha)

A planilha `dados_projeto/tipos_ordem_template.xlsx`, aba `corte`, é a **única fonte de verdade** para definir campos de retorno. Cada linha representa um campo. As colunas são:

| Coluna           | Obrigatória | Descrição                                                                                  |
| ---------------- | ----------- | ------------------------------------------------------------------------------------------ |
| `ordem`          | Sim         | Ordem de exibição do campo dentro do tipo (1, 2, 3...)                                     |
| `linha_campo`    | Sim         | Agrupamento visual: campos com mesmo `linha_campo` ficam lado a lado                       |
| `tipo_ordem`     | Sim         | Nome exato do Tipo de Ordem. Múltiplos tipos separados por vírgula = campos compartilhados |
| `campo_nome`     | Sim         | ID do campo no código (snake_case)                                                         |
| `campo_label`    | Sim         | Texto visível do label                                                                     |
| `tipo`           | Sim         | `SELECT`, `TEXT`, `NUMBER`, `TEXTAREA`                                                     |
| `opcoes`         | Condicional | Opções do SELECT, separadas por vírgula. Obrigatório quando `tipo = SELECT`                |
| `inicia_visivel` | Sim         | `SIM` ou `NAO`. Define se o campo aparece imediatamente ou depende de gatilho              |
| `gatilho_campo`  | Condicional | Nome do campo pai. `NÃO TEM` = sem condicional                                             |
| `gatilho_valor`  | Condicional | Valor(es) que ativam o campo. Separados por vírgula para múltiplos valores                 |
| `placeholder`    | Não         | Placeholder do input. `NÃO TEM` = sem placeholder customizado                              |

**Regra fundamental**: O valor em `tipo_ordem` deve corresponder **exatamente** ao nome que existe no dropdown de `iniciaisFields` em `fields.js` (incluindo acentos e espaços).

---

## Seção 2 — Regras de Mapeamento (Planilha → Código)

### 2.1 — Estrutura do campo no código

Cada linha da planilha gera um objeto no array do tipo correspondente em `retornoFieldsByTipo`:

```js
{ linha: <linha_campo>, nome: "<campo_nome>", label: "<campo_label>", tipo: "<tipo em minúsculo>" }
```

**Conversões obrigatórias**:

- `tipo` da planilha vem em MAIÚSCULAS → no código deve ser minúsculo: `SELECT` → `select`, `TEXT` → `text`, `NUMBER` → `number`, `TEXTAREA` → `textarea`
- `linha_campo` → propriedade `linha` (número inteiro)

### 2.2 — Campos SELECT

Quando `tipo = SELECT`, o objeto deve incluir `opcoes`:

```js
opcoes: ["OPCAO_1", "OPCAO_2", ...]
```

- As opções vêm da coluna `opcoes` da planilha, separadas por vírgula
- Manter exatamente como escrito na planilha (MAIÚSCULAS, acentos, espaços)
- O sistema adiciona automaticamente o placeholder "Selecione" como primeira opção — **não** incluir manualmente

### 2.3 — Campos sem condicional

Quando `gatilho_campo = "NÃO TEM"`:

- O campo **não** deve ter propriedade `condicional`
- O campo **não** deve ter `display: none` inicial
- Aparece visível desde o render

### 2.4 — Campos com condicional simples

Quando `gatilho_campo` aponta para um campo existente e `gatilho_valor` contém um único valor:

```js
condicional: { campoRef: "<gatilho_campo>", valor: "<gatilho_valor>" }
```

### 2.5 — Campos com condicional multi-valor

Quando `gatilho_valor` contém múltiplos valores separados por vírgula:

```js
condicional: { campoRef: "<gatilho_campo>", valor: ["VALOR_1", "VALOR_2", ...] }
```

### 2.6 — Campos com condicional negado

Quando o campo deve aparecer para **todos os valores exceto** um específico:

- Identificar quando o `gatilho_valor` lista todos os valores possíveis do campo pai **exceto um**
- Nesse caso, inverter para `negado: true` com o valor excluído:

```js
condicional: { campoRef: "<campo_pai>", valor: "<valor_excluido>", negado: true }
```

**Exemplo real**: `DESLIG.PROG.MANUTENÇÃO` → campo `acesso_desligamento` aparece quando `desligamento` é qualquer valor **exceto** "DESLIGAMENTO EXECUTADO". Em vez de listar 4 valores, usa-se `negado: true` com o valor excluído.

### 2.7 — Campos compartilhados entre tipos

Quando `tipo_ordem` contém múltiplos nomes separados por vírgula (ex: `"LIGACAO NOVA MEDIA TENSAO,LIGACAO NOVA MT - CLIENTE LIVRE"`):

- Criar uma **constante compartilhada** (ex: `LIGACAO_NOVA_MT_FIELDS`) antes do `retornoFieldsByTipo`
- Ambos os tipos apontam para a **mesma referência** no objeto:

```js
const LIGACAO_NOVA_MT_FIELDS = [ ... ];
// ...
"LIGACAO NOVA MEDIA TENSAO": LIGACAO_NOVA_MT_FIELDS,
"LIGACAO NOVA MT - CLIENTE LIVRE": LIGACAO_NOVA_MT_FIELDS,
```

### 2.8 — Remoção do FIELD_DESCRICAO

Quando um Tipo de Ordem recebe campos específicos pela primeira vez:

- O `FIELD_DESCRICAO` (que existia como placeholder no `default`) **deve ser removido**
- O novo array de campos **não** deve incluir `FIELD_DESCRICAO` a menos que a planilha o liste explicitamente

### 2.9 — Ordenação dos campos

- Os campos devem aparecer no array na ordem definida pela coluna `ordem` da planilha
- Campos com condicional em cascata (campo filho depende de campo pai) devem respeitar a ordem: **pai antes do filho** no array. Exemplo: se C depende de A, e A depende de B, a ordem no array deve ser: B, A, C.

---

## Seção 3 — Validações e Comportamento Automático

### 3.1 — Validação de campos visíveis

Todos os campos de retorno visíveis são **automaticamente obrigatórios**. O sistema já implementa isso em `validateSection3`:

- Itera sobre todos os `[data-field-nome]` dentro de `DOM.retornoCampos`
- Pula campos com `display: none` (condicionais ocultos)
- Marca erro "Campo obrigatório" se o valor estiver vazio

**Regra**: Não é necessário adicionar lógica de validação customizada para novos campos. O comportamento padrão já cobre 100% dos casos.

### 3.2 — Validação de campos ocultos

Campos condicionais ocultos (`display: none`) são **automaticamente excluídos** de:

- Validação (`validateSection3` pula)
- Coleta de dados (`getRetornoData` filtra)
- Composição do email (`composeEmail` verifica se o campo existe em `data.retorno`)
- Persistência (salva apenas o que `getRetornoData` retorna)

**Regra**: Não implementar lógica adicional para excluir campos ocultos. O sistema já faz isso em múltiplas camadas.

### 3.3 — Limpeza automática de campos ocultos

Quando um campo condicional é ocultado (porque o valor do campo pai mudou), o sistema **automaticamente limpa** o valor do input:

```js
// retornos.js, linha 117
if (input) input.value = '';
```

**Regra**: Não implementar lógica customizada de limpeza. O comportamento padrão já garante que campos ocultos não retenham valores antigos.

### 3.4 — Persistência automática

O sistema salva o estado automaticamente via `debouncedSave` (1 segundo após a última interação). Novos campos são automaticamente incluídos porque:

- `saveState` chama `getRetornoData()` que lê todos os campos visíveis do DOM
- `restore.js` chama `setRetornoData()` que restaura valores por `nome` do campo

**Regra**: Não implementar lógica customizada de persistência. Novos campos são automaticamente salvos e restaurados.

### 3.5 — Atualização do preview do email

O preview do email (`updateLivePreview`) chama `composeEmail` que:

- Lê os campos de retorno via `getRetornoFields(tipo)`
- Para cada campo, verifica se existe em `data.retorno`
- Formata como `LABEL: VALOR` (MAIÚSCULAS, sem acentos)

**Regra**: Não implementar lógica customizada de formatação de email. O sistema já normaliza automaticamente.

### 3.6 — Condicionais em cascata

Quando um campo B depende de um campo A que depende de um campo C:

- A ordem no array deve ser: C → A → B
- O sistema já gerencia cascata automaticamente via `updateConditionalFields`
- Cada campo pai deve ter um listener de `change` que chama `updateConditionalFields`

**Regra**: Garantir que a ordem no array respeite a dependência (pai antes do filho). Não implementar lógica customizada de cascata.

### 3.7 — Reatividade automática

Quando um campo com dependentes muda de valor:

- O sistema automaticamente chama `updateConditionalFields` (via listener de `change` adicionado em `renderRetorno`)
- Campos filhos são mostrados/ocultados conforme o valor do pai

**Regra**: Não adicionar listeners customizados. O sistema já gerencia reatividade.

---

## Seção 4 — Padronização e Convenções de Nomenclatura

### 4.1 — Nome do campo (`campo_nome`)

- Padrão recomendado: **snake_case** (palavras em minúsculas separadas por underscore)
- Exemplos: `situacao_corte`, `retorno_ligacao`, `medidor_bt`, `qtd_medidor_bt`
- Nota: Campos legados podem usar kebab-case (ex: `aplicado-toi`, `situacao-cliente`). Para novos campos, usar snake_case.
- Deve ser descritivo e autoexplicativo — o nome é usado como `id` no DOM e como chave no objeto de dados
- Evitar abreviações obscuras. Se precisar abreviar, usar convenções consolidadas (ex: `qtd` para quantidade, `subst` para substituição)

### 4.2 — Label do campo (`campo_label`)

- Usar **Português**, com acentuação correta
- Capitalização tipo frase: apenas a primeira letra maiúscula, exceto nomes próprios ou siglas
- Exemplos: "Situação", "Ponto de Entrega", "Medidor de BT", "Descreva o Problema"
- O label é usado no `<label>`, no placeholder do input e no email (normalizado para MAIÚSCULAS sem acentos)

### 4.3 — Opções de SELECT (`opcoes`)

- Usar **MAIÚSCULAS** consistentemente
- Sem acentos nas opções (o email normaliza, mas a consistência visual importa)
- Separadas por vírgula na planilha
- Exemplos: `"SIM,NAO"`, `"CONCLUIDA,NAO CONCLUIDA"`, `"REGULAR,IRREGULAR,SEM ACESSO"`
- Para respostas booleanas, padronizar como `"SIM,NAO"` (não usar `"SIM,NÃO"` nas opções)

### 4.4 — Tipos de Ordem como chaves

- As chaves em `retornoFieldsByTipo` devem corresponder **exatamente** aos valores no dropdown `tipo-ordem` em `iniciaisFields`
- Isso inclui acentos, espaços e caracteres especiais (ex: `"DESLIG.PROG.MANUTENÇÃO"`, `"LIGACAO NOVA MT - CLIENTE LIVRE"`)
- Se o nome na planilha divergir do nome no dropdown, **corrigir** para que ambos matchem antes de implementar

### 4.5 — Nomes de constantes compartilhadas

Quando múltiplos tipos compartilham campos, a constante deve seguir o padrão:

- MAIÚSCULAS com underscore
- Baseada no conceito comum dos tipos, não no nome de um tipo específico
- Exemplos: `UC_CORTADA_FIELDS`, `LIGACAO_NOVA_MT_FIELDS`
- Declarar **antes** do `retornoFieldsByTipo` no arquivo `fields.js`

### 4.6 — Tipos de input disponíveis

| Tipo na planilha | Tipo no código | Criador               | Uso                               |
| ---------------- | -------------- | --------------------- | --------------------------------- |
| `SELECT`         | `select`       | `createSelectInput`   | Lista fixa de opções              |
| `TEXT`           | `text`         | `createTextInput`     | Texto livre curto                 |
| `NUMBER`         | `number`       | `createNumberInput`   | Apenas números (teclado numérico) |
| `TEXTAREA`       | `textarea`     | `createTextareaInput` | Texto livre longo                 |

**Regra**: Usar apenas esses 4 tipos. Se surgir necessidade de um tipo novo (ex: `date`, `checkbox`), isso deve ser discutido e implementado como novo `INPUT_CREATORS`, não como caso especial dentro de um campo.

---

## Seção 5 — Pontos de Atenção e Armadilhas

### 5.1 — Match exato do Tipo de Ordem

**Erro comum**: A planilha contém `"DESLI.PROG.MANUTENÇÃO"` mas o dropdown em `iniciaisFields` contém `"DESLIG.PROG.MANUTENÇÃO"` (com o G).

**Regra**: Antes de implementar, **sempre** conferir se o `tipo_ordem` da planilha existe exatamente como está no array `opcoes` do campo `tipo-ordem` em `iniciaisFields`. Se divergir, sinalizar ao usuário antes de prosseguir.

### 5.2 — Ordem dos campos no array vs. ordem visual

A coluna `ordem` da planilha define a sequência dos campos no array. A coluna `linha_campo` define o agrupamento visual. São conceitos independentes:

- Dois campos com `linha_campo = 2` ficam lado a lado, mas a `ordem` define qual aparece primeiro dentro da linha
- Campos sem `linha` definida ficam cada um em sua própria linha

**Armadilha**: Inverter `ordem` e `linha_campo`. São conceitos distintos.

### 5.3 — Campo pai deve existir antes do campo filho

O campo referenciado em `gatilho_campo` deve aparecer **antes** no array que o campo dependente. O sistema avalia condicionais na ordem do array — se o pai ainda não existe, o gatilho não funciona.

**Armadilha**: Colocar um campo condicional antes do seu campo pai no array. Sempre validar a ordem antes de submeter.

### 5.4 — Condicionais em cascata profunda

Quando A → B → C (C depende de B que depende de A):

- A ordem no array deve ser: A, B, C
- Todos os três devem ter listener de `change` se tiverem dependentes
- O sistema já gerencia isso, mas a **ordem** é responsabilidade de quem define os campos

**Armadilha**: Colocar C antes de B no array. O campo C nunca será exibido corretamente.

### 5.5 — Campo compartilhado com gatilho

Quando dois tipos compartilham campos (ex: `LIGACAO_NOVA_MT_FIELDS`), mas um campo tem `gatilho_campo` que referencia um campo **interno** ao grupo compartilhado — isso funciona normalmente.

Porém, se o gatilho referencia um campo que **não está no grupo compartilhado** (ex: um campo de outro tipo), isso é um erro de modelagem.

**Regra**: `gatilho_campo` deve sempre referenciar um campo que está **no mesmo array** de campos.

### 5.6 — Não duplicar campos entre tipos

Se dois tipos de ordem precisam de campos semelhantes mas não idênticos, **não** compartilhar a constante. Criar arrays separados.

**Armadilha**: Compartilhar uma constante e depois modificar para um tipo, quebrando o outro. Se os campos são diferentes, devem ser arrays diferentes.

### 5.7 — Campo NUMBER e validação

Campos do tipo `number` usam `inputMode="numeric"` e `pattern="[0-9]*"`. O sistema não faz validação de range (mínimo/máximo). Se um campo precisa de validação específica (ex: quantidade entre 1 e 100), isso deve ser sinalizado explicitamente — hoje não há suporte nativo para isso.

### 5.8 — Placeholder

A coluna `placeholder` da planilha é **informativa**, não implementada automaticamente. O sistema usa o `label` como placeholder por padrão (`input.placeholder = field.label` em `retornos.js`). Para implementar um placeholder customizado, seria necessário adicionar a propriedade `placeholder` ao schema do campo e ajustar `retornos.js`.

**Regra atual**: Ignorar a coluna `placeholder` da planilha. O label é usado como placeholder automaticamente.

### 5.9 — Campo `descricao` (FIELD_DESCRICAO)

Se a planilha **não** listar um campo de descrição para um Tipo de Ordem, o array resultante **não** deve incluir `FIELD_DESCRICAO`. A ausência de descrição na planilha significa que aquele tipo não precisa de campo de texto livre.

---

## Seção 6 — Exemplos Práticos

### 6.1 — Exemplo simples: campo único sem condicional

**Planilha**:

```
tipo_ordem: CORTE POR FALTA DE PAGAMENTO
campo_nome: situacao_corte
campo_label: Situação
tipo: SELECT
opcoes: CLIENTE CORTADO,CLIENTE VISITADO CONTA PAGA,CLIENTE NAO PERMITIU O CORTE,SEM ACESSO PARA EXECUTAR O CORTE
linha_campo: 1
gatilho_campo: NÃO TEM
```

**Código gerado**:

```js
"CORTE POR FALTA DE PAGAMENTO": [
  { linha: 1, nome: "situacao_corte", label: "Situação", tipo: "select", opcoes: ["CLIENTE CORTADO", "CLIENTE VISITADO CONTA PAGA", "CLIENTE NAO PERMITIU O CORTE", "SEM ACESSO PARA EXECUTAR O CORTE"] },
],
```

### 6.2 — Exemplo com condicional simples

**Planilha**:

```
tipo_ordem: INSPECAO UC CORTADA I15
campo_nome: aplicado-toi
campo_label: Aplicado TOI
tipo: SELECT
opcoes: SIM,NAO
linha_campo: 5
gatilho_campo: NÃO TEM

campo_nome: toi
campo_label: TOI
tipo: TEXT
linha_campo: 5
gatilho_campo: aplicado-toi
gatilho_valor: SIM
```

**Código gerado**:

```js
{ linha: 5, nome: "aplicado-toi", label: "Aplicado TOI", tipo: "select", opcoes: ["SIM", "NAO"] },
{ linha: 5, nome: "toi", label: "TOI", tipo: "text", condicional: { campoRef: "aplicado-toi", valor: "SIM" } },
```

### 6.3 — Exemplo com condicional multi-valor

**Planilha**:

```
tipo_ordem: LIGACAO NOVA MEDIA TENSAO,LIGACAO NOVA MT - CLIENTE LIVRE
campo_nome: obra
campo_label: Obra
tipo: SELECT
opcoes: CONCLUIDA,NAO CONCLUIDA
linha_campo: 2
gatilho_campo: retorno_ligacao
gatilho_valor: VISTORIA, VISTORIA + LIGAÇÃO
```

**Código gerado**:

```js
{ linha: 2, nome: "obra", label: "Obra", tipo: "select", opcoes: ["CONCLUIDA", "NAO CONCLUIDA"], condicional: { campoRef: "retorno_ligacao", valor: ["VISTORIA", "VISTORIA + LIGAÇÃO"] } },
```

### 6.4 — Exemplo com condicional negado

**Planilha**:

```
tipo_ordem: DESLIG.PROG.MANUTENÇÃO
campo_nome: desligamento
campo_label: Desligamento
tipo: SELECT
opcoes: DESLIGAMENTO EXECUTADO,CLIENTE CANCELOU DESLIGAMENTO,SEM ACESSO,NAO EXECUTADO PENDENCIA CLIENTE,NAO EXECUTADO PENDENCIA ENEL
linha_campo: 1
gatilho_campo: NÃO TEM

campo_nome: acesso_desligamento
campo_label: Descreva o Problema
tipo: TEXT
linha_campo: 2
gatilho_campo: desligamento
gatilho_valor: CLIENTE CANCELOU DESLIGAMENTO,SEM ACESSO,NAO EXECUTADO PENDENCIA CLIENTE,NAO EXECUTADO PENDENCIA ENEL
```

**Análise**: O campo `acesso_desligamento` aparece para 4 dos 5 valores possíveis de `desligamento`. Isso é um caso de **condicional negado** — em vez de listar 4 valores, usa-se `negado: true` com o valor excluído.

**Código gerado**:

```js
{ linha: 1, nome: "desligamento", label: "Desligamento", tipo: "select", opcoes: ["DESLIGAMENTO EXECUTADO", "CLIENTE CANCELOU DESLIGAMENTO", "SEM ACESSO", "NAO EXECUTADO PENDENCIA CLIENTE", "NAO EXECUTADO PENDENCIA ENEL"] },
{ linha: 2, nome: "acesso_desligamento", label: "Descreva o Problema", tipo: "text", condicional: { campoRef: "desligamento", valor: "DESLIGAMENTO EXECUTADO", negado: true } },
```

### 6.5 — Exemplo com campos compartilhados e cascata

**Planilha** (trecho):

```
tipo_ordem: LIGACAO NOVA MEDIA TENSAO,LIGACAO NOVA MT - CLIENTE LIVRE
campo_nome: retorno_ligacao
linha_campo: 1
gatilho_campo: NÃO TEM

campo_nome: medidor_bt
linha_campo: 4
gatilho_campo: retorno_ligacao
gatilho_valor: VISTORIA, VISTORIA + LIGAÇÃO

campo_nome: qtd_medidor_bt
linha_campo: 4
gatilho_campo: medidor_bt
gatilho_valor: COM MEDIDOR BT
```

**Código gerado**:

```js
const LIGACAO_NOVA_MT_FIELDS = [
  { linha: 1, nome: "retorno_ligacao", label: "Executado", tipo: "select", opcoes: ["VISTORIA", "VISTORIA + LIGAÇÃO", "LIGAÇÃO"] },
  // ... outros campos ...
  { linha: 4, nome: "medidor_bt", label: "Medidor de BT", tipo: "select", opcoes: ["COM MEDIDOR BT", "SEM MEDIDOR BT"], condicional: { campoRef: "retorno_ligacao", valor: ["VISTORIA", "VISTORIA + LIGAÇÃO"] } },
  { linha: 4, nome: "qtd_medidor_bt", label: "Quantidade", tipo: "number", condicional: { campoRef: "medidor_bt", valor: "COM MEDIDOR BT" } },
];

"LIGACAO NOVA MEDIA TENSAO": LIGACAO_NOVA_MT_FIELDS,
"LIGACAO NOVA MT - CLIENTE LIVRE": LIGACAO_NOVA_MT_FIELDS,
```

**Nota**: `qtd_medidor_bt` depende de `medidor_bt` que depende de `retorno_ligacao`. A ordem no array respeita a cascata: `retorno_ligacao` → `medidor_bt` → `qtd_medidor_bt`.

---

## Seção 7 — Checklist de Implementação

Toda vez que novos campos forem adicionados, a IA deve executar este checklist antes de considerar a tarefa completa:

### 7.1 — Antes de implementar

- [ ] Conferir se todos os `tipo_ordem` da planilha existem **exatamente** no dropdown `tipo-ordem` em `iniciaisFields`. Se divergir, sinalizar ao usuário.
- [ ] Identificar se existem tipos que compartilham os mesmos campos → definir constante compartilhada.
- [ ] Verificar se algum dos tipos afetados usa atualmente o `default` (FIELD_DESCRICAO) → planejar remoção.
- [ ] Identificar condicionais negados: quando o `gatilho_valor` lista todos os valores do pai exceto um, usar `negado: true`.

### 7.2 — Durante a implementação

- [ ] Campos ordenados pela coluna `ordem` da planilha.
- [ ] Campo pai aparece **antes** do campo filho no array (cascata).
- [ ] Tipos convertidos para minúsculo (`SELECT` → `select`).
- [ ] `linha` definida conforme `linha_campo`.
- [ ] `opcoes` como array de strings para campos `select`.
- [ ] `condicional` com `campoRef`, `valor` (string ou array) e `negado` quando aplicável.
- [ ] Constantes compartilhadas declaradas **antes** do `retornoFieldsByTipo`.
- [ ] `FIELD_DESCRICAO` removido dos tipos que receberam campos específicos.

### 7.3 — Após a implementação

- [ ] Rodar `npm test` — todos os testes devem passar.
- [ ] Atualizar `CACHE_NAME` no `sw.js` (assets estáticos mudaram).
- [ ] Adicionar testes unitários para os novos campos em `tests/fields.test.js` (estrutura, contagem, propriedades).
- [ ] Adicionar testes em `tests/retornos.test.js` (renderização, condicionais, getRetornoData, setRetornoData).
- [ ] Adicionar testes em `tests/email.test.js` se o tipo impacta a composição do email.
- [ ] Verificar que o `tipo_ordem` no código e na planilha estão idênticos.
- [ ] Confirmar que nenhum campo compartilha referência com outro tipo indevidamente.

### 7.4 — Situações que devem ser evitadas

- ❌ Adicionar campos sem remover o `FIELD_DESCRICAO` do tipo.
- ❌ Usar nomes de campo duplicados dentro do mesmo array de tipo.
- ❌ Colocar um campo condicional antes do seu campo pai no array.
- ❌ Compartilhar uma constante entre tipos que têm campos ligeiramente diferentes.
- ❌ Incluir manualmente o placeholder "Selecione" nas opções de um SELECT.
- ❌ Implementar validação customizada quando a validação padrão já cobre o caso.
- ❌ Implementar lógica de persistência, limpeza ou reatividade customizada — o sistema já cuida disso.
- ❌ Alterar `retornos.js`, `validation.js`, `email.js` ou `persistence.js` para adicionar campos — apenas `fields.js` e testes devem mudar.

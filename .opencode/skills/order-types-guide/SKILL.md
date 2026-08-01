---
name: order-types-guide
description: Use quando o usuário solicitar adicionar um NOVO Tipo de Ordem ao dropdown de 'tipo-ordem' ou registrar um novo tipo de serviço. Sintomas: 'novo tipo de ordem', 'adicionar item ao campo tipo-ordem'. Para editar campos de tipo EXISTENTE, use retorno-fields-guide.
---

# Guia de Novos Tipos de Ordem

## Quando usar

Use esta skill quando:

- O usuário solicitar adicionar um novo Tipo de Ordem ao dropdown
- O usuário mencionar adicionar item ao campo "tipo-ordem"
- A tarefa envolver registrar um novo tipo de serviço no sistema

## Decisão inicial

Antes de tocar código, responda **2 perguntas** consultando `dados_projeto/tipos_ordem_template.xlsx` (aba `corte`):

### Pergunta 1: O tipo tem campos de retorno customizados na planilha?

| Resposta                          | Impacto                                         |
| --------------------------------- | ----------------------------------------------- |
| **Sim** define campos específicos | Cria array customizado em `retornoFieldsByTipo` |
| **Não** só descrição              | Usa `FIELD_DESCRICAO`                           |

**Regra:** se a planilha não lista o tipo na aba `corte`, assumir `FIELD_DESCRICAO`.

### Pergunta 2: Os campos são iguais aos de outro tipo já implementado?

| Resposta                          | Impacto                             |
| --------------------------------- | ----------------------------------- |
| **Sim** reusa constante existente | Aponta para constante já definida   |
| **Não** cria novo array           | Cria constante nova ou array inline |

## Checklist de implementação

### Antes

- [ ] Consultar `tipos_ordem_template.xlsx` para definir campos de retorno
- [ ] Verificar se o nome na planilha existe exatamente em `tipoOrdemOptions`
- [ ] Identificar tipos compartilhados para definir constante
- [ ] Verificar se o tipo pode reusar constante existente

### Durante

- [ ] Adicionar nome ao array `tipoOrdemOptions` em `scripts/data/fields-data.js`
- [ ] Registrar campos em `retornoFieldsByTipo` no mesmo arquivo
- [ ] Criar template em `retornoTemplates` em `scripts/data/retorno-templates.js`

### Após

- [ ] Executar `npm test` — todos os testes devem passar
- [ ] Confirmar que Husky bumpou `CACHE_NAME` no `sw.js` (automático no pre-commit)
- [ ] Adicionar testes específicos em `tests/fields.test.js`
- [ ] Adicionar testes em `tests/retornos.test.js` se tem condicionais
- [ ] Adicionar testes em `tests/email.test.js` se tem template customizado

## Etapa 1: Adicionar ao dropdown

**Arquivo:** `scripts/data/fields-data.js`
**Local:** array `tipoOrdemOptions` — busca por `export const tipoOrdemOptions = [`

Inserir o nome **exato** da planilha. A posição no array define a ordem de exibição no dropdown.

## Etapa 2: Registrar campos de retorno

**Arquivo:** `scripts/data/fields-data.js`
**Local:** objeto `retornoFieldsByTipo` — busca por `export const retornoFieldsByTipo = {`

### Cenário A: Só descrição

Adicionar entrada apontando para `FIELD_DESCRICAO`:

```js
"NOME DO TIPO": [FIELD_DESCRICAO],
```

### Cenário B: Campos customizados

Criar array de campos:

```js
export const MEU_TIPO_FIELDS = [
  { linha: 1, nome: 'campo_um', label: 'Campo Um', tipo: 'select', opcoes: ['OPCAO_1', 'OPCAO_2'] },
  { linha: 2, nome: 'campo_dois', label: 'Campo Dois', tipo: 'text' },
  { linha: 2, nome: 'campo_tres', label: 'Campo Três', tipo: 'number' },
];
```

Regras de estrutura do campo:

- `linha` conforme `linha_campo` da planilha
- `nome` em snake_case (ou kebab-case para legados)
- `tipo` em minúsculo: `select`, `text`, `number`, `textarea`
- `opcoes` como array de strings (para SELECT)
- Campo pai antes do filho no array (cascata)
- Não incluir "Selecione" manualmente (sistema adiciona)

**Campos condicionais:**

```js
// Condicionais simples
{ condicional: { campoRef: "campo_pai", valor: "VALOR" } }

// Multi-valor (array)
{ condicional: { campoRef: "campo_pai", valor: ["VALOR_1", "VALOR_2"] } }

// Negado (todos exceto um)
{ condicional: { campoRef: "campo_pai", valor: "VALOR_EXCLUIDO", negado: true } }
```

**Tipos compartilhados:**

Se múltiplos tipos usam os mesmos campos, criar constante antes do `retornoFieldsByTipo`:

```js
export const TIPO_AB_FIELDS = [{ linha: 1, nome: 'campo_um', label: 'Campo Um', tipo: 'text' }];

export const retornoFieldsByTipo = {
  'TIPO A': TIPO_AB_FIELDS,
  'TIPO B': TIPO_AB_FIELDS,
};
```

## Etapa 3: Criar template de email

**Arquivo:** `scripts/data/retorno-templates.js`
**Local:** objeto `retornoTemplates` — busca por `export const retornoTemplates = {`

### Cenário A: Só descrição

```js
"NOME DO TIPO": DESCRICAO_TEMPLATE,
```

### Cenário B: Template customizado

```js
export const MEU_TIPO_TEMPLATE = [
  {
    blocos: [{ texto: 'Descrição do serviço: {campo_um}' }, { texto: 'Detalhes: {campo_dois}' }],
  },
];
```

**Variantes com condicional:**

```js
export const MEU_TIPO_TEMPLATE = [
  {
    condicao: { campo: 'status_servico', valor: 'EXECUTADO' },
    blocos: [{ texto: 'Serviço executado com sucesso.' }, { texto: 'Observações: {observacoes}' }],
  },
  {
    condicao: { campo: 'status_servico', valor: 'NAO_EXECUTADO' },
    blocos: [{ texto: 'Serviço não executado.' }, { texto: 'Motivo: {motivo}' }],
  },
];
```

**Blocos condicionais:**

```js
{
  blocos: [
    { texto: "Campo obrigatório: {campo_um}" },
    { texto: "Campo opcional: {campo_opcional}", condicao: { campo: "campo_opcional", valor: true } },
  ],
}
```

**Templates compartilhados:**

Se múltiplos tipos usam o mesmo template, criar constante antes do `retornoTemplates`.

**Placeholders:** Resolvem de `data.retorno` primeiro, depois `data.iniciais`. Exemplo: `{descricao}` pega de `state.retorno.descricao`.

## Etapa 4: Testes

### Obrigatório

`tests/fields.test.js` — os testes de integridade cruzada (iteram `tipoOrdemOptions`) capturam automaticamente se o tipo não foi registrado em `retornoFieldsByTipo` ou `retornoTemplates`.

### Recomendado

Adicionar teste de unidade específico se o tipo tem campos customizados:

```js
test('MEU_TIPO tem campos corretos', () => {
  const fields = retornoFieldsByTipo['MEU_TIPO'];
  expect(fields).toHaveLength(3);
  expect(fields[0].nome).toBe('campo_um');
  // ...
});
```

### Opcional

- `tests/retornos.test.js` se tem condicionais (testar renderização e visibilidade)
- `tests/email.test.js` se tem template complexo (testar variantes e placeholders)

## Etapa 5: Commit

```powershell
git add -A; if ($?) { git commit -m "feat: adicionar NOME DO TIPO" }; if ($?) { git push }
```

Husky bumpa `CACHE_NAME` automaticamente.

## Arquitetura

### Arquivos que mudam (3)

| #   | Arquivo                             | O que muda                                 |
| --- | ----------------------------------- | ------------------------------------------ |
| 1   | `scripts/data/fields-data.js`       | `tipoOrdemOptions` + `retornoFieldsByTipo` |
| 2   | `scripts/data/retorno-templates.js` | `retornoTemplates`                         |
| 3   | `tests/fields.test.js`              | Teste específico (recomendado)             |

### Arquivos que NÃO mudam

`index.html`, `fields.js`, `iniciais.js`, `retornos.js`, `email.js`, `collectors.js`, `validation.js`, `app.js`, `send.js` — todos leem dados dinamicamente. Se qualquer um desses precisa de mudança para um novo tipo, o tipo tem um caso excepcional e deve ser sinalizado ao usuário antes de prosseguir.

### Arquivos de referência (somente leitura)

| Arquivo                                   | Para que serve                            |
| ----------------------------------------- | ----------------------------------------- |
| `dados_projeto/tipos_ordem_template.xlsx` | Fonte de verdade dos campos de retorno    |
| `scripts/data/fields-data.js`             | Campos existentes, padrões de constante   |
| `scripts/data/retorno-templates.js`       | Templates existentes, padrões de variante |

## Situações a evitar

- ❌ Adicionar ao dropdown sem criar entrada em `retornoFieldsByTipo` (teste de integridade vai falhar, mas evita ida e volta)
- ❌ Nome no dropdown diferente do nome na planilha (causa `getRetornoFields()` retornar `undefined` — fallback silencioso para descrição)
- ❌ Esquecer `FIELD_DESCRICAO` ao remover de um tipo que ganhou campos (o `default` só funciona para tipos que **não** estão no mapa)
- ❌ Incluir `"Selecione"` manualmente nas `opcoes` de SELECT (sistema adiciona automaticamente)
- ❌ Modificar arquivos que não estão na lista de 3 — exceção apenas com sinalização ao usuário

# Formulário, Design Técnico

> Gerado pelo Redator em 2026-06-15
> Cobre os módulos: `iniciais.js`, `retornos.js`, `fields.js`

---

## Interface

### Funções Exportadas

| Símbolo | Assinatura | Retorno | Observação |
|---------|-----------|---------|------------|
| `renderIniciais()` | `()` | `void` | Reconstrói todo o DOM de `DOM.iniciaisCampos`. Deve ser chamada após `cacheDOM()` |
| `getIniciaisData()` | `()` | `Record<string, string>` | Lê valores do DOM por `document.getElementById(field.nome)` |
| `renderRetorno()` | `()` | `void` | Renderiza campos de retorno conforme `DOM.tipoOrdem.value` |
| `handleTipoChange()` | `()` | `void` | Guarda `lastTipoOrdem`, zera `state.retorno`, chama `renderRetorno()` + `saveState()` |
| `getRetornoData()` | `()` | `Record<string, string>` | Lê apenas campos visíveis (filtra `display: none`) |
| `setRetornoData(data)` | `(data: object)` | `void` | Preenche valores nos campos + reavalia condicionais |
| `updateConditionalFields(fields)` | `(fields: array)` | `void` | Avalia condições de todos os campos e mostra/esconde |
| `getRetornoFields(tipo)` | `(tipo: string)` | `FieldDef[]` | Busca schema do tipo ou retorna `default` |
| `INPUT_CREATORS` | `Record<string, Function>` | — | Factory de elementos: select, number, date, time, text, textarea |

### Estrutura de Dados — Field Definition

```typescript
interface FieldDef {
  linha?: number;              // Agrupamento horizontal (mesmo número = mesma row)
  nome: string;                // ID do campo (kebab-case para início, snake_case para retorno)
  label: string;               // Label do campo
  tipo: "select"|"number"|"date"|"time"|"text"|"textarea"|"coordinates";
  obrigatorio?: boolean;       // true → adiciona data-required + asterisco no label
  opcoes?: string[];           // Para selects: lista de opções
  condicional?: {              // Para campos condicionais de retorno
    campoRef: string;          // Nome do campo de referência
    valor: string | string[];  // Valor(es) que ativam o campo (array = any match)
    negado?: boolean;          // true → inverte a lógica (mostrar quando NÃO for o valor)
  };
  readonly?: boolean;          // Para campos somente leitura
}
```

### Exemplo de Schema

```js
// Campo de início
{ linha: 4, nome: "uc", label: "UC", tipo: "number", obrigatorio: true }

// Campo de retorno condicional
{ linha: 5, nome: "toi", label: "TOI", tipo: "text",
  condicional: { campoRef: "aplicado-toi", valor: "SIM" } }

// Campo condicional com array (any match)
{ linha: 2, nome: "obra", label: "Obra", tipo: "select",
  condicional: { campoRef: "retorno_ligacao", valor: ["VISTORIA", "VISTORIA + LIGAÇÃO"] } }

// Campo condicional com negação
{ linha: 2, nome: "acesso_desligamento", label: "Descreva o Problema", tipo: "text",
  condicional: { campoRef: "desligamento", valor: "DESLIGAMENTO EXECUTADO", negado: true } }
```

## Fluxo Principal

### Inicialização (renderIniciais)

1. `DOM.iniciaisCampos.innerHTML = ""` — limpa container
2. Itera `iniciaisFields[]` array
3. Para cada campo:
   a. Se `field.linha` mudou, cria novo wrapper `<div>` com classe de layout (`grid grid-cols-2`, `linha-data`, etc.)
   b. Cria `<label>` com `textContent = field.label` + `*` se obrigatório
   c. Seleciona criador de `INPUT_CREATORS[field.tipo]`
   d. Cria input, seta `id = field.nome`, `placeholder`, `data-required`
   e. Se `field.nome === "tipo-ordem"`, cacheia em `DOM.tipoOrdem`
   f. Adiciona `addBlurValidation(input)` + listeners de input/change para `debouncedSave`
   g. Cria `<span class="field-error">` para erros inline
   h. Adiciona ao wrapper

### Mudança de Tipo de Ordem (handleTipoChange → renderRetorno)

1. Lê `DOM.tipoOrdem.value`
2. Se igual a `state.lastTipoOrdem`, retorna (não faz nada)
3. Atualiza `state.lastTipoOrdem`
4. Zera `state.retorno = {}`
5. Limpa `DOM.retornoCampos.innerHTML`
6. `renderRetorno()`:
   a. Exibe label do tipo selecionado em `DOM.retornoDesc`
   b. Se tipo vazio, mostra placeholder e retorna
   c. Busca `getRetornoFields(tipo)`
   d. Agrupa por `linha` via `agruparPorLinha()` (Map)
   e. Para cada grupo: cria `<div class="flex gap-3 mb-4">`
   f. Para cada campo: cria grupo com `dataset.fieldNome`, dataset condicional se aplicável
   g. Cria input similar ao início mas SEMPRE com `data-required`
   h. Se o campo tem dependentes (`hasConditionalDependents`), adiciona listener `change` → `updateConditionalFields`
7. `updateConditionalFields(fields)` — avalia e aplica visibilidade

### Atualização de Campos Condicionais (updateConditionalFields)

1. Para cada campo com `condicional`:
   a. Busca o grupo no DOM por `[data-field-nome="${field.nome}"]`
   b. Busca o campo de referência por `document.getElementById(condicional.campoRef)`
   c. Normaliza `condicional.valor` para array
   d. Verifica `match = valores.includes(controlEl.value)`
   e. `show = condicional.negado ? !match : match`
   f. Se `show`: `group.style.display = ""`
   g. Se não: `group.style.display = "none"` + zera input value

### Coleta de Dados (getRetornoData)

1. Busca `getRetornoFields(tipo)`
2. Para cada campo:
   a. Busca grupo por `[data-field-nome]`
   b. Se `display === "none"`, pula
   c. Lê `document.getElementById(field.nome).value`
3. Retorna objeto `{ [nome]: valor }` apenas com campos visíveis

## Fluxos Alternativos

- **Tipo de ordem sem campos específicos:** usa `retornoFieldsByTipo["default"]` que contém apenas `FIELD_DESCRICAO` (textarea)
- **Nenhum tipo selecionado:** `renderRetorno()` exibe placeholder "Selecione um tipo de ordem" e esconde campos
- **Campo coordenadas sem geolocalização:** exibe "Não disponível" no input readonly
- **Condicional com campo ref ausente:** `updateConditionalFields` retorna silenciosamente (group não encontrado)

## Dependências

| Componente | Como usa |
|-----------|---------|
| `dom.js` | Acessa elementos DOM via `DOM.iniciaisCampos`, `DOM.retornoCampos`, `DOM.tipoOrdem`, `DOM.retornoDesc`, `DOM.retornoPlaceholder` |
| `state.js` | Lê e escreve `state.lastTipoOrdem`, `state.retorno`; chama `debouncedSave()`, `saveState()` |
| `validation.js` | Chama `addBlurValidation()` em cada input; `getIniciaisData()` e `getRetornoData()` são usados pelos validadores |
| `styles.js` | Usa `INPUT_CLASS` e `SELECT_CLASS` para classes CSS dos inputs |
| `utils.js` | `captureCoordinates()` é chamado pelo botão de refresh do campo coordenadas |

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| INPUT_CREATORS como factory (Strategy Pattern) | `iniciais.js:126-133` | 🟢 |
| Agrupamento por linha via Map | `retornos.js:76-90` | 🟢 |
| Campos condicionais: dataset no group + CSS display | `retornos.js:34-40, 96-120` | 🟢 |
| hasConditionalDependents para attach de listeners | `retornos.js:57-59, 92-94` | 🟢 |
| DOM.tipoOrdem cacheado manualmente (exceção à regra do dom.js) | `iniciais.js:172` | 🟢 |
| Dados de retorno descartados ao mudar tipo | `retornos.js:158-160` | 🟢 |
| Valores zerados ao ocultar campo condicional | `retornos.js:116-117` | 🟢 |

## Estado Interno

Nenhum estado interno — os dados são armazenados no `state` global (`state.lastTipoOrdem`, `state.retorno`). Os elementos do DOM servem como fonte da verdade para leitura.

| Estado | Onde | Tipo | Descrição |
|--------|------|------|-----------|
| `lastTipoOrdem` | `state` | string | Último tipo selecionado para detectar mudança |
| `retorno` | `state` | object | Dados dos campos de retorno |
| `iniciais` | `state` | object | Dados dos campos de início (populado pela validação) |

## Observabilidade

Nenhum log, métrica ou trace é emitido por estes módulos.

## Riscos e Lacunas

- 🟡 `DOM.tipoOrdem` é uma exceção à convenção de cache DOM — pode quebrar se `renderIniciais()` não for chamado antes de acessá-lo
- 🟢 Ordem dos campos no array `retornoFieldsByTipo` importa: pais devem vir antes dos filhos (não há ordenação automática)
- 🟢 O campo UC aceita apenas números (`inputMode=numeric` + regex validation) mas é armazenado como string

---

*Fim do design do formulário.*

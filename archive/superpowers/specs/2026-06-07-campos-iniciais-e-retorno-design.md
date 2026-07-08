# Substituição dos campos "Iniciais" e simplificação do "Retorno"

## Resumo

Substituir os 4 campos atuais da Seção 1 (UC, OS, Cliente, Tipo de ordem) pelos 11 campos
definidos na planilha `dados_projeto/etapa_iniciais.xlsx`, e simplificar a Seção 3 (Retorno)
para exibir apenas o campo "Descrição" (preparando para implementação futura de campos
específicos por tipo de ordem).

## Escopo

- **Seção 1 (Iniciais):** renderização dinâmica via JS, campo "Cliente" removido
- **Seção 3 (Retorno):** campo único "Descrição" para qualquer tipo de ordem
- **Tipo de ordem:** 40+ tipos da planilha (value = texto legível), prepara mapeamento futuro
- **Demais seções:** inalteradas (Equipamentos, Anexos, Revisão)

## Abordagem escolhida

**Abordagem A — Renderização dinâmica via JS.** Cria-se módulo `scripts/iniciais.js`
com definição dos campos e função `renderIniciais()`, similar ao padrão já usado em
`retornos.js`. Validação e composição de email tornam-se genéricas.

## Design detalhado

### 1. Módulo `scripts/iniciais.js` (CRIAR)

Define o array `iniciaisFields` com a estrutura de cada campo:

| Propriedade   | Descrição                                                   |
| ------------- | ----------------------------------------------------------- |
| `linha`       | Agrupamento visual (mesmo número = mesma linha/grid)        |
| `nome`        | Identificador usado como `id` do elemento e chave no estado |
| `label`       | Rótulo exibido                                              |
| `tipo`        | `"select"`, `"text"`, `"number"`, `"date"`, `"time"`        |
| `opcoes`      | Array de strings (para `select`)                            |
| `obrigatorio` | Boolean                                                     |

Campos definidos (em ordem):

| linha | nome        | label         | tipo   | opcoes                 |
| ----- | ----------- | ------------- | ------ | ---------------------- |
| 1     | lider       | Líder         | select | 12 nomes (planilha)    |
| 2     | parceiro    | Parceiro      | select | 12 nomes (planilha)    |
| 3     | municipio   | Município     | select | 30+ cidades (planilha) |
| 4     | uc          | UC            | number | —                      |
| 4     | os          | OS            | text   | —                      |
| 5     | notificado  | Notificado    | select | SIM, NÃO               |
| 5     | placa       | Placa         | select | 13 placas (planilha)   |
| 6     | data        | Data          | date   | —                      |
| 6     | hora_inicio | Início        | time   | —                      |
| 6     | hora_fim    | Fim           | time   | —                      |
| 7     | tipo_ordem  | Tipo de Ordem | select | 40+ tipos (planilha)   |

Funções exportadas:

- **`renderIniciais()`**: Limpa `#iniciais-campos` e renderiza todos os campos.
  Agrupa por `linha` usando grid CSS:
  - linha 4 (uc+os): `grid-cols-2 gap-3`
  - linha 5 (notificado+placa): `grid-cols-2 gap-3`
  - linha 6 (data+inicio+fim): `grid-cols-3 gap-3`
  - demais: largura total
    Aplica `addBlurValidation()` em cada campo.
- **`getIniciaisData()`**: Retorna objeto `{ [nome]: valor }` com todos os campos.
- **`getTipoOrdemOptions()`**: Retorna array de opções para o select tipo_ordem.

### 2. `index.html` — Seção 1 (EDITAR)

O HTML da Seção 1 passa a ser apenas um esqueleto:

```html
<div class="section active" id="section-1">
  <h2 class="text-xl text-gray-900 mb-1">Campos Iniciais</h2>
  <p class="text-base text-gray-500 mb-5">Preencha os dados da ordem de serviço.</p>
  <div id="iniciais-campos"></div>
</div>
```

Remover os elementos HTML de uc, os, cliente, tipo-ordem da section-1.

### 3. `scripts/dom.js` (EDITAR)

Adicionar ao cache:

- `DOM.iniciaisCampos = document.getElementById("iniciais-campos")`

Manter referências existentes (podem ser usadas em outros lugares). Os campos individuais
(lider, parceiro, etc.) são obtidos via `document.getElementById(nome)` quando necessário.

### 4. `scripts/validation.js` (EDITAR)

**`validateSection(1)`**: Substituir validação hardcoded (uc, os, cliente, tipoOrdem)
por iteração sobre `iniciaisFields`. Para cada campo obrigatório, obter
`document.getElementById(field.nome)` e validar `value.trim() !== ""`.
Marca `.error` nos campos vazios.

**`collectSectionData(1)`**: Salvar `state.iniciais = getIniciaisData()`.

### 5. `scripts/email.js` (EDITAR)

**`composeEmail()`**: Substituir leitura de `DOM.uc`, `DOM.os`, `DOM.cliente`
por iteração sobre `iniciaisFields`. Construir corpo do email dinamicamente.
Para retorno: ler `document.getElementById("descricao-retorno")`.

### 6. `scripts/state.js` (EDITAR)

**`saveState()`**: Salvar `state.iniciais` (objeto via `getIniciaisData()`) no lugar
de `uc`, `os`, `cliente` individuais. Manter `tipoOrdem`, `equipamentos`, etc.

**`restoreSavedState()`**: Restaurar campos via loop sobre `iniciaisFields`:
`document.getElementById(field.nome).value = data.iniciais[field.nome] || ""`.
Remover `DOM.cliente.value` e `DOM.uc.value` individuais.

### 7. `scripts/app.js` (EDITAR)

- `initEvents()`: Remover `DOM.cliente` do array de blur validation.
  Chamar `renderIniciais()` após `cacheDOM()`.
- `restoreSavedState()`: Remover referências a `DOM.cliente`.

### 8. `scripts/navigation.js` (EDITAR)

- `showSection()`: Chamar `renderIniciais()` quando `n === 1` (para recriar campos
  após reset, alinhado com as demais seções que já fazem isso).

### 9. `scripts/reset.js` (EDITAR)

- `resetForm()`: Chamar `renderIniciais()` para recriar campos limpos.
  Remover `DOM.cliente.value = ""`, `DOM.uc.value = ""`, `DOM.os.value = ""`.

### 10. Simplificação do Retorno (`scripts/retornos.js`) (EDITAR)

Substituir objeto `retornoFields` atual (com chaves por tipo) por array fixo:

```js
export const retornoFields = [
  { label: 'Descrição', id: 'descricao-retorno', type: 'textarea', required: true },
];
```

- `renderRetorno()`: Sempre renderiza apenas o campo "Descrição", independente do tipo
  selecionado. Remove lógica de chaveamento por tipo.
- `handleTipoChange()`: Mantido (alerta ao trocar tipo com retorno preenchido).
  Remove referências a `retornoFields["ordem-servico"]` etc.
- `confirmTipoChange()`: Mantido, apenas fecha modal e aplica mudança.

### 11. Tipos de ordem

O `<select id="tipo-ordem">` populado por `renderIniciais()` com 40+ opções da planilha.
Cada `<option>` tem `value` igual ao texto (ex: `"CORTE DE UC POR DEF TECNICO"`).
O `handleTipoChange()` e modal de confirmação são preservados — continuam funcionando
com os novos valores.

### 12. Efeitos colaterais e edge cases

- **Campos DATE/TIME**: `<input type="date">` e `<input type="time">`. Fallback natural
  do browser se não suportado.
- **Placa como SELECT**: Fiel à decisão do usuário. 13 placas da planilha como options.
- **Salvamento automático**: Listeners `change`/`input` em `app.js` usam
  `querySelectorAll("input, select, textarea")` que captura campos dinâmicos.
- **Tipos de ordem com acentos/espaços**: Valores com espaços e caracteres especiais
  funcionam em `<option value="...">`. Mantidos como na planilha.
- **Agrupamento uc+os (linha 4)**: UC (number) + OS (text) lado a lado.
- **Agrupamento data+inicio+fim (linha 6)**: Três campos na mesma linha.
- **Retorno sem tipo selecionado**: Renderizar sempre o campo "Descrição", com aviso
  sutil se não houver tipo selecionado.

### 13. Non-goals (fora de escopo)

- Não implementar campos de retorno específicos por tipo de ordem
- Não implementar visibilidade condicional (gatilho_campo/gatilho_valor)
- Não alterar seções 2 (Equipamentos), 4 (Anexos), 5 (Revisão)
- Não alterar backend (`netlify/functions/send.js`)
- Não alterar image compression, anexos, IndexedDB

## Arquivos impactados (11 arquivos)

| Arquivo                 | Ação                                |
| ----------------------- | ----------------------------------- |
| `scripts/iniciais.js`   | **CRIAR** — definições + render     |
| `index.html`            | **EDITAR** — Seção 1 vira esqueleto |
| `scripts/dom.js`        | **EDITAR** — add `iniciaisCampos`   |
| `scripts/validation.js` | **EDITAR** — validação genérica     |
| `scripts/retornos.js`   | **EDITAR** — campo único Descrição  |
| `scripts/email.js`      | **EDITAR** — leitura dinâmica       |
| `scripts/state.js`      | **EDITAR** — salvar/restaurar       |
| `scripts/app.js`        | **EDITAR** — init + restore         |
| `scripts/navigation.js` | **EDITAR** — render na seção 1      |
| `scripts/reset.js`      | **EDITAR** — limpeza via render     |

## Ordem de implementação sugerida

1. Criar `scripts/iniciais.js`
2. Editar `index.html` (Seção 1 como esqueleto)
3. Editar `scripts/dom.js` (add `iniciaisCampos`)
4. Editar `scripts/navigation.js` (render na seção 1)
5. Editar `scripts/validation.js` (validação genérica seção 1)
6. Editar `scripts/state.js` (salvar/restaurar `state.iniciais`)
7. Editar `scripts/app.js` (init + restore)
8. Editar `scripts/reset.js` (limpeza)
9. Editar `scripts/retornos.js` (simplificação)
10. Editar `scripts/email.js` (leitura dinâmica)
11. Testar fluxo completo com `npx netlify dev`

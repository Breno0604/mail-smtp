# Retorno Templates — Design Document

## Correções

> **Placeholders:** Suportam **qualquer campo** do objeto `data` (retorno, iniciais, equipamentos).
> O motor busca `data.retorno` primeiro, depois `data.iniciais`, depois `data.instaladoEquip`/`data.retiradoEquip`.
>
> **Local do motor:** `scripts/email.js` — função `applyRetornoTemplate()` importa os templates de `scripts/data/retorno-templates.js`.
>
> **Condição `valor` e `diferenteDe`:** Mutuamente exclusivos. Usar um ou outro.
>
> **Else (catch-all):** Opcional — se nenhuma variante combinar e não houver else, retorna `null` → fallback genérico.

## Problema

Atualmente o `composeEmail()` gera o texto dos campos de retorno de forma genérica para **todos** os Tipos de Ordem:

```
SITUACAO: CLIENTE CORTADO
DESCRICAO DO SERVICO: executei o corte
```

Não há personalização por tipo de ordem — o texto é sempre uma listagem `LABEL: valor` sem contexto ou fluência natural.

## Objetivo

Permitir que cada Tipo de Ordem com campos personalizados tenha seu próprio **template de texto de retorno**, substituindo completamente a listagem genérica por um texto mais claro, natural e objetivo, com suporte a condicionais baseadas nos valores dos campos.

## Abordagem Escolhida: Template Declarativo

Abordagem **declarativa** (JSON puro), sem código JS por tipo de ordem. Um "motor" simples avalia condições e substitui placeholders.

### 1. Arquivo de Templates

**Novo arquivo:** `scripts/data/retorno-templates.js`

```js
export const retornoTemplates = {
  'CORTE POR FALTA DE PAGAMENTO': [
    {
      condicao: { campo: 'situacao_corte', valor: 'CLIENTE CORTADO' },
      blocos: [
        { texto: 'CORTE EXECUTADO CONFORME ORDEM DE SERVIÇO {situacao_corte}' },
        { texto: '{descricao}' },
      ],
    },
    {
      // else (sem condicao = catch-all, deve ser a última)
      blocos: [{ texto: '{situacao_corte}.' }, { texto: '{descricao}' }],
    },
  ],
};
```

### 2. Formato do Template

| Elemento                                 | Descrição                                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `retornoTemplates`                       | Objeto. Chave = nome exato do Tipo de Ordem.                                                           |
| Variante                                 | Objeto `{ condicao?, blocos }`. Avaliadas em ordem. A **primeira** cuja condição for verdadeira vence. |
| `condicao` (opcional)                    | Se omitido, funciona como **else** (catch-all). Deve ser a última.                                     |
| - `{ campo: "nome", valor: "X" }`        | Igualdade.                                                                                             |
| - `{ campo: "nome", valor: ["A", "B"] }` | Múltiplos valores (qualquer um combina).                                                               |
| - `{ campo: "nome", diferenteDe: "X" }`  | Diferente de.                                                                                          |
| `blocos`                                 | Array de blocos de texto renderizados em ordem.                                                        |
| `texto`                                  | String com placeholders `{nome_campo}` substituídos pelo valor real.                                   |

### 3. Motor de Template

**Local:** `scripts/email.js`

```js
function resolvePlaceholder(nome, data) {
  return (
    data.retorno?.[nome] ??
    data.iniciais?.[nome] ??
    data.instaladoEquip?.[nome] ??
    data.retiradoEquip?.[nome] ??
    ''
  );
}

function applyRetornoTemplate(tipo, data) {
  const template = retornoTemplates[tipo];
  if (!template) return null; // fallback

  const variante = template.find(v => {
    if (!v.condicao) return true;
    const valorCampo = data.retorno?.[v.condicao.campo];
    if (v.condicao.valor !== undefined) {
      const valores = Array.isArray(v.condicao.valor) ? v.condicao.valor : [v.condicao.valor];
      return valores.includes(valorCampo);
    }
    if (v.condicao.diferenteDe !== undefined) {
      return valorCampo !== v.condicao.diferenteDe;
    }
    return false;
  });

  if (!variante) return null;

  return variante.blocos
    .map(bloco => {
      let texto = bloco.texto;
      for (const [nome, valor] of Object.entries(data.retorno || {})) {
        texto = texto.replaceAll(`{${nome}}`, valor || '');
      }
      // Também resolve placeholders de iniciais e equipamentos
      for (const [nome, valor] of Object.entries(data.iniciais || {})) {
        texto = texto.replaceAll(`{${nome}}`, valor || '');
      }
      return texto;
    })
    .join('\n');
}
```

### 4. Integração

**Único ponto de mudança:** `scripts/email.js`, função `composeEmail()`, substituir o bloco "Campos de Retorno" por:

```js
// Tenta template personalizado
const textoPersonalizado = applyRetornoTemplate(tipo, data);

if (textoPersonalizado) {
  linhas.push(`\n${textoPersonalizado}`);
} else {
  // Fallback: comportamento genérico atual
  const retornoFields = tipo ? getRetornoFields(tipo) : [];
  for (const field of retornoFields) {
    if (!data.retorno || !(field.nome in data.retorno)) continue;
    const valor = data.retorno[field.nome];
    linhas.push(`\n${field.label}: ${valor || '(NAO PREENCHIDO)'}`);
  }
}
```

- `updateLivePreview()` chama `composeEmail()`, então a revisão se atualiza automaticamente
- Tipos sem template continuam exatamente como hoje

### 5. Implementação Incremental

1. Criar `scripts/data/retorno-templates.js` com `retornoTemplates = {}` (vazio)
2. Adicionar `applyRetornoTemplate()` em `scripts/email.js`
3. Modificar o bloco de retorno em `composeEmail()` para usar o template
4. Verificar testes existentes (`tests/email.test.js`) — devem continuar passando
5. Adicionar testes para `applyRetornoTemplate()`
6. Adicionar template para **CORTE POR FALTA DE PAGAMENTO** como primeiro caso real

### 6. Casos de Borda

- Campo mencionado em `{placeholder}` que não existe nos dados → string vazia
- Valor vazio/nulo → string vazia
- Nenhuma variante corresponde → `null` (fallback genérico)
- Tipo de ordem sem template → `null` (fallback genérico)
- Múltiplas variantes com condição; se nenhuma combina, a variante **else** (última, sem condição) é usada

### 7. Testes

- `applyRetornoTemplate()` retorna `null` para tipo sem template
- `applyRetornoTemplate()` seleciona variante correta por condição
- `applyRetornoTemplate()` substitui placeholders corretamente
- `composeEmail()` usa template quando disponível, genérico quando não
- Template com campos vazios/nulos não quebra
- `diferenteDe` funciona para variante "qualquer outro valor"

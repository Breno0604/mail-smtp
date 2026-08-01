---
name: email-composition-guide
description: Use quando o usuário pedir para alterar assunto, corpo, template, placeholder, variante, ou formatação do email enviado. Sintomas: 'mudar o assunto do email', 'alterar template', 'adicionar campo no email'.
---

# Guia de Composição de Email

## Quando usar

Use esta skill quando:

- O usuário pedir para "mudar o assunto do email", "alterar o template", "adicionar campo no email"
- O usuário quiser modificar como o email é formatado ou quais campos aparecem
- O usuário mencionar "email", "template", "placeholder", "corpo do email", "assunto", "variante"

## Estrutura

O sistema de email tem 3 camadas. Esta skill é um mapa de referência organizado por **tipo de mudança**.

| #   | Seção                                    | Arquivos principais                |
| --- | ---------------------------------------- | ---------------------------------- |
| 1   | Linha de assunto                         | `send.js`                          |
| 2   | Estrutura do corpo (seções, ordem)       | `email.js`                         |
| 3   | Templates (variantes, blocos, condições) | `retorno-templates.js`             |
| 4   | Placeholders                             | `retorno-templates.js`, `email.js` |
| 5   | Normalização de texto                    | `email.js`                         |
| 6   | Preview ao vivo                          | `email.js`, `app.js`, `index.html` |
| 7   | Backend (validação, SMTP)                | `send.cjs`                         |

## Checklist geral

### Antes

- [ ] Identificar o tipo de mudança (assunto? template? placeholder? estrutura?)
- [ ] Verificar se o template é compartilhado (constante) — mudança afeta múltiplos tipos
- [ ] Se for adicionar placeholder, verificar se o campo existe em `retornoFieldsByTipo`

### Após

- [ ] Rodar `npm test` — `tests/email.test.js` cobre todos os templates
- [ ] Verificar preview no navegador (`npx netlify dev`)
- [ ] Husky bumpa `CACHE_NAME` automaticamente

---

## 1. Linha de assunto

**Arquivo:** `scripts/send.js` — busca por `const subject =` em `sendEmail()`

```js
const subject = `RETORNO DE ORDEM UC ${uc} OS ${os} - ${tipoLabel}`;
```

### O que pode ser mudado

| Elemento       | Origem                                      | Exemplo                          |
| -------------- | ------------------------------------------- | -------------------------------- |
| `${uc}`        | `state.iniciais.uc`                         | `"12345"`                        |
| `${os}`        | `state.iniciais.os`                         | `"67890"`                        |
| `${tipoLabel}` | `DOM.tipoOrdem.options[selectedIndex].text` | `"CORTE POR FALTA DE PAGAMENTO"` |

### Regras

- Template literal — preservar `${uc}`, `${os}`, `${tipoLabel}`
- `tipoLabel` vem do texto visível do dropdown, não do `value`
- Se `uc` ou `os` forem nullish, caem para `'—'` (fallback no mesmo bloco)
- O assunto é enviado como `subject` no payload JSON — o backend não modifica

### Exemplo de mudança

Trocar o prefixo:

```js
const subject = `RELATORIO DE CAMPO UC ${uc} OS ${os} - ${tipoLabel}`;
```

---

## 2. Estrutura do corpo

**Arquivo:** `scripts/email.js`, função `composeEmail()` — busca por `export function composeEmail(`

### Ordem atual das seções

| #   | Seção                   | Linhas                                                          | Condição para aparecer     |
| --- | ----------------------- | --------------------------------------------------------------- | -------------------------- |
| 1   | Iniciais                | `composeEmail()` — busca por `iniciaisFields.forEach`           | Sempre                     |
| 2   | Equipamentos Instalados | `composeEmail()` — busca por `instaladoEquip === 'SIM'`         | `instaladoEquip === 'SIM'` |
| 3   | Equipamentos Retirados  | `composeEmail()` — busca por `retiradoEquip === 'SIM'`          | `retiradoEquip === 'SIM'`  |
| 4   | Retorno                 | `composeEmail()` — busca por `applyRetornoTemplate(tipo, data)` | Sempre                     |

### Formato de cada seção

**Iniciais** — cada campo em uma linha:

```
LABEL: valor
```

**Equipamentos** — header + itens:

```
EQUIPAMENTOS INSTALADOS:
MEDIDOR: 12345
CONJUNTO: 67890
```

**Retorno** — via template ou fallback manual:

```
TEXTO DO TEMPLATE COM {PLACEHOLDERS}

```

Se não há template, fallback campo-a-campo:

```
LABEL: valor
LABEL: (NAO PREENCHIDO)
```

### O que pode ser mudado

| Mudança                       | Onde                                                      | Como                                                                       |
| ----------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------- |
| Reordenar seções              | `composeEmail()`                                          | Mover blocos de código entre as seções (iniciais → equipamentos → retorno) |
| Adicionar nova seção          | `composeEmail()`                                          | Novo bloco antes do `return body`                                          |
| Remover seção existente       | `composeEmail()`                                          | Remover ou comentar o bloco                                                |
| Mudar separador entre campos  | `composeEmail()` — busca por `\n` ou `: ` no body +=      | Alterar `\n` ou `: `                                                       |
| Mudar headers de equipamentos | `composeEmail()` — busca por `'EQUIPAMENTOS INSTALADOS:'` | Strings literais                                                           |

### Observações

- Headers de equipamentos também existem no HTML — busca por `EQUIPAMENTOS INSTALADOS` em `index.html` — manter sincronizado
- Campos vazios em iniciais mostram `—` (em-dash); em retorno manual mostram `(NAO PREENCHIDO)`
- Formato de data no email: DD/MM/YYYY (invertido de YYYY-MM-DD via `formatDate()` — busca por `formatDate(` em `composeEmail()`)
- O retorno usa template se existir — se não, itera `getRetornoFields(tipo)` campo por campo

---

## 3. Templates — variantes, blocos e condições

**Arquivo:** `scripts/data/retorno-templates.js` — busca por `export const retornoTemplates = {`

### Schema completo

```js
export const retornoTemplates = {
  "TIPO DE ORDEM": [          // Array de variantes
    {
      condicao?: Condition,   // Opcional — se não bater, pula para próxima variante
      blocos: [               // Array de blocos
        {
          texto: string,      // Texto com {placeholders} opcionais
          condicao?: Condition // Opcional — bloco omitido se condição for false
        }
      ]
    }
  ]
};
```

### Tipos de condição suportados

| Tipo             | Exemplo                                                                             | Significado                         |
| ---------------- | ----------------------------------------------------------------------------------- | ----------------------------------- |
| Sem condição     | `undefined` / omitido                                                               | Sempre true                         |
| Match simples    | `{ campo: "obra", valor: "CONCLUIDA" }`                                             | `data.retorno.obra === "CONCLUIDA"` |
| Multi-valor (OR) | `{ campo: "motivo", valor: ["SEM ACESSO", "OUTRO"] }`                               | Valor está no array                 |
| Negação          | `{ campo: "viavel_retirar", diferenteDe: "N/A" }`                                   | `data.retorno[campo] !== "N/A"`     |
| AND composto     | `[{ campo: "status", valor: "COM MEDICAO" }, { campo: "tipo", valor: "ACOPLADA" }]` | Todas true                          |

### Cenário A — Template simples (sem variantes)

```js
"NOME DO TIPO": [
  {
    blocos: [
      { texto: "DESCRICAO DO SERVICO: {descricao}" },
    ],
  },
],
```

Uma variante sem `condicao` — sempre usada.

### Cenário B — Com variantes (if/else)

```js
"NOME DO TIPO": [
  {
    condicao: { campo: "executado", valor: "SIM" },
    blocos: [
      { texto: "EXECUTADO: SIM" },
      { texto: "DETALHES: {detalhes}" },
    ],
  },
  {
    // Sem condicao = else (fallback)
    blocos: [
      { texto: "EXECUTADO: NAO" },
      { texto: "MOTIVO: {motivo}" },
    ],
  },
],
```

A primeira variante que der match é usada. Variante sem `condicao` no final = "else".

### Cenário C — Blocos condicionais

```js
{
  blocos: [
    { texto: "SEMPRE VISIVEL: {campo_a}" },
    { texto: "SO APARECE SE PREENCHIDO: {campo_b}", condicao: { campo: "campo_b", diferenteDe: "" } },
  ],
}
```

### Constantes compartilhadas

| Constante                         | Busca por                                   | Usada por                                   |
| --------------------------------- | ------------------------------------------- | ------------------------------------------- |
| `UC_CORTADA_TEMPLATE`             | `const UC_CORTADA_TEMPLATE = [`             | INSPECAO UC CORTADA I15, I30, I90, I180     |
| `DESCRICAO_TEMPLATE`              | `const DESCRICAO_TEMPLATE = [`              | ~31 tipos (fallback padrão)                 |
| `TELEMEDICAO_TEMPLATE`            | `const TELEMEDICAO_TEMPLATE = [`            | TELEMEDIÇÃO MANUTENÇÃO, CLIENTE LIVRE, LOTE |
| `CORTE_DEF_TECNICO_TEMPLATE`      | `const CORTE_DEF_TECNICO_TEMPLATE = [`      | CORTE DE UC POR DEF TECNICO                 |
| `DESLIG_PROG_MANUTENCAO_TEMPLATE` | `const DESLIG_PROG_MANUTENCAO_TEMPLATE = [` | DESLIG.PROG.MANUTENÇÃO                      |
| `LIGACAO_NOVA_MT_TEMPLATE`        | `const LIGACAO_NOVA_MT_TEMPLATE = [`        | LIGACAO NOVA MEDIA TENSAO, MT CLIENTE LIVRE |

Editar uma constante compartilhada afeta todos os tipos que a referenciam.

### Regras

- **Variant matching**: `find()` — para na primeira. Ordem importa.
- **Nenhuma variante bate**: `applyRetornoTemplate()` retorna `null` → fallback manual em `composeEmail()`
- **Template substitui totalmente o fallback**: se existe e variante bate, `getRetornoFields()` NÃO é chamado
- **Blocos condicionais**: mesma lógica de `matchCondition()` — omitidos se condição false
- **`DESCRICAO_TEMPLATE`**: template mínimo com só `{descricao}` — referenciado por ~31 tipos

---

## 4. Placeholders

**Arquivos:** `scripts/data/retorno-templates.js` (definição) + `scripts/email.js` — busca por `function resolvePlaceholders(`

### Como funcionam

`{nome_do_campo}` no texto do template é substituído pelo valor do campo em tempo de composição.

**Ordem de resolução** (`resolvePlaceholders` em `email.js`):

1. Procura em `data.retorno` primeiro
2. Se não encontrou, procura em `data.iniciais`
3. Se não encontrou em nenhum, placeholder permanece literal `{NOME_DO_CAMPO}` no email

### Regras

- **Nome do placeholder = `nome` do campo** em `fields-data.js` (ex: `situacao_corte`, `descricao`, `ramal`)
- **Case-sensitive** — `{situacao_corte}` ≠ `{SITUACAO_CORTE}`
- **Valor vazio** vira string vazia `''` (não `undefined`, não `null`)
- **Shadowing**: campo de retorno com mesmo `nome` de iniciais → retorno prevalece (consultado primeiro)
- **Placeholder não resolvido**: aparece literal no email (após `normalizeText()`, fica em MAIÚSCULAS)

### Exemplo de adição

Para adicionar `{novo_campo}`:

1. Verificar se o campo existe em `retornoFieldsByTipo[tipo]` com `nome: "novo_campo"`
2. Adicionar `{novo_campo}` no `texto` do bloco desejado
3. Resolve automaticamente — não precisa registrar

---

## 5. Normalização de texto

**Arquivo:** `scripts/email.js`, função `normalizeText()` — busca por `function normalizeText(`

```js
function normalizeText(str) {
  if (typeof str !== 'string' || !str) return str;
  return str
    .normalize('NFD') // decompõe acentos (á → a + ´)
    .replace(/[\u0300-\u036f]/g, '') // remove marcas de acento
    .replace(/ç/g, 'c') // cedilha → c
    .replace(/Ç/g, 'C') // cedilha maiúsculo → C
    .toUpperCase(); // tudo maiúsculo
}
```

### Onde é aplicada

`composeEmail()` — cada `normalizeText()` pode ser encontrada buscando por `normalizeText(` no corpo da função:

| Local            | Contexto                            | O que normaliza                                     |
| ---------------- | ----------------------------------- | --------------------------------------------------- |
| Iniciais         | `iniciaisFields.forEach`            | `normalizeText(field.label)` e `normalizeText(val)` |
| Equipamentos     | `.map()` sobre instalados/retirados | Cada equipamento → valor normalizado                |
| Template         | Após `applyRetornoTemplate()`       | Template inteiro como bloco único                   |
| Retorno fallback | `getRetornoFields(tipo).forEach`    | `normalizeText(field.label)` e `normalizeText(val)` |

### Regras

- **Todo** o corpo do email passa por `normalizeText()` — template e fallback
- Headers de equipamentos NÃO são normalizados (já são ASCII maiúsculo)
- `normalizeText` é chamada em `composeEmail()`, NÃO em `applyRetornoTemplate()` — a normalização acontece depois da resolução de placeholders
- Alterar esta função afeta o email inteiro — `tests/email.test.js` tem testes que verificam este comportamento

---

## 6. Preview ao vivo

**Arquivos:** `email.js` — busca por `export function updateLivePreview(` + `app.js` — busca por `updateLivePreview()` em `handleFieldChange` + `index.html` — busca por `id="preview-corpo"`

### Como funciona

```js
export function updateLivePreview() {
  const data = collectAllData(); // snapshot do state atual
  DOM.previewCorpo.textContent = composeEmail(data); // mesma função do envio
}
```

- Usa **exatamente** a mesma função `composeEmail()` do envio real
- Atualizada em cada `input` e `change` via `handleFieldChange` — busca por `updateLivePreview()` em `app.js`
- Exibida como texto puro (`textContent`) com `whitespace-pre-wrap` no CSS

### Elemento DOM

```html
<div
  id="preview-corpo"
  class="preview-value text-sm text-slate-800 whitespace-pre-wrap leading-relaxed"
>
  —
</div>
```

(`index.html` — busca por `id="preview-corpo"`)

### Regras

- Preview é síncrona e em tempo real — sem debounce
- Qualquer mudança em `composeEmail()` ou templates afeta a preview automaticamente
- Se precisar mudar o estilo visual da preview, editar CSS em `style.css`
- O valor inicial é `—` (em-dash) até o formulário ser preenchido

---

## 7. Backend — validação e envio

**Arquivo:** `netlify/functions/send.cjs` — busca por `exports.handler = async`

### O que o backend faz

- **NÃO modifica** o texto do email — envia exatamente como recebido do frontend
- Validações: subject obrigatório, text obrigatório, payload ≤ 10 MB
- Anexos: máximo 12, máximo 8 MB cada, sanitiza nomes de arquivo
- SMTP: plain text apenas (sem HTML), `rejectUnauthorized: false` para certificados self-signed

### Payload recebido

```json
{
  "subject": "RETORNO DE ORDEM UC 12345 OS 67890 - CORTE POR FALTA DE PAGAMENTO",
  "text": "COORDENADAS: ...\nLIDER: ...\n...",
  "attachments": [{ "filename": "foto.jpg", "content": "<base64>", "encoding": "base64" }]
}
```

### Regras

- 99% das alterações de email são frontend — backend raramente muda
- Variáveis de ambiente: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_TO`
- `SMTP_TO` aceita múltiplos destinatários separados por vírgula

---

## Resumo: pipeline completo

```
retorno-templates.js    fields-data.js       state (collectors.js)
       ↓                     ↓                      ↓
  applyRetornoTemplate()  getRetornoFields()   data.retorno / data.iniciais
       ↓                     ↓                      ↓
       └─────────────────────┴──────────────────────┘
                            ↓
                     composeEmail()
                            ↓
                    normalizeText()
                            ↓
                      Corpo do email
                            ↓
            ┌───────────────┴───────────────┐
            ↓                               ↓
     updateLivePreview()              sendEmail() → POST /api/send
     (preview no DOM)                 (assunto + corpo + anexos)
                                            ↓
                                      send.cjs (SMTP)
```

---

## Situações a evitar

- ❌ Mudar nome de placeholder sem atualizar o `nome` do campo em `fields-data.js`
- ❌ Adicionar campo ao `retornoFieldsByTipo` sem adicionar placeholder no template (campo não aparece no email)
- ❌ Usar placeholder com nome diferente do `nome` do campo — não resolve, aparece literal
- ❌ Template com variante sem fallback (sem `condicao` no final) — se nenhuma bater, email usa fallback manual
- ❌ Criar entrada em `retornoTemplates` sem entrada correspondente em `retornoFieldsByTipo` (teste de integridade falha)
- ❌ Usar `{placeholder}` com acento no nome — resolução é case-sensitive e sem acentos
- ❌ Alterar `composeEmail()` sem rodar `tests/email.test.js`
- ❌ Mudar header de equipamento em `email.js` e esquecer de mudar no HTML — busca por `EQUIPAMENTOS INSTALADOS` e `EQUIPAMENTOS RETIRADOS` nos dois arquivos
- ❌ Esquecer que constantes compartilhadas (`DESCRICAO_TEMPLATE`, `UC_CORTADA_TEMPLATE`) afetam múltiplos tipos

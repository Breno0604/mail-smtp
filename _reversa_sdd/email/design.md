# Email, Design

> Gerado pelo Redator em 2026-06-15

---

## Arquitetura

```
┌──────────────────────┐     POST /api/send      ┌─────────────────────────┐
│   Frontend (SPA)     │ ──────────────────────>  │  Netlify Function       │
│                      │   { subject, text,       │  (netlify/functions/    │
│  composeEmail(data)  │     attachments }        │       send.js)          │
│  updateLivePreview() │                          │                         │
│                      │  <─────────────────────  │  nodemailer → SMTP     │
│  DOM.previewCorpo    │     { success, to }      │                         │
└──────────────────────┘                          └─────────────────────────┘
```

## Fluxo de Composição (`composeEmail`)

```
composeEmail(data)
  │
  ├─ iniciaisFields.forEach(field)
  │   ├─ raw = data.iniciais[field.nome] || ""
  │   ├─ if date → reverse ("2026-06-15" → "15-06-2026")
  │   └─ normalizeText(label) + ": " + normalizeText(val) + "\n"
  │
  ├─ if data.equipamentos.length > 0
  │   ├─ "\n\nEQUIPAMENTOS:"
  │   └─ forEach eq → "CATEGORIA STATUS Nº NUMERO\n"
  │
  └─ retornoFields.forEach(field)
      ├─ if !(field.nome in data.retorno) → skip
      └─ normalizeText(label) + ": " + normalizeText(val || "(nao preenchido)") + "\n"
```

## Exemplo de Saída

```
ORDEM DE SERVICO: 2026-06-001
TIPO DE ORDEM: LIGACAO NOVA
DATA: 15-06-2026
TECNICO: JOAO SILVA
MUNICIPIO: SOBRAL
[...]

EQUIPAMENTOS:
MEDIDOR INSTALADO Nº 123456
DISPLAY INSTALADO Nº 789012

RETORNO:
SITUACAO DO SERVICO: LIGADO
LEITURA: 04521
MEDIDOR INSTALADO: SIM
```

## Estrutura do Payload HTTP

```json
{
  "subject": "OS-2026-06-001 | LIGACAO NOVA | SOBRAL",
  "text": "ORDEM DE SERVICO: ...\n\nRETORNO: ...",
  "attachments": [
    {
      "filename": "foto_red.jpg",
      "content": "base64encodedstring...",
      "encoding": "base64"
    }
  ]
}
```

## Frontend: Prévia ao Vivo

```
DOM.previewCorpo (element <pre> ou <div>)
  └─ textContent = composeEmail({
        iniciais: getIniciaisData(),
        equipamentos: state.equipamentos,
        retorno: getRetornoData()
      })
```

- Chamado em: `state.subscribe()` ou event listeners de alteração
- Única fonte de verdade: `composeEmail()` com dados frescos do DOM + state

## Backend: Configuração SMTP

| Variável | Exemplo | Obrigatória |
|----------|---------|-------------|
| `SMTP_HOST` | `smtp.gmail.com` | Sim |
| `SMTP_PORT` | `465` (default) | Sim |
| `SMTP_USER` | `user@domain.com` | Sim |
| `SMTP_PASS` | `app-password-123` | Sim |
| `SMTP_FROM` | `noreply@domain.com` | Sim (validado regex) |
| `SMTP_TO` | `tech@domain.com,admin@domain.com` | Sim (split por vírgula) |

## Normalização de Texto

```js
normalizeText(str) → str
  .normalize("NFD")           // separa acentos dos caracteres base
  .replace(/[\u0300-\u036f]/g, "")  // remove combining diacritical marks
  .replace(/ç/g, "c")         // substitui cedilha
  .replace(/Ç/g, "C")
  .toUpperCase()              // converte para maiúsculas
```

## Contrato da API (`send.js`)

| Método | Rota | Request Body | Response (200) | Response (4xx/5xx) |
|--------|------|-------------|----------------|-------------------|
| POST | `/api/send` | `{ subject: string, text: string, attachments?: [{filename, content, encoding}] }` | `{ success: true, to: string[] }` | `{ error: string }` |

### Validações do Backend

| Condição | HTTP | Mensagem |
|----------|------|----------|
| Method != POST | 405 | "Method not allowed" |
| Sem `subject` | 400 | "Campo 'assunto' é obrigatório." |
| Sem `text` | 400 | "Campo 'text' é obrigatório." |
| SMTP_FROM ausente/inválido | 500 | "SMTP_FROM inválido ou não configurado." |
| SMTP_TO não configurado | 500 | "SMTP_TO não configurado." |
| SMTP_TO com emails inválidos | 500 | "Emails inválidos em SMTP_TO: ..." |
| Anexos > 12 | 400 | "Máximo de 12 anexos permitido." |
| Anexo > 8MB | 400 | "Anexo '...' excede 8 MB." |
| Erro no transporte | 500 | error.message |

## Dependências

- `nodemailer` (npm): transporte SMTP
- `scripts/fields.js`: `iniciaisFields`, `getRetornoFields()`
- `scripts/iniciais.js`: `getIniciaisData()`
- `scripts/retornos.js`: `getRetornoData()`
- `scripts/dom.js`: `DOM.previewCorpo`
- `scripts/state.js`: `state.equipamentos`

## API Pública (Frontend)

| Função | Parâmetros | Retorno | Descrição |
|--------|-----------|---------|-----------|
| `composeEmail(data)` | `{ iniciais, equipamentos, retorno }` | `string` | Gera corpo do email |
| `updateLivePreview()` | `void` | `void` | Atualiza preview no DOM |
| `normalizeText(str)` | `string` | `string` | Normaliza para uppercase sem acentos |

---

*Fim do design de email.*

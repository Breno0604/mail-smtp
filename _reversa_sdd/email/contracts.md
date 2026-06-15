# Email, Contratos da API

> Gerado pelo Redator em 2026-06-15

---

## POST `/api/send`

### Request

```json
{
  "subject": "string (obrigatório)",
  "text": "string (obrigatório)",
  "attachments": [
    {
      "filename": "string (obrigatório)",
      "content": "string (base64, obrigatório)",
      "encoding": "base64 (opcional, default: base64)"
    }
  ]
}
```

### Response — 200

```json
{
  "success": true,
  "to": ["tech@domain.com"]
}
```

### Response — 400

```json
{
  "error": "Campo 'assunto' é obrigatório."
}
```

### Response — 405

```json
{
  "error": "Method not allowed"
}
```

### Response — 500

```json
{
  "error": "SMTP_FROM inválido ou não configurado."
}
```

## Validações

| Campo | Condição | Código | Mensagem |
|-------|----------|--------|----------|
| `subject` | Presente e string | 400 | "Campo 'assunto' é obrigatório." |
| `text` | Presente e string | 400 | "Campo 'text' é obrigatório." |
| `SMTP_FROM` | Válido regex email | 500 | "SMTP_FROM inválido ou não configurado." |
| `SMTP_TO` | Configurado | 500 | "SMTP_TO não configurado." |
| `SMTP_TO` | Todos emails válidos | 500 | "Emails inválidos em SMTP_TO: ..." |
| `attachments` | ≤ 12 itens | 400 | "Máximo de 12 anexos permitido." |
| `attachments[].content` | ≤ 8MB decoded | 400 | "Anexo '...' excede 8 MB." |

---

*Fim dos contratos de email.*

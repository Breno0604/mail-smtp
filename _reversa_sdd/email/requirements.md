# Email, Requisitos

> Gerado pelo Redator em 2026-06-15
> Cobre os módulos: `scripts/email.js`, `netlify/functions/send.js`

---

## Visão Geral

Sistema de composição e envio de email com SMTP. Opera em duas camadas: frontend compõe o corpo textual a partir dos dados do formulário, backend (Netlify Function) recebe e despacha via nodemailer.

## Responsabilidades

- Compor corpo do email a partir dos dados de iniciais, equipamentos e retorno
- Normalizar texto (remover acentos, uppercase)
- Exibir prévia ao vivo no formulário
- Enviar email via Netlify Function com 6 variáveis de ambiente SMTP
- Validar anexos (máx 12, máx 8MB cada)
- Suportar TLS sem rejeição de auto-assinados (`rejectUnauthorized: false`)

## Regras de Negócio

- RN01: Data é invertida de YYYY-MM-DD para DD-MM-YYYY no corpo do email 🟢
- RN02: Apenas campos de retorno preenchidos (existentes em `data.retorno`) são incluídos no email 🟢
- RN03: Hidden fields (display:none) são filtrados por `getRetornoData()` e não aparecem no email 🟢
- RN04: `composeEmail()` duplamente protege — verifica `field.nome in data.retorno` antes de incluir 🟢
- RN05: Equipamentos são incluídos no email se `data.equipamentos.length > 0`; se vazio, seção "EQUIPAMENTOS" é omitida 🟢
- RN06: Destinatários vêm exclusivamente de `SMTP_TO` (env var), não do formulário 🟢
- RN07: Anexos são validados no backend (máx 12, máx 8MB cada) 🟢
- RN08: Backend rejeita se `SMTP_FROM` está ausente ou em formato inválido 🟢
- RN09: Backend rejeita se `SMTP_TO` não está configurado ou contém emails inválidos 🟢
- RN10: TLS `rejectUnauthorized: false` é intencional para certs auto-assinados em produção 🟢
- RN11: Campos vazios são substituídos por "—" (em dash) no email; campos de retorno vazios mostram "(nao preenchido)" 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Compor corpo do email com dados do formulário | Must | `composeEmail()` gera string com iniciais, equipamentos e retorno |
| RF-02 | Exibir prévia ao vivo do email | Must | `updateLivePreview()` atualiza `DOM.previewCorpo` a cada alteração |
| RF-03 | Enviar email via POST para Netlify Function | Must | Click em "Enviar" faz POST para `/api/send` com subject, text, attachments |
| RF-04 | Validar anexos no backend (limite 12, 8MB) | Must | Backend rejeita 400 se exceder |
| RF-05 | Validar SMTP_FROM e SMTP_TO no backend | Must | Backend retorna 500 com mensagem descritiva |
| RF-06 | Normalizar texto (maiúsculas, sem acentos) | Should | `normalizeText()` aplica NFD + replace ç + toUpperCase |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência | Confiança |
|------|--------------------|-----------|-----------|
| Segurança | Destinatários fixos via env var (não do form) | `send.js:32-35` | 🟢 |
| Confiabilidade | TLS sem rejeição de auto-assinados | `send.js:67` | 🟢 |
| Portabilidade | 6 env vars obrigatórias para deploy | `send.js:23,32,59-66` | 🟢 |
| Testabilidade | `send.js` não testável em CI (SMTP indisponível) | AGENTS.md | 🟢 |

## Critérios de Aceitação

```gherkin
Dado um formulário preenchido
Quando o usuário modifica qualquer campo
Então a prévia ao vivo é atualizada

Dado que o formulário tem data "2026-06-15"
Quando `composeEmail()` gera o corpo
Então a data aparece como "15-06-2026"

Dado que um campo de retorno tem `display: none`
Quando o email é composto
Então esse campo não aparece no corpo

Dado um POST válido para `/api/send`
Com subject, text e attachments
Então o email é despachado via SMTP
E retorna 200 com `{ success: true, to: [...] }`

Dado um POST sem `subject`
Então retorna 400 com erro descritivo

Dado `SMTP_TO` inválido
Então retorna 500 com erro descritivo
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Composição e prévia | Must | Funcionalidade principal |
| Envio via Netlify Function | Must | Backend |
| Validação backend | Must | Segurança |
| Normalização de texto | Should | UX (email mais legível) |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `scripts/email.js` | `normalizeText()`, `composeEmail()`, `updateLivePreview()` | 🟢 |
| `netlify/functions/send.js` | `exports.handler` | 🟢 (não testado em CI) |

---

*Fim dos requisitos de email.*

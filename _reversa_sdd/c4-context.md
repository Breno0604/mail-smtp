# C4 — Diagrama de Contexto (Nível 1)

> Gerado pelo Arquiteto em 2026-06-15

---

## Diagrama

```mermaid
C4Context
  title Diagrama de Contexto — mail-mvp

  Person(tecnico, "Técnico de Campo", "Profissional que executa ordens de serviço em campo")
  Person(gestor, "Gestor", "Recebe os relatórios de OS por email")

  System(mailmvp, "mail-mvp", "Sistema de formulário de OS com envio de email")
  System_Ext(smtp, "Servidor SMTP", "Servidor de email corporativo")
  System_Ext(geolocation, "Geolocation API", "API de geolocalização do navegador")
  System_Ext(netlify, "Netlify Functions", "Plataforma serverless")

  Rel(tecnico, mailmvp, "Preenche formulário de OS", "HTTPS")
  Rel(tecnico, geolocation, "Fornece coordenadas", "Geolocation API")
  Rel(mailmvp, netlify, "Envia dados do email", "HTTPS POST /api/send")
  Rel(netlify, smtp, "Entrega email via SMTP", "SMTP")
  Rel(smtp, gestor, "Entrega relatório de OS", "Email")
  Rel(mailmvp, gestor, "Envia relatório por email", "SMTP (via Netlify)")
```

## Descrição dos Elementos

### Pessoas

| Persona | Descrição |
|---------|-----------|
| **Técnico de Campo** | Usuário principal. Preenche o formulário da OS em campo, anexa fotos e envia o relatório. Usa o app em um dispositivo móvel (offline-first). |
| **Gestor** | Destinatário dos emails. Recebe os relatórios de OS no email corporativo. Não interage diretamente com o sistema. |

### Sistemas

| Sistema | Descrição |
|---------|-----------|
| **mail-mvp** | Sistema SPA PWA que o técnico usa para preencher formulários de OS, anexar imagens e enviar relatórios por email |
| **Servidor SMTP** | Servidor de email corporativo configurado via variáveis de ambiente. Entrega os emails aos destinatários |
| **Geolocation API** | API nativa do navegador que fornece as coordenadas geográficas do técnico |
| **Netlify Functions** | Plataforma serverless que hospeda a função de relay SMTP |

### Relacionamentos

| De | Para | Descrição | Protocolo |
|----|------|-----------|-----------|
| Técnico | mail-mvp | Preenche formulário, anexa arquivos | HTTPS |
| mail-mvp | Netlify Functions | POST com JSON (subject, text, attachments) | HTTPS |
| Netlify Functions | Servidor SMTP | Entrega de email | SMTP |
| Servidor SMTP | Gestor | Email recebido na caixa de entrada | SMTP/POP3/IMAP |

---

*Fim do diagrama de contexto.*

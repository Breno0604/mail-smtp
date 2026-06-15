# C4 — Diagrama de Containers (Nível 2)

> Gerado pelo Arquiteto em 2026-06-15

---

## Diagrama

```mermaid
C4Container
  title Diagrama de Containers — mail-mvp

  Person(tecnico, "Técnico de Campo", "Usuário principal")

  System_Boundary(mailmvp, "mail-mvp") {
    Container(spa, "SPA (Single Page Application)", "HTML + JS + CSS", "Interface do formulário com 5 seções, sidebar e preview de email")
    Container(indexeddb, "IndexedDB", "mail-mvp v3", "Armazenamento local de registros e anexos")
    Container(localstorage, "localStorage", "Chave: mail_form_estado", "Armazena UUID do registro atual")
    Container(sw, "Service Worker", "JavaScript (cache-first)", "Cache de assets estáticos para funcionamento offline")
  }

  System_Ext(netlify, "Netlify Functions", "Node.js + nodemailer")
  System_Ext(smtp, "Servidor SMTP", "SMTP")
  System_Ext(geo, "Geolocation API", "Navegador")

  Rel(tecnico, spa, "Usa", "HTTPS")
  Rel(spa, indexeddb, "Lê/Escreve records + attachments", "IndexedDB API")
  Rel(spa, localstorage, "Lê/Escreve UUID", "localStorage API")
  Rel(spa, sw, "Registra e monitora", "Service Worker API")
  Rel(sw, spa, "Serve assets cacheados", "Cache API")
  Rel(spa, netlify, "POST /api/send", "HTTPS")
  Rel(netlify, smtp, "Envia email", "SMTP")
  Rel(spa, geo, "Obtém coordenadas", "Geolocation API")
```

## Containers

| Container | Tecnologia | Descrição | Persistência |
|-----------|-----------|-----------|-------------|
| **SPA** | HTML5 + CSS3 + Vanilla JS (ES6 modules) | Interface completa com formulário dinâmico, sidebar de histórico, preview de email, upload de anexos | — |
| **IndexedDB** | IndexedDB API (navegador) | Banco NoSQL cliente-side com 2 stores: `records` (registros de OS) e `attachments` (anexos separados) | ✅ Sim, local |
| **localStorage** | Web Storage API | Chave `mail_form_estado` com UUID do registro atual (ponte entre sessões) | ✅ Sim, local |
| **Service Worker** | Service Worker API | Cache-first para assets estáticos. Gerenciamento de versão via `CACHE_NAME`. Exibe modal ao detectar atualização | Cache |

## Comunicação entre Containers

| Origem | Destino | Protocolo | Dados |
|--------|---------|-----------|-------|
| SPA | IndexedDB | IndexedDB API | JSON (records + attachments) |
| SPA | localStorage | localStorage API | UUID string |
| SPA | Service Worker | Service Worker API | Eventos (install, activate, fetch, message) |
| SPA | Netlify Functions | HTTPS POST | JSON: { subject, text, attachments[] } |
| SPA | Geolocation API | Geolocation API | Coordenadas { lat, lon } |

---

*Fim do diagrama de containers.*

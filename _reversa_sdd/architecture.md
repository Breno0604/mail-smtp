# Architecture Overview — mail-mvp

> Gerado pelo Arquiteto em 2026-06-15
> Nível de documentação: **Completo**
> Escala: 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## 1. Visão Geral

O **mail-mvp** é uma aplicação web **PWA (Progressive Web App)** que permite que técnicos de campo preencham formulários de Ordem de Serviço (OS) e os enviem por email via SMTP. O sistema é um **SPA (Single Page Application)** sem backend próprio — a única função servidor é uma **Netlify Function** que faz o relay SMTP.

### Propósito
- Coleta de dados de OS em campo (offline-first)
- Envio de relatório por email em texto plano
- Histórico local de registros com IndexedDB

### Stack Resumida

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Vanilla JS (ES6 modules) + HTML5 + Tailwind CSS |
| Persistência | IndexedDB (store records + attachments) + localStorage |
| Backend | Netlify Functions (Node.js + nodemailer) |
| Testes | Vitest + jsdom |
| Deploy | Netlify (auto-deploy via git push) |

---

## 2. Topologia do Sistema

```
┌─────────────────────────────────────────────────────┐
│                    Navegador                         │
│                                                      │
│  ┌───────────────┐     ┌───────────────────┐        │
│  │   index.html   │     │   Service Worker   │        │
│  │   (shell)      │────▶│   (cache-first)    │        │
│  └───────┬───────┘     └───────────────────┘        │
│          │                                            │
│  ┌───────┴──────────────────────────────────┐        │
│  │           scripts/ (ES6 modules)          │        │
│  │  app.js  dom.js  iniciais.js  retornos.js │        │
│  │  fields.js  validation.js  email.js       │        │
│  │  send.js  attachments.js  compress.js     │        │
│  │  equipment.js  persistence.js  restore.js │        │
│  │  db.js  storage.js  state.js  sidebar.js  │        │
│  │  duplicate.js  reset.js  ui.js  utils.js  │        │
│  │  styles.js  sw-update.js                  │        │
│  └──────────────────┬───────────────────────┘        │
│                     │                                  │
│           ┌─────────┴──────────┐                      │
│           │   IndexedDB         │                      │
│           │  mail-mvp v3       │                      │
│           │  ├─ records        │                      │
│           │  └─ attachments    │                      │
│           └────────────────────┘                      │
└─────────────────────┬────────────────────────────────┘
                      │ POST /api/send
                      ▼
┌─────────────────────────────────────────────────────┐
│           Netlify Function                           │
│     netlify/functions/send.js                        │
│     (nodemailer → SMTP)                             │
│                                                      │
│     SMTP_HOST │ SMTP_PORT │ SMTP_USER               │
│     SMTP_PASS │ SMTP_FROM │ SMTP_TO                 │
└─────────────────────┬────────────────────────────────┘
                      │ SMTP
                      ▼
             ┌──────────────────┐
             │   Servidor SMTP  │
             │   (email corporativo) │
             └──────────────────┘
```

---

## 3. Fluxo de Dados Principal

```
Usuário → Preenche formulário → Auto-save (IndexedDB) → Enviar → Validação
  → Verificação de duplicata → Compressão de imagens → POST /api/send → SMTP
  → Atualiza status para "sent" → Toast de confirmação
```

### Fluxo Offline
```
Usuário → Preenche formulário sem internet → Auto-save local (IndexedDB)
  → Tudo fica salvo como "draft" → Quando houver internet → Envia
  → Se não houver internet no envio → Erro toast → Tenta depois
```

---

## 4. Camadas Arquiteturais

### 4.1 Camada de Apresentação (UI)
- `index.html` — Shell da aplicação com 5 seções
- `style.css` + `tailwind.css` — Estilização
- `scripts/dom.js` — Cache de referências DOM (padrão)

### 4.2 Camada de Formulário (Form)
- `iniciais.js` — Renderização dinâmica dos campos de início
- `retornos.js` — Renderização dinâmica dos campos de retorno (condicionais)
- `fields.js` — Definição de todos os campos (12 iniciais + 41 tipos de ordem)
- `validation.js` — Validação das 5 seções (Strategy Pattern)

### 4.3 Camada de Persistência
- `state.js` — Estado global reativo (singleton)
- `persistence.js` — Save/restore do estado
- `db.js` — IndexedDB CRUD (v3, 2 stores)
- `storage.js` — Intermediário localStorage (quebra ciclo de import)
- `restore.js` — Aplicação de registro ao formulário

### 4.4 Camada de Email
- `email.js` — Composição do corpo do email (texto plano)
- `send.js` — Orquestração do envio (frontend)
- `netlify/functions/send.js` — Netlify Function de relay SMTP

### 4.5 Camada de Anexos
- `attachments.js` — Upload, preview, remoção
- `compress.js` — Compressão progressiva de imagens

### 4.6 Camada de Equipamentos
- `equipment.js` — CRUD de equipamentos na memória

### 4.7 Camada de Histórico
- `sidebar.js` — Sidebar com lista de registros

### 4.8 Camada de Utilitários
- `ui.js` — Toast, error bar, modais
- `utils.js` — Base64, coordenadas, formatação de data
- `reset.js` — Reset completo do formulário
- `duplicate.js` — Prevenção de reenvio duplicado
- `sw-update.js` — Gerenciamento de Service Worker
- `styles.js` — Constantes de classes CSS

---

## 5. Decisões Arquiteturais Chave

| Decisão | Opção Escolhida | Alternativa | Motivação |
|---------|----------------|-------------|-----------|
| Navegação | Single-page layout | Wizard multi-etapas | Todas as seções visíveis simultaneamente para preenchimento rápido em campo |
| Persistência | IndexedDB + localStorage | API REST | Funcionamento offline obrigatório em campo |
| Anexos | Store separado (v3) | Inline no registro | Performance na sidebar |
| Backend | Netlify Function serverless | Servidor dedicado | MVP, deploy zero-config |
| Email | Texto plano | HTML | Compatibilidade com sistemas legados |
| Validação | Inline + cache | Erros globais | Feedback imediato ao usuário |
| Estilo | Tailwind compilado estático | CSS-in-JS ou bundler | Sem necessidade de bundler JS |
| Auth | Nenhuma | Login/sessão | MVP interno para equipe técnica |

---

## 6. Dívidas Técnicas Identificadas

| # | Dívida | Impacto | Localização | Confiança |
|---|--------|---------|-------------|-----------|
| DT01 | Nenhuma autenticação na Netlify Function | Segurança — qualquer um pode enviar email | `send.js` | 🟢 |
| DT02 | CACHE_NAME do SW bumpado manualmente | Esquecer de bumpar = usuários com cache obsoleto | `sw.js` | 🟢 |
| DT03 | Definição de campos em JS puro (não em config) | Requer deploy para adicionar/alterar campos | `fields.js` | 🟢 |
| DT04 | Tailwind purge remove classes dinâmicas | Exige workaround com inline styles | Vários arquivos | 🟢 |
| DT05 | Sem tratamento de concorrência no IndexedDB | Se duas abas salvarem simultaneamente, dados podem conflitar | `db.js` | 🟡 |
| DT06 | Sem migração automática de schema além de v3 | Schema futuro exigiria migração manual | `db.js` | 🟢 |
| DT07 | 17 arquivos de teste para 334 testes — densidade baixa | Cobertura pode estar incompleta | `tests/` | 🟡 |

---

## 7. Integrações Externas

| Sistema | Tipo | Protocolo | Dados | Confiança |
|---------|------|-----------|-------|-----------|
| Servidor SMTP | Email | SMTP (via nodemailer) | Corpo texto + anexos | 🟢 CONFIRMADO |
| Geolocalização (navegador) | API nativa | Geolocation API (HTTP) | Coordenadas "lat, lon" | 🟢 CONFIRMADO |
| Netlify Functions | Serverless | HTTP POST | JSON com email + attachments | 🟢 CONFIRMADO |
| Service Worker Cache | Cache API | Cache-first | Assets estáticos | 🟢 CONFIRMADO |

---

## 8. Métricas do Projeto

| Métrica | Valor |
|---------|-------|
| Arquivos JS | 22 (scripts) + 1 (function) |
| Arquivos de teste | 17 |
| Total de testes | ~334 |
| Tipos de ordem | 41 |
| Técnicos cadastrados | 12 |
| Municípios | 29 |
| Placas de veículo | 12 |
| Stores IndexedDB | 2 (records, attachments) |
| Versão do banco | 3 |
| Versão do cache SW | v60 |

---

*Fim da visão arquitetural.*

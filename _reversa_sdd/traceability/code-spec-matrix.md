# Matriz de Rastreabilidade Código ↔ Especificações

> Gerado pelo Redator em 2026-06-15

---

## Legenda

| Símbolo | Significado |
|---------|-------------|
| 🟢 | Totalmente coberto |
| 🟡 | Parcialmente coberto |
| 🔴 | Não coberto |

## Matriz Principal

| Arquivo | Unit (Pasta) | Requirements | Design | Tasks |
|---------|-------------|:---:|:---:|:---:|
| `scripts/app.js` | `ferramentas/` | 🟢 | 🟢 | 🟢 |
| `scripts/attachments.js` | `anexos/` | 🟢 | 🟢 | 🟢 |
| `scripts/compress.js` | `anexos/` | 🟢 | 🟢 | 🟢 |
| `scripts/db.js` | `persistencia/` | 🟢 | 🟢 | 🟢 |
| `scripts/dom.js` | `ferramentas/` | 🟢 | 🟢 | 🟢 |
| `scripts/duplicate.js` | `sidebar/` | 🟢 | 🟢 | 🟢 |
| `scripts/email.js` | `email/` | 🟢 | 🟢 | 🟢 |
| `scripts/equipment.js` | `equipamentos/` | 🟢 | 🟢 | 🟢 |
| `scripts/fields.js` | `formulario/` | 🟢 | 🟢 | 🟢 |
| `scripts/iniciais.js` | `formulario/` | 🟢 | 🟢 | 🟢 |
| `scripts/persistence.js` | `persistencia/` | 🟢 | 🟢 | 🟢 |
| `scripts/reset.js` | `sidebar/` | 🟢 | 🟢 | 🟢 |
| `scripts/restore.js` | `persistencia/` | 🟢 | 🟢 | 🟢 |
| `scripts/retornos.js` | `formulario/` | 🟢 | 🟢 | 🟢 |
| `scripts/send.js` | `ferramentas/` | 🟢 | 🟢 | 🟢 |
| `scripts/sidebar.js` | `sidebar/` | 🟢 | 🟢 | 🟢 |
| `scripts/state.js` | `persistencia/` | 🟢 | 🟢 | 🟢 |
| `scripts/storage.js` | `persistencia/` | 🟢 | 🟢 | 🟢 |
| `scripts/styles.js` | `ferramentas/` | 🟢 | 🟢 | 🟢 |
| `scripts/sw-update.js` | `ferramentas/` | 🟢 | 🟢 | 🟢 |
| `scripts/ui.js` | `ferramentas/` | 🟢 | 🟢 | 🟢 |
| `scripts/utils.js` | `ferramentas/` | 🟢 | 🟢 | 🟢 |
| `scripts/validation.js` | `validacao/` | 🟢 | 🟢 | 🟢 |
| `netlify/functions/send.js` | `email/` | 🟢 | 🟢 | 🟢 |
| `index.html` | `globals/` | 🟢 | — | — |
| `sw.js` | `globals/` | 🟢 | — | — |
| `netlify.toml` | `globals/` | 🟢 | — | — |
| `package.json` | `globals/` | 🟢 | — | — |
| `manifest.json` | `globals/` | 🟢 | — | — |
| `style.css` | `globals/` | 🟢 | — | — |
| `tailwind.css` | `globals/` | 🟢 | — | — |

## Matriz por Feature (Unidades SDD)

| # | Feature | Arquivos Cobertos | Requirements | Design | Tasks | Contracts |
|---|---------|------------------|:---:|:---:|:---:|:---:|
| 1 | `formulario/` | `fields.js`, `iniciais.js`, `retornos.js` | 🟢 | 🟢 | 🟢 | — |
| 2 | `anexos/` | `attachments.js`, `compress.js` | 🟢 | 🟢 | 🟢 | — |
| 3 | `equipamentos/` | `equipment.js` | 🟢 | 🟢 | 🟢 | — |
| 4 | `email/` | `email.js`, `netlify/functions/send.js` | 🟢 | 🟢 | 🟢 | 🟢 |
| 5 | `persistencia/` | `db.js`, `persistence.js`, `restore.js`, `state.js`, `storage.js` | 🟢 | 🟢 | 🟢 | — |
| 6 | `sidebar/` | `sidebar.js`, `duplicate.js`, `reset.js` | 🟢 | 🟢 | 🟢 | — |
| 7 | `validacao/` | `validation.js` | 🟢 | 🟢 | 🟢 | — |
| 8 | `ferramentas/` | `app.js`, `ui.js`, `utils.js`, `dom.js`, `send.js`, `sw-update.js`, `styles.js` | 🟢 | 🟢 | 🟢 | — |
| — | `globals/` | `index.html`, `sw.js`, `netlify.toml`, `package.json`, `manifest.json`, `style.css`, `tailwind.css` | 🟢 | — | — | — |

## Contagem

| Tipo | Total |
|------|-------|
| Arquivos de código JS | 23 |
| Arquivos de configuração | 7 |
| Units SDD | 8 features + 1 globals |
| Arquivos de spec gerados | 28 (3×8 + 4 email + 1 globals) |
| Cobertura 🟢 | 100% |

## Lacunas

| Item | Severidade | Nota |
|------|-----------|------|
| `netlify/functions/send.js` sem autenticação | 🔴 | Qualquer origem pode POST /api/send |
| CACHE_NAME bumpado manualmente | 🟡 | Risco de erro humano no deploy |
| Sem testes para send.js (backend) | 🟡 | SMTP indisponível em CI |
| Definição de campos em JS puro | 🟡 | Sem schema validation estático |

---

*Fim da matriz de rastreabilidade.*

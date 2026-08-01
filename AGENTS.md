# Mail MVP — AGENTS.md

## Always-on skills

- **clean-code-principles** (`.opencode/skills/clean-code-principles/`): planning, modularity, dependencies and clean code — load **always** before any code change

## Conditional skills

- **retorno-fields-guide** (`.opencode/skills/retorno-fields-guide/`): load **before** any task involving adding, modifying, or creating retorno fields for Tipos de Ordem. Triggered by mentions of "campos de retorno", "novos campos", "Tipo de Ordem", or references to `dados_projeto/tipos_ordem_template.xlsx`. Full spec: `docs/superpowers/specs/2026-06-11-retorno-fields-guide-design.md`.

## Stack

- Frontend: vanilla HTML/CSS/JS (ES6 modules), Tailwind CSS (static), no bundler
- Backend: single Netlify Function at `netlify/functions/send.js` (Node.js + nodemailer)
- Persistence: IndexedDB (`mail-mvp` DB, `records` store) + localStorage (UUID only)
- Tests: Vitest + jsdom, tests
- Deploy: `git push` → Netlify auto-deploys (`npm install` runs on build)

## Dev workflow

- **Local server required**: ES6 modules fail on `file://`. Run `npx netlify dev` (starts dev server + function emulator at localhost)
- **No bundler, no hot reload** — edit files then refresh browser
- **Test commands**: `npm test` (all), `npx vitest run tests/FILE.test.js` (single)
- **Tests skip `send.js`** (SMTP not available in CI)
- **Test setup** (`tests/setup.js`) mocks canvas, crypto, URL, and builds minimal DOM.
- **Deploy**: `git add -A && git commit -m "msg" && git push`
- **Husky pre-commit**: Auto-bumps `CACHE_NAME` in `sw.js` when static assets (JS/CSS/HTML) change. Runs on `git commit`.

## PowerShell Rules (Windows 5.1)

**Este projeto roda em PowerShell 5.1 — não bash/zsh.**

| ❌ Proibido      | ✅ Correto                               |
| ---------------- | ---------------------------------------- |
| `cmd1 && cmd2`   | `cmd1; if ($?) { cmd2 }`                 |
| `cmd1 \|\| cmd2` | `cmd1; if (-not $?) { cmd2 }`            |
| `head -n N`      | `Select-Object -First N`                 |
| `grep "pat"`     | `Select-String "pat"` ou `findstr "pat"` |
| `chmod +x`       | `git update-index --chmod=+x`            |
| `timeout N cmd`  | Evite / use `Start-Job`                  |
| `\` escape       | `` ` `` (acento grave)                   |

- Separador: `;` (sequencial), `; if ($?)` (condicional sucesso), `; if (-not $?)` (condicional falha)
- Strings: `"interpola $var"`, `'literal'`
- Caminhos com espaço: `"C:\pasta\arquivo"`

## Key conventions an agent might miss

- **DOM cache** (`scripts/dom.js`): All DOM lookups happen once in `cacheDOM()`. Import `DOM` from `dom.js`; never call `getElementById` elsewhere (exceto em `validation.js` e `collectors.js` para campos dinâmicos criados após `cacheDOM()`).
- **DOM.tipoOrdem uses a getter** (`dom.js` line 31): `Object.defineProperty` getter always queries DOM live via `document.getElementById('tipo-ordem')`. This avoids stale references when `renderIniciais()` recreates the element. No manual assignment needed.
- **CACHE_NAME** in `sw.js`: Bump this number every time static assets (HTML, CSS, JS) change. Backend-only changes skip this. **Auto-bumped by Husky pre-commit hook**.
- **Tipo de Ordem names** in `scripts/fields.js` must match **exactly** between `iniciaisFields` dropdown options and `retornoFieldsByTipo` keys.
- **Hidden fields excluded from email**: `collectRetorno()` and `collectAllData()` filter `display: none` fields. `composeEmail()` double-checks field exists in data. Both layers protect against sending hidden field values.
- **Validation skips hidden fields**: `validateSection3` checks `group.style.display === "none"` before validating.
- **Backend env vars (6 required)**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_TO`. Recipients come from `SMTP_TO` only — not from form.
- **SMTP TLS**: `rejectUnauthorized: false` is intentional (self-signed certs in production).
- **Conditional fields with empty control value**: `updateConditionalFields()` in `retornos.js` hides conditional fields when the control field has no value (placeholder "Selecione"). This prevents `negado: true` fields from showing prematurely (e.g., `acesso_desligamento` for `DESLIG.PROG.MANUTENCAO`).
- **Idioma (PT/EN)**: Nomes de domínio/negócio (campos de formulário, labels, conceitos do negócio) em **português**; nomes de infraestrutura/utilitários (funções JS, variáveis de sistema, módulos técnicos) em **inglês**. Ex.: `"nome do campo retorno"` (PT, domínio) vs `collectRetorno()` (EN, infraestrutura).
- **showConfirm pattern** (`ui.js`): `showConfirm(message)` returns `Promise<boolean>`. Used for destructive actions (delete record, re-send, coordinates refresh). Always await it before proceeding.
- **Auto-cleanup** (`db.js`): `cleanupOldSentRecords()` removes sent records older than 90 days (including attachments). Called fire-and-forget on startup in `app.js` — no await needed.
- **Keyboard scroll fix** (`app.js`): `visualViewport` resize listener scrolls focused inputs into view on Android keyboards. Uses optional chaining for graceful degradation.
- **Offline error messaging** (`send.js`): On fetch failure, `navigator.onLine` differentiates "Sem internet" vs "Erro no servidor" in the catch block.

## Non-obvious architecture facts

- **No JS navigation between sections**: All 5 sections are flat in HTML (sec-inicio, sec-retorno, sec-equipamentos, sec-anexos, sec-revisao). No prev/next buttons. Old docs listing `animator.js` and `sectionManager.js` are stale — those files don't exist.
- **IndexedDB schema** (`scripts/db.js`): DB `mail-mvp` v3, two stores — `records` (keyPath: uuid) and `attachments` (keyPath: id, index on uuid). Attachments stored separately since v3. Migration from v2 is transparent in `restore.js`.
- **Attachments have dirty tracking** (`persistence.js`): Call `markAttachmentsDirty()` when changing attachments. Without this, new attachments won't persist.
- **saveState guards**: Won't save until UC+OS fields filled (`state.iniciaisValido` flag). Won't save with no data at all.
- **Collectors pattern** (`scripts/collectors.js`): Always use collectors.js to read form data into state (`collectIniciais()`, `collectRetorno()`, `collectEquipamentos()`). Never read DOM directly for data extraction. These are called automatically by `saveState()` and `updateLivePreview()`.
- **Conditional field system** (`retornos.js`): Fields can depend on other fields. Supports string values, arrays, and negation. Parent fields must appear before children in the array (cascading order).
- **Select inputs** get a "Selecione" placeholder `<option>` as first child (in `iniciais.js`).
- **Date in email**: Dates are reversed from YYYY-MM-DD to DD-MM-YYYY in `composeEmail()` (line 27).
- **Coordinates are static per record**: GPS is captured once at form open (or new form creation) via `captureCoordinates()`. The value stays fixed even if the user moves. Refresh requires manual confirmation via `showConfirm()`.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

### Installation

- Installed via `uv tool install "graphifyy[gemini]" --force` — CLI at `%USERPROFILE%\.local\bin\graphify.exe`
- `%USERPROFILE%\.local\bin` must be in `$env:PATH` for the `graphify` command to be found
- `GEMINI_API_KEY` is required for semantic extraction (set as Machine-scoped env var for Windows)

### Graph state

- Current graph: **1,948 nodes, 4,594 edges, 151 communities** (as of Jul 2026)
- Graph is AST-only on `graphify update .` (no API cost). Full pipeline (`graphify .`) uses Gemini for semantic labels (~$0.04/run).

### Commands

| Command                                   | Purpose                                             |
| ----------------------------------------- | --------------------------------------------------- |
| `graphify query "<question>"`             | Answer codebase questions (BFS traversal)           |
| `graphify query "<question>" --dfs`       | Trace a specific path                               |
| `graphify path "<conceptA>" "<conceptB>"` | Shortest path between two concepts                  |
| `graphify explain "<concept>"`            | Explain a node in natural language                  |
| `graphify update .`                       | Incremental re-extraction (AST-only, free)          |
| `graphify .`                              | Full pipeline (AST + Gemini semantic, costs tokens) |

### Updating the graph

- **Always use the CLI** (`graphify update .`) to update the graph — never run Python scripts directly via `graphify.extract` or similar modules.
- Running graphify Python modules directly fails on Windows because `multiprocessing` requires `freeze_support()` in the main module. The CLI handles this correctly.
- `graphify update .` does AST-only extraction (no API cost), backs up previous semantic results, and merges automatically.
- For full semantic update (docs/papers/images), use `/graphify --update` inside the AI assistant — the skill handles subagent dispatch for LLM extraction.

### Rules

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path` and `graphify explain` for focused exploration. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Prefix graphify commands with `$env:PATH = "$env:USERPROFILE\.local\bin;$env:PATH";` in PowerShell sessions where graphify is not found.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- **Never run graphify Python modules directly** (e.g. `from graphify.extract import extract`). Always use the CLI (`graphify update .`, `graphify query "..."`, etc.). Direct Python invocation breaks on Windows due to multiprocessing spawn issues.

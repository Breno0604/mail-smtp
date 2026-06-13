# Mail MVP — AGENTS.md

## Always-on skills
- **clean-code-principles** (`.opencode/skills/clean-code-principles/`): planning, modularity, dependencies and clean code — load **always** before any code change

## Conditional skills
- **retorno-fields-guide** (`.opencode/skills/retorno-fields-guide/`): load **before** any task involving adding, modifying, or creating retorno fields for Tipos de Ordem. Triggered by mentions of "campos de retorno", "novos campos", "Tipo de Ordem", or references to `dados_projeto/tipos_ordem_template.xlsx`. Full spec: `docs/superpowers/specs/2026-06-11-retorno-fields-guide-design.md`.

## Stack
- Frontend: vanilla HTML/CSS/JS (ES6 modules), Tailwind CSS (static), no bundler
- Backend: single Netlify Function at `netlify/functions/send.js` (Node.js + nodemailer)
- Persistence: IndexedDB (`mail-mvp` DB, `records` store) + localStorage backup (`mail_form_estado`)
- Tests: Vitest + jsdom, 394 tests
- Deploy: `git push` → Netlify auto-deploys (`npm install` runs on build)

## Dev workflow
- **Local server required**: ES6 modules fail on `file://`. Run `npx netlify dev` (starts dev server + function emulator at localhost)
- **No bundler, no hot reload** — edit files then refresh browser
- **Test commands**: `npm test` (all), `npx vitest run tests/FILE.test.js` (single)
- **Tests skip `send.js`** (SMTP not available in CI)
- **Test setup** (`tests/setup.js`) mocks canvas, crypto, URL, and builds minimal DOM.
- **Deploy**: `git add -A && git commit -m "msg" && git push`

## Key conventions an agent might miss
- **DOM cache** (`scripts/dom.js`): All DOM lookups happen once in `cacheDOM()`. Import `DOM` from `dom.js`; never call `getElementById` elsewhere.
- **DOM.tipoOrdem is an exception**: It's created dynamically by `renderIniciais()`, so `iniciais.js` line 172 manually assigns `DOM.tipoOrdem = input` after `cacheDOM()` runs. Always re-attach event listeners after renderIniciais().
- **CACHE_NAME** in `sw.js`: Bump this number every time static assets (HTML, CSS, JS) change. Backend-only changes skip this.
- **Tipo de Ordem names** in `scripts/fields.js` must match **exactly** between `iniciaisFields` dropdown options and `retornoFieldsByTipo` keys.
- **Hidden fields excluded from email**: `collectRetorno()` and `collectAllData()` filter `display: none` fields. `composeEmail()` double-checks field exists in data. Both layers protect against sending hidden field values.
- **Validation skips hidden fields**: `validateSection3` checks `group.style.display === "none"` before validating.
- **Backend env vars (6 required)**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_TO`. Recipients come from `SMTP_TO` only — not from form.
- **SMTP TLS**: `rejectUnauthorized: false` is intentional (self-signed certs in production).

## Non-obvious architecture facts
- **No JS navigation between sections**: All 5 sections are flat in HTML (sec-inicio, sec-retorno, sec-equipamentos, sec-anexos, sec-revisao). No prev/next buttons. Old docs listing `animator.js` and `sectionManager.js` are stale — those files don't exist.
- **IndexedDB schema** (`scripts/db.js`): DB `mail-mvp` v3, two stores — `records` (keyPath: uuid) and `attachments` (keyPath: id, index on uuid). Attachments stored separately since v3. Migration from v2 is transparent in `restore.js`.
- **Attachments have dirty tracking** (`persistence.js`): Call `markAttachmentsDirty()` when changing attachments. Without this, new attachments won't persist.
- **saveState guards**: Won't save until UC+OS fields filled (`state.iniciaisValido` flag). Won't save with no data at all.
- **Collectors pattern** (`scripts/collectors.js`): Always use collectors.js to read form data into state (`collectIniciais()`, `collectRetorno()`, `collectEquipamentos()`). Never read DOM directly for data extraction. These are called automatically by `saveState()` and `updateLivePreview()`.
- **Conditional field system** (`retornos.js`): Fields can depend on other fields. Supports string values, arrays, and negation. Parent fields must appear before children in the array (cascading order).
- **Select inputs** get a "Selecione" placeholder `<option>` as first child (in `iniciais.js`).
- **Date in email**: Dates are reversed from YYYY-MM-DD to DD-MM-YYYY in `composeEmail()` (line 27).

## Retorno field definition pattern (`scripts/fields.js`)
Field schema:
```js
{ linha: 1, nome: "field_id", label: "Label Text", tipo: "select|text|number|textarea" }
// Optional: opcoes: [...], condicional: { campoRef: "other_field", valor: "X"|["X","Y"], negado: true }
```
- **condicional.valor**: string (single value) or array (any match). **condicional.negado**: invert logic.
- **linha**: groups fields horizontally (same linha = same flex row).
- Field names in `iniciaisFields` are kebab-case (`tipo-ordem`). Retorno fields use snake_case (`situacao_corte`). Not all retorno types include `FIELD_DESCRICAO`.
- Restoring saved data calls `setRetornoData()` then `updateConditionalFields()` — conditional visibility is re-evaluated.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

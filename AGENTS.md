# Mail MVP — AGENTS.md

## Always-on skills
- **clean-code-principles** (`.opencode/skills/clean-code-principles/`): planning, modularity, dependencies and clean code — load **always** before any code change

## Stack
- Frontend: vanilla HTML/CSS/JS (ES6 modules), Tailwind CSS (static), no bundler
- Backend: single Netlify Function at `netlify/functions/send.js` (Node.js + nodemailer)
- Persistence: IndexedDB (`mail-mvp` DB, `records` store) + localStorage backup (`mail_form_estado`)
- Tests: Vitest + jsdom, 334 tests
- Deploy: `git push` → Netlify auto-deploys (`npm install` runs on build)

## Dev workflow
- **Local server required**: ES6 modules fail on `file://`. Run `npx netlify dev` (starts dev server + function emulator at localhost)
- **No bundler, no hot reload** — edit files then refresh browser
- **Test commands**: `npm test` (all), `npx vitest run tests/FILE.test.js` (single)
- **Tests skip `send.js`** (SMTP not available in CI)
- **Deploy**: `git add -A && git commit -m "msg" && git push`

## Key conventions an agent might miss
- **DOM cache** (`scripts/dom.js`): All DOM lookups happen once in `cacheDOM()`. Import `DOM` from `dom.js`; never call `getElementById` elsewhere.
- **CACHE_NAME** in `sw.js`: Bump this number every time static assets (HTML, CSS, JS) change. Backend-only changes skip this.
- **Tipo de Ordem names** in `scripts/fields.js` must match **exactly** between `iniciaisFields` dropdown options and `retornoFieldsByTipo` keys.
- **Hidden fields excluded from email**: `getRetornoData()` filters `display: none` fields. `composeEmail()` double-checks field exists in data. Both layers protect against sending hidden field values.
- **Validation skips hidden fields**: `validateSection3` checks `group.style.display === "none"` before validating.
- **Backend env vars (6 required)**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_TO`. Recipients come from `SMTP_TO` only — not from form.
- **Notification of change to keep?**: se precisar/Não precisa responder isso.

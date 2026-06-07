# Mail MVP — AGENTS.md

## Stack
- Frontend: HTML5 + Tailwind CSS (CDN) + vanilla JS (ES6 modules)
- Backend: single Netlify Function at `netlify/functions/send.js` (Node.js + `nodemailer`)
- Local storage: IndexedDB (`mail-mvp` DB, `sent_emails` store)
- No build step, no bundler, no TypeScript, no framework
- Deploy: `git push` → Netlify auto-deploys (`npm install` runs on build)

## Entry point
`index.html` loads `<script type="module" src="scripts/app.js">` (not `app.js`).
Legacy `app.js` at root is unused.

## Module structure (`scripts/`)
- `app.js` — entry point, event wiring, bootstrap
- `navigation.js` — section transitions, step indicators, button labels
- `validation.js` — per-section validation, blur validation, data collection
- `equipment.js` — equipment row DOM creation and management
- `iniciais.js` — "Iniciais" field definitions (hardcoded dropdown values for líder, parceiro, município, placa, tipo-ordem), render + data getter
- `retornos.js` — retorno field definitions + render + tipo-ordem modal
- `attachments.js` — file upload, thumbnail preview, lightbox
- `email.js` — composeEmail (preview assembly)
- `send.js` — sendEmail (image compression via Canvas, fetch POST, response)
- `reset.js` — resetForm (clears fields + state, no navigation)
- `state.js` — state object + localStorage save/restore helpers
- `ui.js` — showError/hideError/showToast
- `dom.js` — singleton DOM cache populated by cacheDOM()
- `db.js` — IndexedDB wrappers (openDB, saveRecord)
- `utils.js` — toBase64/blobToBase64/loadImage + `MAX_SIZE`/`SKIP_SIZE` thresholds

## Image compression thresholds (`scripts/utils.js`)
- `MAX_SIZE = 650 * 1024` — target size after compression
- `SKIP_SIZE = 670 * 1024` — files ≤ this skip compression, go as-is
- Files > 670 KB: progressive Canvas resize (up to 10 attempts, scale 0.8 each), JPEG quality 0.9 → 0.7 fallback
- Compressed files renamed to `{basename}_red.jpg`
- Max 12 attachments, 8 MB each (enforced frontend + backend)

## Env vars (6 required in Netlify dashboard)
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_TO`
- `SMTP_TO` supports multiple emails separated by comma
- `SMTP_PORT` 465 → secure: true; other ports → secure: false
- Recipients are read from `SMTP_TO` on the backend — not sent from the form

## Payload & response
- Request: `POST /api/send` with `{ subject, text, attachments }` (no `to`)
- Success response: `{ success: true, to: ["email1", "email2"] }`
- Frontend saves `data.to` + `subject` + `sentAt` to IndexedDB on success

## Redirect
`/api/send` → `/.netlify/functions/send` (status 200, not 301) — defined in `netlify.toml`

## Conventions
- UI language: pt-BR
- `.gitignore`: `node_modules`, `.netlify/`
- No tests, no linter, no typecheck — none planned for MVP
- TLS: `rejectUnauthorized: false` (intentional for self-signed SMTP certs)
- localStorage auto-save on any input/change event (`mail_form_estado` key); restore prompt on page load (Section N of 5 dialog)
- Changing "Tipo de Ordem" after visiting Retorno triggers a confirmation modal that clears retorno fields on confirm

## Orientation overlay
- CSS-only full-screen overlay (`#orientation-overlay`) shown in landscape on short viewports (`max-height: 500px`), forces portrait mode on phones — no JS involved

## Dev workflow
- Local testing: `npx netlify dev` (ES6 modules require HTTP; no `file://`)
- No dev server, no hot reload — static files served by Netlify Functions emulator
- Deploy: `git add -A && git commit -m "msg" && git push`

## Future scope (do not implement until requested)
- PWA, dark mode, fila de envios, deleção automática de rascunhos antigos
- Logs centralizados e deleção automática de registros ≥ 90 dias

# Mail MVP — AGENTS.md

## Always-on skills
- **clean-code-principles** (`.opencode/skills/clean-code-principles/`): planning, modularity, dependencies and clean code — load **always** before any code change

## Stack
- Frontend: HTML5 + Tailwind CSS (local static) + vanilla JS (ES6 modules)
- Backend: single Netlify Function at `netlify/functions/send.js` (Node.js + `nodemailer`)
- Local storage: IndexedDB (`mail-mvp` DB, `records` store)
- PWA: Service Worker (`sw.js`) + Manifest (`manifest.json`) + local icons
- Build step (optional): `npm run build:css` regenerates `tailwind.css` from `tailwind-input.css`
- Tests: Vitest + jsdom (`npm test`)
- No bundler, no TypeScript, no framework
- Deploy: `git push` → Netlify auto-deploys (`npm install` runs on build)

## Entry point
`index.html` loads `<script type="module" src="scripts/app.js">`.

## Module structure (`scripts/`)
- `app.js` — entry point, event wiring, bootstrap
- `animator.js` — section transition animations (slide in/out)
- `sectionManager.js` — showSection, prevSection, nextSection, step indicators, nav buttons, section content rendering
- `validation.js` — per-section validation, blur validation
- `equipment.js` — equipment row DOM creation, management, and collectEquipamentos
- `iniciais.js` — "Iniciais" field definitions (hardcoded dropdown values for líder, parceiro, município, placa, tipo-ordem), render + data getter
- `retornos.js` — retorno field definitions + render + tipo-ordem modal
- `attachments.js` — file upload, thumbnail preview, lightbox
- `email.js` — composeEmail (receives data as parameter, returns body string)
- `send.js` — sendEmail (image compression via Canvas, fetch POST, response)
- `reset.js` — resetForm (clears fields + state, no navigation)
- `state.js` — state object only (re-exports persistence helpers)
- `persistence.js` — saveState, debouncedSave, getCurrentUUID, setCurrentUUID, clearCurrentUUID
- `storage.js` — localStorage save/restore (`mail_form_estado` key)
- `ui.js` — showError/hideError/showToast
- `dom.js` — singleton DOM cache populated by cacheDOM() (convention: never reassign DOM properties outside cacheDOM)
- `db.js` — IndexedDB wrappers (openDB, saveRecord, saveDraft, deleteRecord, updateRecordStatus, getAllRecords, getRecord)
- `utils.js` — toBase64/blobToBase64/loadImage + `MAX_SIZE`/`SKIP_SIZE` thresholds + captureCoordinates
- `compress.js` — compressAttachments (Canvas resize loop)
- `restore.js` — applyRecord (load saved record into form, returns section number)
- `duplicate.js` — duplicate send modal and logic
- `sidebar.js` — renderSidebar, closeSidebar, initSidebarFilter
- `sw-update.js` — SW update detection with reload modal
- `fields.js` — field definitions (iniciaisFields, retornoFields) with hardcoded options
- `styles.js` — dynamic CSS class injection

## Image compression (`scripts/utils.js`)
- `MAX_SIZE = 650 * 1024` — target size after compression
- `SKIP_SIZE = 670 * 1024` — files ≤ this skip compression, sent as-is
- Files > 670 KB: progressive Canvas resize (up to 10 attempts, scale 0.8 each), JPEG quality 0.9 → 0.7 fallback
- Compressed files renamed to `{basename}_red.jpg`

## Backend (`netlify/functions/send.js`)
- Endpoint: `POST /api/send` with `{ subject, text, attachments }` (no `to`)
- Redirect: `/api/send` → `/.netlify/functions/send` (status 200, not 301) — in `netlify.toml`
- Success: `{ success: true, to: ["email1", "email2"] }`
- Frontend saves `data.to` + `subject` + `sentAt` to IndexedDB on success
- Recipients from `SMTP_TO` env var (comma-separated) — not from form
- Attachment limits: max 12, max 8 MB each (enforced frontend + backend)
- Env vars (6 required): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_TO`
- `SMTP_PORT` 465 → `secure: true`; other ports → `secure: false`

## Conventions
- UI language: pt-BR
- TLS: `rejectUnauthorized: false` (intentional for self-signed SMTP certs)
- localStorage auto-save on any input/change (`mail_form_estado` key); restore prompt on page load
- Changing "Tipo de Ordem" after visiting Retorno triggers a confirmation modal that clears retorno fields on confirm

## PWA
- **Service Worker** (`sw.js`): cache-first for static assets, network-only for `/api/`, offline fallback to `/index.html`
- **Cache version**: `CACHE_NAME` in `sw.js` — increment whenever static assets change (HTML, CSS, JS, manifest, icons). Backend-only changes skip this.
- **Orientation overlay**: CSS-only full-screen overlay shown in landscape on short viewports (`max-height: 500px`) — no JS

## Dev workflow
- Local testing: `npx netlify dev` (ES6 modules require HTTP; no `file://`)
- No dev server, no hot reload — static files served by Netlify Functions emulator
- Tests: `npm test` (Vitest + jsdom, 301 tests covering all modules except `send.js`)
- Single test: `npx vitest run tests/validation.test.js`
- Deploy: `git add -A && git commit -m "msg" && git push`

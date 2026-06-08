# Mail MVP — AGENTS.md

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
- `navigation.js` — re-exports from sectionManager.js (backward compatibility)
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

## Image compression thresholds (`scripts/utils.js`)
- `MAX_SIZE = 650 * 1024` — target size after compression
- `SKIP_SIZE = 670 * 1024` — files ≤ this skip compression, go as-is
- Files > 670 KB: progressive Canvas resize (up to 10 attempts, scale 0.8 each), JPEG quality 0.9 → 0.7 fallback
- Compressed files renamed to `{basename}_red.jpg`
- Max 12 attachments, 8 MB each (enforced frontend + backend)

## Attachment persistence
- Attachments saved as base64 in IndexedDB `records` store (`attachments` field)
- On restore, base64 data reconstructed into `File` objects via `base64ToBlob()` in `utils.js`
- Non-image files > 670 KB skip compression, sent as-is

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
- Tests: Vitest + jsdom (268 tests in `tests/`). Run: `npm test`
- No linter, no typecheck
- TLS: `rejectUnauthorized: false` (intentional for self-signed SMTP certs)
- localStorage auto-save on any input/change event (`mail_form_estado` key); restore prompt on page load (Section N of 5 dialog)
- Changing "Tipo de Ordem" after visiting Retorno triggers a confirmation modal that clears retorno fields on confirm

## PWA
- **Service Worker** (`sw.js`): cache-first for static assets (30 files), network-only for `/api/`, offline fallback to `/index.html`
- **Manifest** (`manifest.json`): name "Retorno - Formulário de Envio", display standalone, orientation portrait, theme #2563eb
- **Icons**: `icons/icon-192.png` and `icons/icon-512.png` (blue bg #2563eb, white "R"), generated via `tools/generate-icons.mjs`
- **Headers** (`netlify.toml`): `sw.js` no-cache, `manifest.json` 1h, `icons/*` 1y immutable
- **Cache version**: `CACHE_NAME = 'retorno-v18'` in `sw.js`

### PWA update checklist
Whenever you modify any static asset (HTML, CSS, JS, manifest, icons), you **must** increment the `CACHE_NAME` version in `sw.js` (e.g., `retorno-v5` → `retorno-v6`). This forces the service worker to install a new version, cache the fresh files, and notify the user to reload.

Backend-only changes (`netlify/functions/`) do NOT require a cache bump — the SW uses network-only for `/api/`.

Steps for each deploy that touches static files:
1. Edit the asset files
2. Increment `CACHE_NAME` in `sw.js`
3. Commit and push (`sw.js` changes trigger SW update, which fetches new cache)

## Orientation overlay
- CSS-only full-screen overlay (`#orientation-overlay`) shown in landscape on short viewports (`max-height: 500px`), forces portrait mode on phones — no JS involved

## Dev workflow
- Local testing: `npx netlify dev` (ES6 modules require HTTP; no `file://`)
- No dev server, no hot reload — static files served by Netlify Functions emulator
- Tests: `npm test` (Vitest + jsdom, 268 tests covering all modules except `send.js`)
- Deploy: `git add -A && git commit -m "msg" && git push`

## Future scope (do not implement until requested)
- Dark mode, fila de envios, deleção automática de rascunhos antigos
- Logs centralizados e deleção automática de registros ≥ 90 dias

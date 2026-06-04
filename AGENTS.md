# Mail MVP — AGENTS.md

## Stack
- Frontend: HTML5 + Tailwind CSS (CDN) + vanilla JS
- Backend: single Netlify Function at `netlify/functions/send.js` (Node.js + `nodemailer`)
- Local storage: IndexedDB (`mail-mvp` DB, `sent_emails` store)
- No build step, no bundler, no TypeScript, no framework
- Deploy: `git push` → Netlify auto-deploys (`npm install` runs on build)

## Env vars (6 required in Netlify dashboard)
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_TO`
- `SMTP_TO` supports multiple emails separated by comma
- `SMTP_PORT` 465 → secure: true; other ports → secure: false
- Recipients are read from `SMTP_TO` on the backend — not sent from the form

## Key thresholds (app.js)
- `MAX_SIZE = 650 * 1024` — target size after compression
- `SKIP_SIZE = 670 * 1024` — files ≤ this skip compression, go as-is
- Files > 670 KB: progressive Canvas resize (up to 10 attempts, scale 0.8 each), JPEG quality 0.9 → 0.7 fallback
- Compressed files renamed to `{basename}_red.jpg`
- Max 12 attachments, 8 MB each (enforced frontend + backend)

## Payload & response
- Request: `POST /api/send` with `{ subject, text, attachments }` (no `to`)
- Success response: `{ success: true, to: ["email1", "email2"] }`
- Frontend saves `data.to` + `subject` + `sentAt` to IndexedDB on success

## Redirect
`/api/send` → `/.netlify/functions/send` (status 200, not 301)

## Repo conventions
- UI language: pt-BR
- `fluxo_desenvolvimento.md` = source of truth for scope and roadmap (Portuguese)
- `.gitignore` only excludes `node_modules`
- No tests, no linter, no typecheck — none planned for MVP
- TLS: `rejectUnauthorized: false` (intentional for self-signed SMTP certs)

## Dev workflow
- Local testing requires Netlify CLI: `npx netlify dev`
- No dev server, no hot reload — static files served by Netlify Functions emulator
- Deploy: `git add -A && git commit -m "msg" && git push`

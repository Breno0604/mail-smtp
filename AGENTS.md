# Mail MVP — AGENTS.md (Vue 3 Architecture)

## Always-on skills
- **clean-code-principles** (`.opencode/skills/clean-code-principles/`): planning, modularity, dependencies and clean code — load **always** before any code change

## Conditional skills
- **retorno-fields-guide** (`.opencode/skills/retorno-fields-guide/`): load **before** any task involving adding, modifying, or creating retorno fields for Tipos de Ordem. Triggered by mentions of "campos de retorno", "novos campos", "Tipo de Ordem", or references to `dados_projeto/tipos_ordem_template.xlsx`. Full spec: `docs/superpowers/specs/2026-06-11-retorno-fields-guide-design.md`.

## Stack
- **Frontend**: Vue 3.5 + Vite 6 + TypeScript 5.5 (strict) + Tailwind CSS 4 (`@tailwindcss/vite`) + Vue Router 4.5 + Pinia 3
- **PWA**: `vite-plugin-pwa` + Workbox (replaces manual `sw.js`)
- **Persistence**: Dexie 4 (IndexedDB) — DB `mail-mvp` v4, stores: `records`, `attachments`, `pendingSends`
- **Tests**: Vitest 3 + Vue Test Utils + Pinia Testing + `fake-indexeddb`, jsdom
- **Backend**: Netlify Function `netlify/functions/send.js` (Node.js + nodemailer, CommonJS) — **unchanged**
- **Deploy**: `git push` → Netlify auto-deploys (`npm run build`)

## Dev workflow
- **Dev server**: `npx vite` (or `npm run dev`) — HMR enabled
- **Type check**: `npm run typecheck` (`vue-tsc --noEmit`)
- **Build**: `npm run build` (`vue-tsc --noEmit && vite build`)
- **Test**: `npm test` (all), `npx vitest run tests/path/file.test.js` (single)
- **Test setup** (`tests/setup.ts`) mocks canvas, crypto, FileReader, URL, navigator.geolocation, matchMedia
- **Deploy**: `git add -A && git commit -m "msg" && git push`

## Project Structure

```
src/
├── main.ts                 # App entry: createApp + Pinia + Router
├── App.vue                 # Root layout: header + router-view + global modals
├── router/index.ts         # Routes: / → FormPage
├── pages/
│   └── FormPage.vue        # Orchestrates 5 section components
├── components/
│   ├── SecaoInicio.vue     # Section 1: Iniciais fields (reactive, grouped by linha)
│   ├── SecaoRetorno.vue    # Section 2: Conditional retorno fields (computed activeRetornoFields)
│   ├── SecaoEquipamentos.vue # Section 3: Equipment rows (add/remove)
│   ├── SecaoAnexos.vue     # Section 4: File upload + compress + preview + lightbox
│   ├── SecaoRevisao.vue    # Section 5: Email preview + complemento + send/queue
│   ├── Sidebar.vue         # Dexie live query, filter, edit/delete, slide-in
│   ├── ConfirmModal.vue    # Generic confirm (reads ui.confirmOpen)
│   ├── UpdateModal.vue     # PWA update prompt (SKIP_WAITING)
│   ├── DuplicateModal.vue  # Resend confirmation (emits confirm/cancel)
│   └── OrientationOverlay.vue # Landscape warning on mobile
├── stores/
│   ├── form.ts             # Pinia: form state + IndexedDB persistence (debounced save)
│   └── ui.ts               # Pinia: toast, error, confirm modals
├── composables/
│   ├── useEmail.ts         # composeEmail + normalizeText + reverseDate
│   ├── useValidation.ts    # validateIniciais/Retorno/Equipamentos/All
│   ├── useOnlineStatus.ts  # navigator.onLine reactive
│   └── useOfflineQueue.ts  # queueSend + flushQueue (pendingSends store)
├── constants/
│   └── fields.ts           # iniciaisFields + retornoFieldsByTipo + getRetornoFields (TS port of fields.js)
├── db/
│   └── index.ts            # Dexie MailDB v4 + exported db instance
├── types/
│   └── index.ts            # All TypeScript interfaces
├── utils/
│   ├── format.ts           # formatDate (YYYY-MM-DD → DD-MM-YYYY)
│   ├── base64.ts           # toBase64, blobToBase64, base64ToBlob, loadImage
│   ├── compress.ts         # compressAttachment (canvas, maxWidth, quality)
│   └── coordinates.ts      # captureCoordinates (Geolocation API)
└── styles/
    └── main.css            # @import "tailwindcss" + @fontsource/inter
```

## Key Conventions

### Vue/Composition API
- All components use `<script setup lang="ts">`
- State via Pinia stores (`useFormStore()`, `useUIStore()`)
- Computed for derived state (`activeRetornoFields`, `filteredRecords`, `composeEmail`)
- Watchers for side effects (tipoOrdem change → clear retorno)

### IndexedDB (Dexie)
- **v4 schema**: `records` (uuid PK), `attachments` (++id, uuid index), `pendingSends` (++id, uuid index)
- Auto-save via `watch()` with 1s debounce in `form.ts`
- `pendingSends` flushed on `online` event via `useOfflineQueue`

### Field System (migrated from `fields.js`)
- `iniciaisFields: FieldDefinition[]` — 14 fields, 43 tipo-ordem options
- `retornoFieldsByTipo: Record<string, FieldDefinition[]>` — conditional fields per tipo
- `getRetornoFields(tipo)` — returns fields array or default
- Conditional logic: `condicional: { campoRef, valor: string|string[], negado? }`

### Hidden Fields Excluded
- `composeEmail` only includes fields present in form data
- Validation skips fields not rendered (conditional)
- `SecaoRetorno` computes `activeRetornoFields` reactively

### PWA
- `vite-plugin-pwa`: `registerType: 'prompt'`, `cleanupOutdatedCaches: true`
- Manifest from `public/manifest.json`, icons from `public/icons/`
- SW generated by Workbox at `dist/sw.js`
- Update prompt via `UpdateModal` → `registration.waiting.postMessage({type:'SKIP_WAITING'})`

### Offline Email Queue
- `useOfflineQueue.queueSend(uuid, payload)` → `db.pendingSends.put()`
- On `online` event → `flushQueue()` → POST `/api/send` → delete on success
- Button in `SecaoRevisao` shows "Salvar para Envio Offline" when offline

### Netlify Function
- `netlify/functions/send.js` — unchanged, CommonJS
- Receives `{ uuid, body, complemento }` → nodemailer → SMTP
- Dev proxy: `/api` → `http://localhost:8888` (netlify dev)

## Non-obvious Architecture Facts

- **No section navigation** — all 5 sections render vertically in `FormPage.vue`
- **Sidebar trigger** — floating button (☰) when closed, slides in from left
- **Dexie live queries** — not used directly; `Sidebar` loads on open
- **Attachment previews** — `URL.createObjectURL` + cleanup on remove
- **Coordinate capture** — GPS button in `SecaoInicio` calls `captureCoordinates()`
- **Date format** — `formatDate` reverses YYYY-MM-DD → DD-MM-YYYY in email
- **Text normalization** — `normalizeText` removes accents, ç→c, uppercase

## Retorno Field Definition Pattern (`src/constants/fields.ts`)

```ts
interface FieldDefinition {
  linha?: number;
  nome: string;
  label: string;
  tipo: 'text' | 'number' | 'select' | 'textarea' | 'date' | 'time' | 'coordinates';
  obrigatorio?: boolean;
  readonly?: boolean;
  opcoes?: string[];
  condicional?: {
    campoRef: string;
    valor: string | string[];
    negado?: boolean;
  };
}
```

- **condicional.valor**: string (single) or array (any match). **negado**: invert logic.
- **linha**: groups fields horizontally (same linha = flex row).
- `iniciaisFields` keys are kebab-case (`tipo-ordem`). Retorno fields use snake_case (`situacao_corte`).
- Adding new tipo-ordem: add to `iniciaisFields[7].opcoes` AND add entry in `retornoFieldsByTipo`.

## Graphify

Knowledge graph at `graphify-out/` (754 nodes, 1,299 edges, 51 communities).

### Commands
```bash
graphify query "<question>"     # Answer codebase questions (BFS)
graphify path "<A>" "<B>"       # Shortest path between concepts
graphify explain "<concept>"    # Explain a node
graphify update .               # Incremental AST-only (free)
graphify .                      # Full pipeline (Gemini semantic, ~$0.04)
```

### Rules
- Use `graphify query` first for codebase questions
- Prefix with `$env:PATH = "$env:USERPROFILE\.local\bin;$env:PATH";` in PowerShell
- Run `graphify update .` after code changes (AST-only, no API cost)

## Removed (Phase 8 Cleanup)
- `scripts/*.js` (24 files) — replaced by Vue components/composables/stores
- `sw.js` — replaced by `vite-plugin-pwa`
- `tailwind-input.css` / `tailwind.css` / `tailwind.config.js` / `postcss.config.js` — replaced by `@tailwindcss/vite`
- `vitest.config.js` / `playwright.config.js` — replaced by `vitest.config.ts`
- Old tests in `tests/*.test.js` — replaced by new test structure
- Root `manifest.json` / `icons/` / `style.css` / `index.html` — moved to `public/` and `src/`
# Record Management — Design Spec

## Summary

Replace the current localStorage auto-save + IndexedDB `sent_emails` store with a unified IndexedDB-based record management system. Add a sidebar to browse/edit/delete records, real-time auto-save to IndexedDB, and pre-send duplicate detection.

## Architecture

Single IndexedDB store `records` with UUID keyPath, plus a `sessionStorage` key `currentUUID` to track the active draft. localStorage is removed entirely.

## IndexedDB Schema

### Store: `records`

- Key path: `uuid` (string, manually generated UUID)
- No auto-increment

### Record shape

```js
{
  uuid: string,
  status: "draft" | "sent",
  createdAt: ISO 8601 string,
  updatedAt: ISO 8601 string,
  currentSection: number,
  iniciais: object,
  tipoOrdem: string,
  equipamentos: array,
  lastTipoOrdem: string,
  visitedRetorno: boolean,
  composicao: { complementoCorpo: string }, // textarea value from section 5 (previously not persisted)
  sentData: { to: string[], subject: string, sentAt: string } | null
}
```

### Migration

- DB version bumped from 1 to 2
- `onupgradeneeded`: drop old `sent_emails` store, create `records` store
- Existing sent records in `sent_emails` are lost on upgrade (app is not yet in production)

## Auto-save & UUID Lifecycle

1. **On first input** (any input/change event): if no `sessionStorage.currentUUID`, generate a UUID via `crypto.randomUUID()`, create IndexedDB record with `status: "draft"`, store UUID in `sessionStorage`
2. **On every input/change**: persist full form state to IndexedDB under `currentUUID`, update `updatedAt`
3. **On page load**: if `sessionStorage.currentUUID` exists in IndexedDB, show restore prompt ("Há um rascunho salvo. Deseja continuar de onde parou?")
4. **On "Limpar tudo"**: clear `sessionStorage.currentUUID`; next input starts fresh draft
5. **On successful send**: update `status → "sent"`, populate `sentData`
6. **On Edit from sidebar**: set `sessionStorage.currentUUID` to clicked record's UUID, load data, navigate to saved `currentSection`

## Sidebar (Menu Sanduíche)

### Hamburger button

- Fixed position at top-left of viewport (`top: 16px; left: 16px; z-index: 50`)
- Icon: ☰ (three horizontal lines)
- Always visible

### Sidebar panel

- Fixed, slides in from left, 320px wide, full viewport height
- Light background, subtle shadow
- Header: title "Registros" + close button (✕)
- Dark overlay behind the sidebar (`z-index: 40`)
- Toggled via `.sidebar-open` class on body

### Record list

- Sorted by `updatedAt` descending (most recent first)
- Each item shows:
  - OS/UC badge: e.g. "OS #12345 — UC 67890" or "(rascunho vazio)" if no OS/UC
  - Status pill: "Rascunho" (gray background) or "Enviado" (green)
  - Last updated: formatted `dd/mm/aaaa HH:MM`
  - Two icon-only buttons: ✏️ Editar, 🗑️ Excluir
- Empty state: centered text "Nenhum registro encontrado."

### Edit action

- Sets `sessionStorage.currentUUID` to the record's UUID
- Loads all form fields from the record data
- Navigates to the saved `currentSection`
- Closes sidebar

### Delete action

- Confirmation prompt: "Excluir este registro? Esta ação não pode ser desfeita."
  - Cancel: close prompt, no action
  - Confirm: remove record from IndexedDB, refresh sidebar list
- If the deleted record was the current draft, clear `sessionStorage.currentUUID`

## Duplicate Prevention

- On "Enviar" click, before send logic: look up `currentUUID` in IndexedDB
- If `record.status === "sent"`: show a modal
  - Title: "Registro já enviado"
  - Body: "Este registro (OS #12345) já foi enviado com sucesso em 15/05/2026 14:30. Deseja realizar um novo envio mesmo assim?"
  - Buttons: "Cancelar" (closes modal) and "Reenviar" (proceeds to send)
- On "Reenviar": run normal `sendEmail()` flow, update existing record's `sentData` and `updatedAt`
- If `status !== "sent"` or record not found: proceed normally

## File Changes

### New files

- `scripts/sidebar.js` — sidebar DOM creation, record listing, edit/delete handlers
- `scripts/duplicate.js` — pre-send UUID check and confirmation modal

### Modified files

- `scripts/db.js` — new IndexedDB schema (version 2, `records` store), CRUD operations (saveDraft, getRecord, getAllRecords, deleteRecord, updateRecordStatus)
- `scripts/state.js` — replace localStorage calls with IndexedDB auto-save; add `currentUUID`, `composicao` field
- `scripts/app.js` — integrate sidebar init, wire duplicate check into send flow; change restore to use IndexedDB
- `scripts/send.js` — on success, update IndexedDB record status to "sent"
- `scripts/reset.js` — clear `sessionStorage.currentUUID` on reset
- `index.html` — add hamburger button HTML, sidebar HTML structure, duplicate modal HTML
- `style.css` — sidebar styles, hamburger button, record list items, duplicate modal

### Unchanged

- `scripts/navigation.js`, `scripts/validation.js`, `scripts/iniciais.js`, `scripts/retornos.js`, `scripts/equipment.js`, `scripts/attachments.js`, `scripts/email.js`, `scripts/utils.js`, `scripts/ui.js`, `scripts/dom.js`

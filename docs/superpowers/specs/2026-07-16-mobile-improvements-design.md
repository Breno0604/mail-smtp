# Mobile Improvements: Manifest PWA + Coordenadas Modal + Keyboard Scroll

**Date:** 2026-07-16
**Status:** Approved
**Scope:** 3 small, independent changes across 3 files

---

## Feature 1: Manifest PWA � scope + id

**File:** `manifest.json`

### Change

Add two fields:

```json
{
  "scope": "/",
  "id": "/",
  ...existing fields unchanged...
}
```

- `scope: "/"` � tells Android the PWA controls the entire origin
- `id: "/"` � unique identifier for Android to manage the installation

### What does NOT change

All existing manifest fields remain as-is.

---

## Feature 2: Coordenadas � Confirmation Modal on Refresh

**File:** `scripts/iniciais.js`

### Problem

The refresh button (`.coord-refresh`) in `createCoordinatesGroup()` calls
`captureCoordinates()` on click. An accidental tap re-captures GPS, overwriting
the stored coordinates for the current record.

### Solution

Wrap the refresh button click handler with the existing `showConfirm()` modal.
If the user confirms, `captureCoordinates()` runs. If cancelled, nothing happens.

#### Current behavior (iniciais.js line 88-91)

```javascript
refreshBtn.addEventListener('click', e => {
  e.preventDefault();
  captureCoordinates();
});
```

#### New behavior

```javascript
refreshBtn.addEventListener('click', async e => {
  e.preventDefault();
  const confirmed = await showConfirm(
    'Deseja atualizar as coordenadas GPS? A localiza��o atual ser� substitu�da.'
  );
  if (confirmed) captureCoordinates();
});
```

### Dependencies

- `showConfirm` is already exported from `ui.js` � add to existing import
- No new DOM elements needed (reuses `#confirm-modal`)

---

## Feature 3: Keyboard Scroll � visualViewport Listener

**File:** `scripts/app.js`

### Problem

On Android, when the virtual keyboard opens, the viewport shrinks and the
focused input may be pushed off-screen. The user loses sight of the field
they're typing in.

### Solution

Listen to `window.visualViewport.resize`. When the viewport height changes
(keyboard open/close), scroll the focused element into view with a small delay
to let the layout settle.

#### Code to add (inside `DOMContentLoaded`, after existing setup)

```javascript
window.visualViewport?.addEventListener('resize', () => {
  const focused = document.activeElement;
  if (focused && focused !== document.body) {
    setTimeout(() => {
      focused.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }
});
```

### Why this works

- `visualViewport.resize` fires when the keyboard changes viewport size
- `setTimeout 100ms` waits for browser layout to stabilize
- `scrollIntoView block: 'center'` positions the field in the visible middle
- Optional chaining (`?.`) gracefully degrades on browsers without the API

### What does NOT change

- Existing `pointerdown` blur handler stays as-is
- No CSS changes
- No new modules

---

## Testing

- `npm test` must pass (no behavioral change to existing tests)
- Manual: install PWA on Android ? verify `scope` and `id` present in manifest
- Manual: tap coordinates refresh ? verify modal appears ? confirm ? coordinates update
- Manual: open form on Android ? tap input ? keyboard opens ? field stays visible

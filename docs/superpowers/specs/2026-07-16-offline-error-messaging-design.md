# Offline-Aware Error Messaging

**Date:** 2026-07-16
**Status:** Approved
**Scope:** Single-file change (`scripts/send.js`)

## Problem

When the technician clicks "Enviar" without internet, the current catch block shows a
generic "Erro de conex�o. Tente novamente." message. This does not:

1. Tell the user **why** it failed (offline vs server error)
2. Reassure them that their data is safe (it is � IndexedDB persistence runs before send)
3. Give clear next steps

## Solution

Differentiate between offline and server errors in the `sendEmail()` catch block using
`navigator.onLine`.

### Changed file

`scripts/send.js` � `sendEmail()` function, catch block (currently lines 64�65).

### Current behavior

```javascript
catch (_err) {
  showToast('Erro de conex�o. Tente novamente.', false);
}
```

### New behavior

```javascript
catch (_err) {
  if (!navigator.onLine) {
    showToast(
      'Sem internet � dados salvos. Conecte-se e clique Enviar novamente.',
      false
    );
  } else {
    showToast('Erro no servidor. Tente novamente.', false);
  }
}
```

### Decision logic

| `navigator.onLine`                                                     | Toast message                                                        |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `false`                                                                | "Sem internet � dados salvos. Conecte-se e clique Enviar novamente." |
| `true` (server returned error or network issue despite being "online") | "Erro no servidor. Tente novamente."                                 |

## What does NOT change

- Validation flow (runs before send)
- IndexedDB persistence (runs before send)
- Service Worker
- manifest.json
- Any other file

## Testing

- Manual test: enable Airplane Mode ? click Enviar ? verify toast shows "Sem internet..."
- Manual test: block `/api/send` via DevTools ? click Enviar ? verify toast shows "Erro no servidor..."
- Existing tests: `npm test` must pass (no behavioral change to tested paths)

## Risks

- `navigator.onLine` can return `true` even when behind a captive portal (rare in field).
  The server error branch handles this gracefully.

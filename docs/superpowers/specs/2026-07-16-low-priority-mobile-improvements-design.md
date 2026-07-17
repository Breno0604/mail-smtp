# Low-Priority Mobile Improvements

**Date:** 2026-07-16
**Status:** Approved
**Scope:** 4 independent changes across 4 files

---

## Feature 1: Auto-cleanup sent records > 90 days

**File:** `scripts/db.js`

### Problem

When IndexedDB quota is low, the app shows a generic toast but doesn't help
the user free space. Old sent records accumulate indefinitely.

### Solution

Add `cleanupOldSentRecords()` function in `db.js`:

- Query all records with status `sent`
- Delete records where `sentData.sentAt` is older than 90 days
- Also delete their attachments (via uuid index)
- Call this function on app startup (`DOMContentLoaded` in `app.js`)

### Implementation

```javascript
// db.js � add at the end
const RETENTION_DAYS = 90;

export async function cleanupOldSentRecords() {
  const records = await getAllRecords();
  const now = Date.now();
  const cutoff = now - RETENTION_DAYS * 24 * 60 * 60 * 1000;

  for (const record of records) {
    if (record.status !== 'sent') continue;
    const sentAt = record.sentData?.sentAt;
    if (!sentAt) continue;
    if (new Date(sentAt).getTime() < cutoff) {
      await deleteRecord(record.uuid);
    }
  }
}
```

```javascript
// app.js � add inside DOMContentLoaded, after existing setup
import { cleanupOldSentRecords } from './db.js';
// ... inside DOMContentLoaded:
cleanupOldSentRecords(); // fire-and-forget, no await needed
```

### What does NOT change

- Existing CRUD operations
- Record schema
- Sidebar rendering

---

## Feature 2: Font preload + font-display swap

**File:** `index.html`, `style.css`

### Problem

`@import url()` in `style.css` (line 1) blocks rendering. On slow connections
(3G in the field), text appears unstyled then "jumps" when the font loads.

### Solution

1. Remove `@import url(...)` from `style.css`
2. Add `<link rel="preload">` in `index.html` `<head>` for the Google Fonts CSS
3. Add `font-display=swap` parameter to the font URL
4. The browser downloads the font CSS in parallel, and `swap` shows system font
   immediately until Inter loads

### Implementation

```html
<!-- index.html � add before existing stylesheet links -->
<link
  rel="preload"
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  as="style"
/>
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
/>
```

```css
/* style.css � REMOVE line 1: @import url(...) */
```

---

## Feature 3: Grid 3 columns on mobile

**File:** `style.css`

### Problem

`.preview-grid` forces 2 columns on mobile (`max-width: 640px`). With 12 images
the technician scrolls too much.

### Solution

Change from 2 to 3 columns:

```css
/* style.css � line 610-614 */
@media (max-width: 640px) {
  .preview-grid {
    grid-template-columns: repeat(3, 1fr) !important;
  }
}
```

---

## Feature 4: Online/offline indicator dot

**Files:** `index.html`, `style.css`, `scripts/app.js`

### Problem

No visual indicator of connectivity status. The user only discovers they're
offline when the send fails.

### Solution

Add a small colored dot after the title "Retorno de Ordens" in the header:

- Green = online
- Red = offline
- Updates in real-time via `online`/`offline` events

### Implementation

**index.html** � after the `<h1>` tag (line 33), add:

```html
<span class="status-dot" id="status-dot" aria-label="Status de conex�o"></span>
```

**style.css** � add:

```css
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-left: 6px;
  vertical-align: middle;
  transition: background-color 0.3s ease;
}
.status-dot.online {
  background-color: #16a34a;
}
.status-dot.offline {
  background-color: #dc2626;
}
```

**scripts/app.js** � add inside DOMContentLoaded:

```javascript
// Online/offline indicator
const statusDot = document.getElementById('status-dot');
function updateStatusDot() {
  if (!statusDot) return;
  statusDot.classList.toggle('online', navigator.onLine);
  statusDot.classList.toggle('offline', !navigator.onLine);
}
updateStatusDot();
window.addEventListener('online', updateStatusDot);
window.addEventListener('offline', updateStatusDot);
```

**index.html** � reduce title font size from `text-xl` to `text-lg`:

```html
<h1 class="text-lg text-slate-900 font-bold m-0 tracking-tight">Retorno de Ordens</h1>
```

---

## Testing

- `npm test` must pass
- Manual: open app ? verify dot is green ? enable airplane mode ? verify dot turns red
- Manual: verify Inter font loads without layout shift on slow connection
- Manual: verify preview grid shows 3 columns on mobile viewport
- Manual: verify sent records older than 90 days are cleaned up on startup

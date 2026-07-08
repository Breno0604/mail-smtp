# Filtro UC/OS na Sidebar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real-time filter input to the sidebar that searches records by UC or OS.

**Architecture:** A single `<input>` above the record list in the sidebar sidebar. On every keystroke, `renderSidebar()` filters the already-loaded records array by `iniciais.uc` or `iniciais.os` (case-insensitive). No backend or IndexedDB changes.

**Tech Stack:** Vanilla JS, IndexedDB (unchanged), HTML + Tailwind

---

### Task 1: Add filter input to sidebar HTML

**Files:**

- Modify: `index.html:110-118`

- [ ] **Step 1: Insert the search input**

Add an `<input type="search">` inside `.sidebar-inner`, between `.sidebar-head` and `.sidebar-list`:

```html
<div class="sidebar" id="sidebar">
  <div class="sidebar-inner">
    <div class="sidebar-head">
      <h2 class="sidebar-title">Registros</h2>
      <button class="sidebar-close" id="sidebar-close">&times;</button>
    </div>
    <input
      type="search"
      id="sidebar-filter"
      placeholder="Buscar por UC ou OS..."
      autocomplete="off"
      class="w-full px-3 py-2 mb-3 border border-gray-300 rounded-lg text-sm font-sans text-gray-900 bg-white outline-none transition-colors focus:border-blue-600 focus:ring-3 focus:ring-blue-600/15"
    />
    <div class="sidebar-list" id="sidebar-list"></div>
  </div>
</div>
```

- [ ] **Step 2: Verify the HTML renders**

Run: Open `index.html` (via `npx netlify dev` or browser preview) — confirm the input appears between "Registros" title and the record list.

---

### Task 2: Cache the filter input in DOM

**Files:**

- Modify: `scripts/dom.js:33-36`

- [ ] **Step 1: Add `DOM.sidebarFilter` reference**

Append after `DOM.sidebarList`:

```javascript
DOM.sidebarFilter = document.getElementById('sidebar-filter');
```

---

### Task 3: Add filtering logic to sidebar

**Files:**

- Modify: `scripts/sidebar.js:1-101`

- [ ] **Step 1: Add filter parameter to `renderSidebar`**

Change the function signature and add filtering logic immediately after records are sorted:

```javascript
export async function renderSidebar(filterTerm) {
  const list = DOM.sidebarList;
  list.innerHTML = "";

  let records;
  try {
    records = await getAllRecords();
  } catch (e) {
    list.innerHTML = '<div class="sidebar-empty">Erro ao carregar registros.</div>';
    return;
  }

  if (!records || records.length === 0) {
    list.innerHTML = '<div class="sidebar-empty">Nenhum registro encontrado.</div>';
    return;
  }

  records.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  if (filterTerm) {
    const term = filterTerm.toString().toLowerCase();
    records = records.filter((r) => {
      const uc = (r.iniciais?.uc ?? "").toString().toLowerCase();
      const os = (r.iniciais?.os ?? "").toLowerCase();
      return uc.includes(term) || os.includes(term);
    });
    if (records.length === 0) {
      list.innerHTML = `<div class="sidebar-empty">Nenhum registro encontrado para "${filterTerm}".</div>`;
      return;
    }
  }
  // ... rest of the function unchanged
```

- [ ] **Step 2: Wire the input event listener**

After the `forEach` loop in `renderSidebar` (or at module init), add the event listener. The best place is after `DOM.sidebarFilter` is available — add a call in `app.js` or export an init function.

Add this to the end of `sidebar.js`:

```javascript
export function initSidebarFilter() {
  DOM.sidebarFilter.addEventListener('input', () => {
    renderSidebar(DOM.sidebarFilter.value);
  });
}
```

- [ ] **Step 3: Call `initSidebarFilter` from app.js**

In `scripts/app.js`, after `cacheDOM()` and other sidebar setup:

```javascript
import { initSidebarFilter } from './sidebar.js';
// ...
initSidebarFilter();
```

- [ ] **Step 4: Verify filtering works**

1. Open the sidebar — input is visible
2. Type a UC number (e.g. "123") — list filters to matching records
3. Type an OS number (e.g. "456") — list filters to matching records
4. Clear the input — full list restores
5. Type gibberish — "Nenhum registro encontrado para ..." appears

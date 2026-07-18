# Send Feedback Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Replace auto-dismissing toast notifications with a persistent modal for send feedback messages in send.js.

**Architecture:** Add a new #send-modal HTML element following the existing modal pattern. Create showSendModal(msg, success) in ui.js. Update send.js to call it instead of showToast. Add DOM cache entries and minimal CSS for the icon.

**Tech Stack:** HTML5, CSS3, vanilla JS (ES6 modules)

---

## File Map

| File            | Changes                                                                       |
| --------------- | ----------------------------------------------------------------------------- |
| index.html      | Add #send-modal HTML after #anexos-modal                                      |
| scripts/dom.js  | Cache 4 new elements: sendModal, sendModalText, sendModalClose, sendModalIcon |
| scripts/ui.js   | Add showSendModal(msg, success) function                                      |
| scripts/send.js | Replace 4� showToast with showSendModal, update import                        |
| style.css       | Add #send-modal-icon style                                                    |

---

### Task 1: Add #send-modal HTML

**Files:**

- Modify: index.html:305 (after #anexos-modal closing div)

- [ ] **Step 1: Add the modal HTML**

After the #anexos-modal block (line 305), add:

`html
    <div
      class="modal-overlay fixed inset-0 bg-black/40 z-50 flex items-center justify-center hidden"
      id="send-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-modal-text"
    >
      <div class="modal bg-white rounded-[10px] p-7 max-w-[420px] w-[90%] shadow-xl text-center">
        <p class="text-3xl mb-3" id="send-modal-icon"></p>
        <p class="text-sm text-slate-600 mb-6 leading-relaxed" id="send-modal-text"></p>
        <button class="btn btn-primary" id="send-modal-close">Fechar</button>
      </div>
    </div>
`

- [ ] **Step 2: Verify HTML is valid**

Run:
px netlify dev
Open DevTools > Elements tab. Confirm #send-modal exists with correct structure. The modal should be hidden by default (hidden class).

- [ ] **Step 3: Commit**

`ash
git add index.html
git commit -m "feat: add send feedback modal HTML structure"
`

---

### Task 2: Cache modal elements in dom.js

**Files:**

- Modify: scripts/dom.js:88-90 (after nexosModal cache entries)

- [ ] **Step 1: Add DOM cache entries**

After the nexosModal block (line 90), add:

`javascript
  fresh.sendModal = document.getElementById('send-modal');
  fresh.sendModalIcon = document.getElementById('send-modal-icon');
  fresh.sendModalText = document.getElementById('send-modal-text');
  fresh.sendModalClose = document.getElementById('send-modal-close');
`

- [ ] **Step 2: Commit**

`ash
git add scripts/dom.js
git commit -m "feat: cache send modal DOM elements"
`

---

### Task 3: Add showSendModal() to ui.js

**Files:**

- Modify: scripts/ui.js (add after showAnexosModal function, line 112)

- [ ] **Step 1: Add the showSendModal function**

After the showAnexosModal function, add:

`javascript
export function showSendModal(msg, success) {
DOM.sendModalIcon.textContent = success ? '\u2705' : '\u274C';
DOM.sendModalText.textContent = msg;
DOM.sendModal.classList.remove('hidden');

const close = () => {
DOM.sendModal.classList.add('hidden');
DOM.sendModalClose.onclick = null;
DOM.sendModal.onclick = null;
};

DOM.sendModalClose.onclick = close;
DOM.sendModal.onclick = e => {
if (e.target === DOM.sendModal) close();
};
}
`

- [ ] **Step 2: Commit**

`ash
git add scripts/ui.js
git commit -m "feat: add showSendModal function for persistent feedback"
`

---

### Task 4: Update send.js to use showSendModal

**Files:**

- Modify: scripts/send.js:4 (import line)
- Modify: scripts/send.js:48,61,66,68 (showToast calls)

- [ ] **Step 1: Update import**

Change line 4 from:
`javascript
import { showToast, showConfirm } from './ui.js';
`

To:
`javascript
import { showSendModal, showConfirm } from './ui.js';
`

- [ ] **Step 2: Replace showToast call on line 48 (success)**

Change:
`javascript
      showToast('Email enviado com sucesso!', true);
`

To:
`javascript
      showSendModal('Email enviado com sucesso!', true);
`

- [ ] **Step 3: Replace showToast call on line 61 (API error)**

Change:
`javascript
      showToast(responseData.error || 'Erro ao enviar email.', false);
`

To:
`javascript
      showSendModal(responseData.error || 'Erro ao enviar email.', false);
`

- [ ] **Step 4: Replace showToast call on line 66 (offline)**

Change:
`javascript
      showToast('Sem internet � dados salvos. Conecte-se e clique Enviar novamente.', false);
`

To:
`javascript
      showSendModal('Sem internet � dados salvos. Conecte-se e clique Enviar novamente.', false);
`

- [ ] **Step 5: Replace showToast call on line 68 (server error)**

Change:
`javascript
      showToast('Erro no servidor. Tente novamente.', false);
`

To:
`javascript
      showSendModal('Erro no servidor. Tente novamente.', false);
`

- [ ] **Step 6: Verify no remaining showToast references in send.js**

Run: indstr "showToast" scripts/send.js
Expected: no output (0 matches)

- [ ] **Step 7: Commit**

`ash
git add scripts/send.js
git commit -m "feat: replace toast with send modal in send.js"
`

---

### Task 5: Add CSS for send modal icon

**Files:**

- Modify: style.css (add at end of file)

- [ ] **Step 1: Add icon style**

Append to style.css:

`css
/* === Send modal icon === */
#send-modal-icon {
  font-size: 2.5rem;
  line-height: 1;
}
`

- [ ] **Step 2: Commit**

`ash
git add style.css
git commit -m "style: add send modal icon sizing"
`

---

### Task 6: Run tests and verify

- [ ] **Step 1: Run full test suite**

Run:
pm test
Expected: All tests pass (529 tests). No toast-related tests should break because showToast is still exported and used by sidebar.js and persistence.js.

- [ ] **Step 2: Manual verification**

Run:
px netlify dev

1. Fill form completely, click Enviar
2. On success: modal should appear with ? and "Email enviado com sucesso!"
3. Click "Fechar" ? modal closes
4. Try again with network disconnected ? modal with ? and offline message
5. Click outside modal ? modal closes
6. Confirm toast still works in sidebar (load error scenario)

- [ ] **Step 3: Final commit (if any adjustments needed)**

`ash
git add -A
git commit -m "chore: send modal final adjustments"
`

---

## Summary

| Task | File            | Change                               |
| ---- | --------------- | ------------------------------------ |
| 1    | index.html      | Add #send-modal HTML                 |
| 2    | scripts/dom.js  | Cache 4 new elements                 |
| 3    | scripts/ui.js   | Add showSendModal(msg, success)      |
| 4    | scripts/send.js | Replace 4� showToast ? showSendModal |
| 5    | style.css       | Icon sizing                          |
| 6    | �               | Tests + manual verification          |

## Risks

- **None**: showToast remains exported for sidebar.js and persistence.js. No existing tests affected.

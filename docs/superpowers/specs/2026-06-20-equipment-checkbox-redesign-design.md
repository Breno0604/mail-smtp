# Equipment Section Redesign - Checkbox-Based Dynamic Fields

**Date:** 2026-06-20  
**Status:** Approved for Implementation  
**Author:** Project Manager + User Collaboration

---

## 1. Overview

Complete redesign of the "Equipamentos" (Equipment) section, replacing the current row-based system (select + input) with a checkbox-driven dynamic field system.

### Key Changes
- Two new control fields: "Foi instalado Equipamentos?" and "Foi retirado Equipamentos?" (SIM/NAO)
- Two separate sections: "EQUIPAMENTOS INSTALADOS" and "EQUIPAMENTOS RETIRADOS"
- Checkboxes control visibility of individual equipment fields
- Instant persistence on every interaction
- Data cleanup when unchecking fields

---

## 2. Data Structure (state.js)

```javascript
state.equipamentos = {
  instaladoEquip: 'NAO',  // 'SIM' | 'NAO'
  retiradoEquip: 'NAO',   // 'SIM' | 'NAO'
  instalados: {
    medidor: '',
    conjunto: '',
    display: '',
    tc_fase_a: '',
    tc_fase_b: '',
    tc_fase_c: '',
    tp_fase_a: '',
    tp_fase_b: '',
    tp_fase_c: ''
  },
  retirados: {
    medidor: '',
    conjunto: '',
    display: '',
    tc_fase_a: '',
    tc_fase_b: '',
    tc_fase_c: '',
    tp_fase_a: '',
    tp_fase_b: '',
    tp_fase_c: ''
  },
  checkboxes: {
    instalados: {
      medidor: false,
      conjunto: false,
      display: false,
      tc_fase_a: false,
      tc_fase_b: false,
      tc_fase_c: false,
      tp_fase_a: false,
      tp_fase_b: false,
      tp_fase_c: false
    },
    retirados: {
      medidor: false,
      conjunto: false,
      display: false,
      tc_fase_a: false,
      tc_fase_b: false,
      tc_fase_c: false,
      tp_fase_a: false,
      tp_fase_b: false,
      tp_fase_c: false
    }
  }
}
```

---

## 3. HTML Structure (index.html)

### Section Layout

```html
<section class="sec-card mx-2.5 mt-4" id="sec-equipamentos">
  <div class="sec-head">
    <span class="sec-num">3</span> Equipamentos
  </div>
  <div class="sec-body">
    <!-- Control fields -->
    <div class="mb-6 space-y-3">
      <div class="flex items-center justify-between">
        <label for="instalado-equip" class="text-sm font-semibold text-slate-700">Foi instalado Equipamentos?</label>
        <select id="instalado-equip" class="px-3 py-2 border rounded-[10px] text-sm outline-none focus:ring-4 focus:ring-blue-500/10">
          <option value="NAO">NAO</option>
          <option value="SIM">SIM</option>
        </select>
      </div>
      <div class="flex items-center justify-between">
        <label for="retirado-equip" class="text-sm font-semibold text-slate-700">Foi retirado Equipamentos?</label>
        <select id="retirado-equip" class="px-3 py-2 border rounded-[10px] text-sm outline-none focus:ring-4 focus:ring-blue-500/10">
          <option value="NAO">NAO</option>
          <option value="SIM">SIM</option>
        </select>
      </div>
    </div>

    <!-- EQUIPAMENTOS INSTALADOS section -->
    <div id="sec-equip-instalados" class="equip-section hidden">
      <h4 class="text-sm font-bold text-slate-800 mb-3">EQUIPAMENTOS INSTALADOS</h4>
      <div class="grid grid-cols-3 gap-3 mb-4" id="checkboxes-instalados"></div>
      <div class="space-y-2" id="campos-instalados"></div>
    </div>

    <!-- EQUIPAMENTOS RETIRADOS section -->
    <div id="sec-equip-retirados" class="equip-section hidden">
      <h4 class="text-sm font-bold text-slate-800 mb-3">EQUIPAMENTOS RETIRADOS</h4>
      <div class="grid grid-cols-3 gap-3 mb-4" id="checkboxes-retirados"></div>
      <div class="space-y-2" id="campos-retirados"></div>
    </div>
  </div>
</section>
```

### Checkbox Layout (3 columns)

**Line 1:** MEDIDOR | CONJUNTO | DISPLAY  
**Line 2:** TC FASE A | TC FASE B | TC FASE C  
**Line 3:** TP FASE A | TP FASE B | TP FASE C

---

## 4. Dynamic Behavior (equipment.js)

### Initial State
- Sections hidden by default (`hidden` class)
- All checkboxes unchecked
- All input fields empty

### Section Visibility Control
- User selects "SIM" in control field → section appears (simple fade-in)
- User selects "NAO" → section disappears, all checkboxes unchecked, all values cleared

### Field Visibility Control
- Checkbox checked → corresponding input field appears below checkboxes
- Checkbox unchecked → field disappears, value cleared from state

### Persistence
- Every change triggers `saveState()` via `debouncedSave()`
- Full state persisted: selects, checked checkboxes, input values
- On reload: `restore.js` calls `renderEquipamentos()` which restores everything

### Validation
- If "SIM" selected, at least one equipment must have a value filled
- Input fields are numeric (type="number")

---

## 5. Email Format (email.js)

```
EQUIPAMENTOS:
Foi instalado Equipamentos: SIM
EQUIPAMENTOS INSTALADOS:
MEDIDOR: 12345
TC FASE A: 67890

Foi retirado Equipamentos: NAO
```

---

## 6. Animation (CSS)

Simple transition:

```css
.equip-section {
  transition: opacity 0.2s ease, max-height 0.2s ease;
  opacity: 1;
  max-height: 1000px;
  overflow: hidden;
}

.equip-section.hidden {
  opacity: 0;
  max-height: 0;
  display: none;
}
```

---

## 7. Files to Update

| File | Action | Responsibility |
|------|--------|----------------|
| `index.html` | Update | New HTML structure |
| `scripts/equipment.js` | Rewrite | Checkbox and dynamic field logic |
| `scripts/state.js` | Update | New data structure |
| `scripts/collectors.js` | Update | Collect new structure |
| `scripts/dom.js` | Update | Cache new elements |
| `scripts/email.js` | Update | Format new structure in email |
| `scripts/validation.js` | Update | Validate at least one equipment filled |
| `scripts/persistence.js` | Update | "hasData" criteria |
| `scripts/restore.js` | Update | Restore new structure |
| `scripts/reset.js` | Update | Reset checkboxes and fields |
| `scripts/app.js` | Update | Event listeners |
| `tests/*.test.js` | Update | Adapt tests to new structure |

---

## 8. Requirements Checklist

- [x] Sections "Instalados"/"Retirados" separated
- [x] Control fields (SIM/NAO) control section visibility
- [x] Checkboxes control individual field visibility
- [x] Instant persistence (auto-save)
- [x] Data cleanup when unchecking
- [x] Validation (at least one equipment filled when SIM selected)
- [x] Simple animation
- [x] Full restoration on reload
- [x] Numeric input fields
- [x] Label + input on same line

---

## 9. Implementation Notes

### Modularity
- `equipment.js` should have clear separation:
  - Rendering functions (generate HTML)
  - Event handlers (respond to user actions)
  - State management (update state object)
  - Validation helpers

### Testing Strategy
- Unit tests for each function
- Integration tests for persistence/restore cycle
- Email composition tests with new structure
- Validation tests for "at least one equipment" rule

### Migration
- Old records with `equipamentos: []` (array format) need graceful handling
- `restore.js` should detect old format and convert or ignore

---

## 10. Self-Review

### Placeholder Scan
- No TBD/TODO items
- All sections complete

### Internal Consistency
- Data structure matches HTML structure
- Email format matches data structure
- Validation rules align with requirements

### Scope Check
- Focused on equipment section redesign
- Does not touch unrelated features
- Suitable for single implementation plan

### Ambiguity Check
- All requirements explicit
- No dual interpretations found
- Animation duration specified (0.2s)
- Validation rule clear (at least one equipment when SIM)

---

## 11. Next Steps

1. User reviews this spec
2. Invoke `writing-plans` skill to create implementation plan
3. Execute plan with subagents

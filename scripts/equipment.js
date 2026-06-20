import { state } from "./state.js";
import { debouncedSave } from "./persistence.js";

const EQUIPMENT_LIST = [
  { key: 'medidor', label: 'MEDIDOR' },
  { key: 'conjunto', label: 'CONJUNTO' },
  { key: 'display', label: 'DISPLAY' },
  { key: 'tc_fase_a', label: 'TC FASE A' },
  { key: 'tc_fase_b', label: 'TC FASE B' },
  { key: 'tc_fase_c', label: 'TC FASE C' },
  { key: 'tp_fase_a', label: 'TP FASE A' },
  { key: 'tp_fase_b', label: 'TP FASE B' },
  { key: 'tp_fase_c', label: 'TP FASE C' }
];

/**
 * Render all equipment checkboxes into the DOM
 */
export function renderEquipamentos() {
  renderCheckboxes('instalados');
  renderCheckboxes('retirados');
  restoreCheckboxStates();
  restoreFieldStates();
}

function renderCheckboxes(tipo) {
  const container = document.getElementById(`checkboxes-${tipo}`);
  if (!container) return;
  container.innerHTML = '';

  EQUIPMENT_LIST.forEach((equip) => {
    const label = document.createElement('label');
    label.className = 'flex items-center gap-2 cursor-pointer';
    label.innerHTML = `
      <input type="checkbox"
             data-tipo="${tipo}"
             data-equip="${equip.key}"
             class="equip-checkbox w-4 h-4 border border-slate-300 rounded cursor-pointer">
      <span class="text-sm font-medium text-slate-700">${equip.label}</span>
    `;
    container.appendChild(label);
  });
}

function restoreCheckboxStates() {
  ['instalados', 'retirados'].forEach((tipo) => {
    Object.keys(state.equipamentos.checkboxes[tipo]).forEach((key) => {
      if (state.equipamentos.checkboxes[tipo][key]) {
        const checkbox = document.querySelector(`[data-tipo="${tipo}"][data-equip="${key}"]`);
        if (checkbox) {
          checkbox.checked = true;
          showField(tipo, key);
        }
      }
    });
  });
}

function restoreFieldStates() {
  ['instalados', 'retirados'].forEach((tipo) => {
    Object.keys(state.equipamentos[tipo]).forEach((key) => {
      const input = document.querySelector(`#campos-${tipo} [data-equip="${key}"] input`);
      if (input && state.equipamentos[tipo][key]) {
        input.value = state.equipamentos[tipo][key];
      }
    });
  });
}

/**
 * Toggle section visibility based on the control select value
 * @param {'instalados'|'retirados'} tipo - Section type
 */
export function toggleSectionVisibility(tipo) {
  const selectId = tipo === 'instalados' ? 'instalado-equip' : 'retirado-equip';
  const sectionId = `sec-equip-${tipo}`;
  const value = document.getElementById(selectId).value;
  const section = document.getElementById(sectionId);

  if (value === 'SIM') {
    section.classList.remove('hidden');
    state.equipamentos[tipo === 'instalados' ? 'instaladoEquip' : 'retiradoEquip'] = 'SIM';
  } else {
    section.classList.add('hidden');
    state.equipamentos[tipo === 'instalados' ? 'instaladoEquip' : 'retiradoEquip'] = 'NAO';
    clearSection(tipo);
  }

  debouncedSave();
}

function clearSection(tipo) {
  // Reset all checkbox states
  Object.keys(state.equipamentos.checkboxes[tipo]).forEach((key) => {
    state.equipamentos.checkboxes[tipo][key] = false;
    state.equipamentos[tipo][key] = '';
  });

  // Remove all field elements
  const container = document.getElementById(`campos-${tipo}`);
  if (container) container.innerHTML = '';

  // Uncheck all checkboxes in DOM
  const checkboxes = document.querySelectorAll(`[data-tipo="${tipo}"]`);
  checkboxes.forEach((cb) => {
    cb.checked = false;
  });
}

/**
 * Toggle field visibility based on checkbox state
 * @param {'instalados'|'retirados'} tipo - Section type
 * @param {string} equipKey - Equipment key
 * @param {boolean} checked - Whether checkbox is checked
 */
export function toggleFieldVisibility(tipo, equipKey, checked) {
  state.equipamentos.checkboxes[tipo][equipKey] = checked;

  if (checked) {
    showField(tipo, equipKey);
  } else {
    hideField(tipo, equipKey);
    state.equipamentos[tipo][equipKey] = '';
  }

  debouncedSave();
}

function showField(tipo, equipKey) {
  const container = document.getElementById(`campos-${tipo}`);
  if (!container) return;

  // Avoid duplicates
  if (container.querySelector(`[data-equip="${equipKey}"]`)) return;

  const equip = EQUIPMENT_LIST.find((e) => e.key === equipKey);
  if (!equip) return;

  const div = document.createElement('div');
  div.setAttribute('data-equip', equipKey);
  div.className = 'flex items-center justify-between gap-3';
  div.innerHTML = `
    <label class="text-sm font-semibold text-slate-700">${equip.label}</label>
    <input type="number"
           data-tipo="${tipo}"
           data-equip="${equipKey}"
           class="flex-1 max-w-[200px] px-3 py-2 border rounded-[10px] text-sm outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900 font-sans"
           placeholder="">
  `;

  container.appendChild(div);

  // Restore value if exists
  const input = div.querySelector('input');
  if (state.equipamentos[tipo][equipKey]) {
    input.value = state.equipamentos[tipo][equipKey];
  }
}

function hideField(tipo, equipKey) {
  const field = document.querySelector(`#campos-${tipo} [data-equip="${equipKey}"]`);
  if (field) {
    field.remove();
  }
}

/**
 * Update a field value in state
 * @param {'instalados'|'retirados'} tipo - Section type
 * @param {string} equipKey - Equipment key
 * @param {string} value - New value
 */
export function updateFieldValue(tipo, equipKey, value) {
  state.equipamentos[tipo][equipKey] = value;
  debouncedSave();
}

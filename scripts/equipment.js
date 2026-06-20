import { state } from "./state.js";
import { debouncedSave } from "./persistence.js";
import { INPUT_CLASS } from "./styles.js";

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
  // Clear stale field inputs before restoring from state
  const camposInstalados = document.getElementById('campos-instalados');
  const camposRetirados = document.getElementById('campos-retirados');
  if (camposInstalados) camposInstalados.innerHTML = '';
  if (camposRetirados) camposRetirados.innerHTML = '';
  restoreCheckboxStates();
  restoreFieldStates();
}

function renderCheckboxes(tipo) {
  const container = document.getElementById(`checkboxes-${tipo}`);
  if (!container) return;
  container.innerHTML = '';

  // Grid de 6 colunas: checkbox | label | checkbox | label | checkbox | label
  // Garante alinhamento vertical perfeito dos checkboxes e dos labels
  container.className = 'grid grid-cols-6 gap-x-2 gap-y-3 mb-4 items-center';

  EQUIPMENT_LIST.forEach((equip) => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `checkbox-${tipo}-${equip.key}`;
    checkbox.setAttribute('data-tipo', tipo);
    checkbox.setAttribute('data-equip', equip.key);
    checkbox.className = 'equip-checkbox w-4 h-4 flex-shrink-0 border-slate-300 rounded cursor-pointer accent-blue-600 justify-self-center';

    const wrapper = document.createElement('label');
    wrapper.setAttribute('for', `checkbox-${tipo}-${equip.key}`);
    wrapper.className = 'font-semibold text-[13px] text-slate-600 select-none cursor-pointer whitespace-nowrap';

    wrapper.textContent = equip.label;
    container.appendChild(checkbox);
    container.appendChild(wrapper);
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
      const wrapper = document.querySelector(`#campos-${tipo} [data-equip="${key}"]`);
      if (wrapper) {
        const input = wrapper.querySelector('input');
        if (input && state.equipamentos[tipo][key]) {
          input.value = state.equipamentos[tipo][key];
        }
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

  const wrapper = document.createElement('div');
  wrapper.className = 'flex items-center gap-3 mb-4';
  wrapper.setAttribute('data-equip', equipKey);

  const label = document.createElement('label');
  label.className = 'font-semibold text-[13px] text-slate-600 w-[30%] flex-shrink-0';
  label.textContent = equip.label;

  const input = document.createElement('input');
  input.type = 'number';
  input.setAttribute('data-tipo', tipo);
  input.setAttribute('data-equip', equipKey);
  // Replace w-full from INPUT_CLASS with w-[70%] to enforce 30/70 split
  input.className = INPUT_CLASS.replace('w-full', 'w-[70%]');
  input.placeholder = equip.label;

  wrapper.appendChild(label);
  wrapper.appendChild(input);
  container.appendChild(wrapper);

  // Restore value if exists
  if (state.equipamentos[tipo][equipKey]) {
    input.value = state.equipamentos[tipo][equipKey];
  }
}

function hideField(tipo, equipKey) {
  const wrapper = document.querySelector(`#campos-${tipo} [data-equip="${equipKey}"]`);
  if (wrapper) {
    wrapper.remove();
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

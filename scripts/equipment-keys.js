// scripts/equipment-keys.js
// Single source of truth for equipment field definitions.
// Avoids duplicating the 9 equipment keys across state.js, equipment.js, email.js, and tests.

export const EQUIPMENT_KEYS = [
  { key: 'medidor', label: 'MEDIDOR' },
  { key: 'conjunto', label: 'CONJUNTO' },
  { key: 'display', label: 'DISPLAY' },
  { key: 'tc_fase_a', label: 'TC FASE A' },
  { key: 'tc_fase_b', label: 'TC FASE B' },
  { key: 'tc_fase_c', label: 'TC FASE C' },
  { key: 'tp_fase_a', label: 'TP FASE A' },
  { key: 'tp_fase_b', label: 'TP FASE B' },
  { key: 'tp_fase_c', label: 'TP FASE C' },
];

/**
 * Create an object with all equipment keys mapped to empty strings
 * @returns {Object} { medidor: '', conjunto: '', ... }
 */
export function createEmptyEquipmentValues() {
  const obj = {};
  EQUIPMENT_KEYS.forEach(e => {
    obj[e.key] = '';
  });
  return obj;
}

/**
 * Create an object with all equipment keys mapped to false
 * @returns {Object} { medidor: false, conjunto: false, ... }
 */
export function createEmptyCheckboxes() {
  const obj = {};
  EQUIPMENT_KEYS.forEach(e => {
    obj[e.key] = false;
  });
  return obj;
}

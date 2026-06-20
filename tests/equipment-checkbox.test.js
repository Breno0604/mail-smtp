import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderEquipamentos, toggleSectionVisibility, toggleFieldVisibility, updateFieldValue } from '../scripts/equipment.js';
import { state } from '../scripts/state.js';

describe('Equipment checkbox logic', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="instalado-equip">
        <option value="NAO">NAO</option>
        <option value="SIM">SIM</option>
      </select>
      <select id="retirado-equip">
        <option value="NAO">NAO</option>
        <option value="SIM">SIM</option>
      </select>
      <div id="sec-equip-instalados" class="hidden"></div>
      <div id="sec-equip-retirados" class="hidden"></div>
      <div id="checkboxes-instalados"></div>
      <div id="checkboxes-retirados"></div>
      <div id="campos-instalados"></div>
      <div id="campos-retirados"></div>
    `;

    // Reset state
    state.equipamentos = {
      instaladoEquip: 'NAO',
      retiradoEquip: 'NAO',
      instalados: { medidor: '', conjunto: '', display: '', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' },
      retirados: { medidor: '', conjunto: '', display: '', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' },
      checkboxes: {
        instalados: { medidor: false, conjunto: false, display: false, tc_fase_a: false, tc_fase_b: false, tc_fase_c: false, tp_fase_a: false, tp_fase_b: false, tp_fase_c: false },
        retirados: { medidor: false, conjunto: false, display: false, tc_fase_a: false, tc_fase_b: false, tc_fase_c: false, tp_fase_a: false, tp_fase_b: false, tp_fase_c: false }
      }
    };
  });

  it('should render checkboxes for installed equipment', () => {
    renderEquipamentos();
    const checkboxes = document.querySelectorAll('#checkboxes-instalados input[type="checkbox"]');
    expect(checkboxes.length).toBe(9);
  });

  it('should render checkboxes for removed equipment', () => {
    renderEquipamentos();
    const checkboxes = document.querySelectorAll('#checkboxes-retirados input[type="checkbox"]');
    expect(checkboxes.length).toBe(9);
  });

  it('should show installed section when SIM selected', () => {
    document.getElementById('instalado-equip').value = 'SIM';
    toggleSectionVisibility('instalados');
    const section = document.getElementById('sec-equip-instalados');
    expect(section.classList.contains('hidden')).toBe(false);
  });

  it('should hide installed section when NAO selected', () => {
    document.getElementById('instalado-equip').value = 'NAO';
    toggleSectionVisibility('instalados');
    const section = document.getElementById('sec-equip-instalados');
    expect(section.classList.contains('hidden')).toBe(true);
  });

  it('should clear all values when section hidden', () => {
    state.equipamentos.instalados.medidor = '12345';
    state.equipamentos.checkboxes.instalados.medidor = true;
    document.getElementById('instalado-equip').value = 'NAO';
    toggleSectionVisibility('instalados');
    expect(state.equipamentos.instalados.medidor).toBe('');
    expect(state.equipamentos.checkboxes.instalados.medidor).toBe(false);
  });

  it('should show field when checkbox checked', () => {
    renderEquipamentos();
    toggleFieldVisibility('instalados', 'medidor', true);
    const field = document.querySelector('#campos-instalados [data-equip="medidor"]');
    expect(field).not.toBeNull();
  });

  it('should hide field when checkbox unchecked', () => {
    renderEquipamentos();
    toggleFieldVisibility('instalados', 'medidor', true);
    toggleFieldVisibility('instalados', 'medidor', false);
    const field = document.querySelector('#campos-instalados [data-equip="medidor"]');
    expect(field).toBeNull();
  });

  it('should clear field value when checkbox unchecked', () => {
    state.equipamentos.instalados.medidor = '12345';
    toggleFieldVisibility('instalados', 'medidor', false);
    expect(state.equipamentos.instalados.medidor).toBe('');
  });

  it('should update field value in state', () => {
    updateFieldValue('instalados', 'medidor', '99999');
    expect(state.equipamentos.instalados.medidor).toBe('99999');
  });

  it('should render correct checkbox labels', () => {
    renderEquipamentos();
    const labels = document.querySelectorAll('#checkboxes-instalados label span');
    const labelTexts = Array.from(labels).map(el => el.textContent);
    expect(labelTexts).toContain('MEDIDOR');
    expect(labelTexts).toContain('TC FASE A');
    expect(labelTexts).toContain('TP FASE C');
  });
});

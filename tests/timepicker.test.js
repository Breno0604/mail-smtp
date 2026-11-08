import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  HOURS,
  buildMinutes,
  formatTime,
  indexFromScroll,
  openTimePicker,
  splitTime,
} from '../scripts/timepicker.js';
import { createTestDOM } from './helpers/dom-fixture.js';

const picker = () => document.getElementById('time-picker');
const wheel = unit => picker().querySelector(`[data-unit="${unit}"]`);
const activeOption = unit => wheel(unit).querySelector('.time-picker-option.active');
const option = (unit, value) => wheel(unit).querySelector(`[data-value="${value}"]`);
const isOpen = () => !picker().classList.contains('hidden');

const pressKey = (element, key) => {
  const event = new Event('keydown', { bubbles: true });
  Object.defineProperty(event, 'key', { value: key });
  element.dispatchEvent(event);
};

describe('timepicker', () => {
  beforeEach(() => {
    createTestDOM();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('splitTime', () => {
    it('lê o horário existente do campo', () => {
      expect(splitTime('08:30')).toEqual({ hour: 8, minute: 30 });
      expect(splitTime('23:55')).toEqual({ hour: 23, minute: 55 });
    });

    it('usa o horário atual do dispositivo quando o campo está vazio', () => {
      const now = new Date(2026, 0, 1, 14, 37);
      expect(splitTime('', now)).toEqual({ hour: 14, minute: 35 });
    });

    it('não passa dos 55 minutos ao arredondar o horário atual', () => {
      const now = new Date(2026, 0, 1, 14, 58);
      expect(splitTime('', now)).toEqual({ hour: 14, minute: 55 });
    });

    it('ignora valor inválido e cai no horário atual', () => {
      const now = new Date(2026, 0, 1, 9, 5);
      expect(splitTime('99:99', now)).toEqual({ hour: 9, minute: 5 });
    });
  });

  describe('buildMinutes', () => {
    it('oferece os minutos de 5 em 5', () => {
      expect(buildMinutes()).toEqual([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    });

    it('inclui um minuto fora da grade para não alterar o valor existente', () => {
      expect(buildMinutes(7)).toContain(7);
      expect(buildMinutes(7)).toHaveLength(13);
    });
  });

  describe('formatTime', () => {
    it('formata sempre com dois algarismos', () => {
      expect(formatTime(8, 5)).toBe('08:05');
      expect(formatTime(23, 55)).toBe('23:55');
    });
  });

  describe('indexFromScroll', () => {
    it('converte a rolagem no item central', () => {
      expect(indexFromScroll(0, 24)).toBe(0);
      expect(indexFromScroll(88, 24)).toBe(2);
      expect(indexFromScroll(97, 24)).toBe(2);
    });

    it('não sai da lista', () => {
      expect(indexFromScroll(-40, 24)).toBe(0);
      expect(indexFromScroll(99999, 24)).toBe(23);
    });
  });

  describe('openTimePicker', () => {
    it('abre já no horário que está no campo', () => {
      openTimePicker({ title: 'Início', value: '08:30' });

      expect(isOpen()).toBe(true);
      expect(document.getElementById('time-picker-title').textContent).toBe('Início');
      expect(activeOption('hour').textContent).toBe('08');
      expect(activeOption('minute').textContent).toBe('30');
    });

    it('abre no horário atual quando o campo está vazio', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 0, 1, 14, 37));

      openTimePicker({ title: 'Fim', value: '' });

      expect(activeOption('hour').textContent).toBe('14');
      expect(activeOption('minute').textContent).toBe('35');
    });

    it('oferece as 24 horas e os minutos de 5 em 5', () => {
      openTimePicker({ value: '' });

      expect(wheel('hour').querySelectorAll('.time-picker-option')).toHaveLength(24);
      expect(wheel('minute').querySelectorAll('.time-picker-option')).toHaveLength(12);
      expect(HOURS).toHaveLength(24);
    });

    it('devolve o horário escolhido ao salvar e fecha o modal', async () => {
      const result = openTimePicker({ value: '08:30' });

      option('hour', 17).click();
      option('minute', 45).click();
      picker().querySelector('[data-action="save"]').click();

      await expect(result).resolves.toBe('17:45');
      expect(isOpen()).toBe(false);
    });

    it('devolve null ao cancelar, sem aplicar nada', async () => {
      const result = openTimePicker({ value: '08:30' });

      option('hour', 17).click();
      picker().querySelector('[data-action="cancel"]').click();

      await expect(result).resolves.toBeNull();
      expect(isOpen()).toBe(false);
    });

    it('fecha com Esc sem aplicar nada', async () => {
      const result = openTimePicker({ value: '08:30' });

      pressKey(document, 'Escape');

      await expect(result).resolves.toBeNull();
      expect(isOpen()).toBe(false);
    });

    it('permite escolher com as setas do teclado', async () => {
      const result = openTimePicker({ value: '08:30' });

      pressKey(wheel('hour'), 'ArrowDown');
      picker().querySelector('[data-action="save"]').click();

      await expect(result).resolves.toBe('09:30');
    });

    it('fecha ao tocar fora do modal', async () => {
      const result = openTimePicker({ value: '08:30' });

      picker().click();

      await expect(result).resolves.toBeNull();
      expect(isOpen()).toBe(false);
    });
  });
});

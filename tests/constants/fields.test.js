// tests/constants/fields.test.js
import { describe, it, expect } from 'vitest';
import { iniciaisFields, getRetornoFields } from '../../src/constants/fields';

describe('iniciaisFields', () => {
  it('should include all required fields', () => {
    const names = iniciaisFields.map((f) => f.nome);
    ['coordenadas','lider','uc','os','tipo-ordem','data'].forEach(n => expect(names).toContain(n));
  });
  it('should have select tipo with opcoes for lider', () => {
    const lider = iniciaisFields.find((f) => f.nome === 'lider');
    expect(lider.tipo).toBe('select');
    expect(lider.opcoes.length).toBeGreaterThan(0);
  });
  it('should have 43 tipo-ordem options', () => {
    const t = iniciaisFields.find((f) => f.nome === 'tipo-ordem');
    expect(t.opcoes).toHaveLength(43);
  });
});

describe('getRetornoFields', () => {
  it('should return default fields for unknown tipo', () => {
    expect(getRetornoFields('UNKNOWN')[0].nome).toBe('descricao');
  });
  it('should return UC cortada fields for INSPECAO types', () => {
    expect(getRetornoFields('INSPECAO UC CORTADA I15').length).toBeGreaterThan(1);
  });
  it('should have conditional fields', () => {
    const fields = getRetornoFields('VISTORIA DA UC');
    const cond = fields.filter((f) => f.condicional);
    expect(cond.length).toBeGreaterThan(0);
  });
});
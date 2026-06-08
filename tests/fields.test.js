import { describe, it, expect } from 'vitest';
import { iniciaisFields, retornoFields } from '../scripts/fields.js';

describe('fields', () => {
  describe('iniciaisFields', () => {
    it('should be an array', () => {
      expect(Array.isArray(iniciaisFields)).toBe(true);
    });

    it('should have at least 12 entries', () => {
      expect(iniciaisFields.length).toBeGreaterThanOrEqual(12);
    });

    it('should have exactly 12 entries', () => {
      expect(iniciaisFields.length).toBe(12);
    });

    it('should have required fields: lider, parceiro, municipio, uc, os, data, hora_inicio, hora_fim, tipo-ordem, placa, notificado', () => {
      const fields = iniciaisFields.map(f => f.nome);
      expect(fields).toContain('lider');
      expect(fields).toContain('parceiro');
      expect(fields).toContain('municipio');
      expect(fields).toContain('uc');
      expect(fields).toContain('os');
      expect(fields).toContain('data');
      expect(fields).toContain('hora_inicio');
      expect(fields).toContain('hora_fim');
      expect(fields).toContain('tipo-ordem');
      expect(fields).toContain('placa');
      expect(fields).toContain('notificado');
      expect(fields).toContain('coordenadas');
    });

    it('should have correct types for key fields', () => {
      const lider = iniciaisFields.find(f => f.nome === 'lider');
      expect(lider.tipo).toBe('select');
      expect(lider.obrigatorio).toBe(true);

      const uc = iniciaisFields.find(f => f.nome === 'uc');
      expect(uc.tipo).toBe('number');

      const data = iniciaisFields.find(f => f.nome === 'data');
      expect(data.tipo).toBe('date');

      const horaInicio = iniciaisFields.find(f => f.nome === 'hora_inicio');
      expect(horaInicio.tipo).toBe('time');

      const coordenadas = iniciaisFields.find(f => f.nome === 'coordenadas');
      expect(coordenadas.tipo).toBe('coordinates');
      expect(coordenadas.readonly).toBe(true);
    });

    it('should have select fields with options arrays', () => {
      const selectFields = iniciaisFields.filter(f => f.tipo === 'select');
      expect(selectFields.length).toBeGreaterThan(0);
      selectFields.forEach(field => {
        expect(Array.isArray(field.opcoes)).toBe(true);
        expect(field.opcoes.length).toBeGreaterThan(0);
      });
    });

    it('should have lider and parceiro with the same options array (nomesTecnicos)', () => {
      const lider = iniciaisFields.find(f => f.nome === 'lider');
      const parceiro = iniciaisFields.find(f => f.nome === 'parceiro');
      expect(lider.opcoes).toEqual(parceiro.opcoes);
    });

    it('should have at least 12 nomesTecnicos in lider options', () => {
      const lider = iniciaisFields.find(f => f.nome === 'lider');
      expect(lider.opcoes.length).toBeGreaterThanOrEqual(12);
    });

    it('should have at least 29 municipio options', () => {
      const municipio = iniciaisFields.find(f => f.nome === 'municipio');
      expect(municipio.opcoes.length).toBeGreaterThanOrEqual(29);
    });

    it('should have at least 12 placa options', () => {
      const placa = iniciaisFields.find(f => f.nome === 'placa');
      expect(placa.opcoes.length).toBeGreaterThanOrEqual(12);
    });

    it('should have at least 43 tipo-ordem options', () => {
      const tipoOrdem = iniciaisFields.find(f => f.nome === 'tipo-ordem');
      expect(tipoOrdem.opcoes.length).toBeGreaterThanOrEqual(43);
    });

    it('should have notificado with options ["SIM", "NÃO"]', () => {
      const notificado = iniciaisFields.find(f => f.nome === 'notificado');
      expect(notificado.opcoes).toEqual(['SIM', 'NÃO']);
    });

    it('should have all required fields marked as obrigatorio', () => {
      const requiredFields = iniciaisFields.filter(f => f.obrigatorio);
      expect(requiredFields.length).toBeGreaterThanOrEqual(10);
    });

    it('should have unique field names', () => {
      const names = iniciaisFields.map(f => f.nome);
      expect(new Set(names).size).toBe(names.length);
    });

    it('every field should have a label', () => {
      iniciaisFields.forEach(field => {
        expect(field.label).toBeTruthy();
      });
    });
  });

  describe('retornoFields', () => {
    it('should be an array', () => {
      expect(Array.isArray(retornoFields)).toBe(true);
    });

    it('should have exactly 1 entry', () => {
      expect(retornoFields.length).toBe(1);
    });

    it('should have a descricao field with textarea type', () => {
      const field = retornoFields[0];
      expect(field.id).toBe('descricao-retorno');
      expect(field.label).toBe('Descrição');
      expect(field.type).toBe('textarea');
      expect(field.required).toBe(true);
    });
  });
});

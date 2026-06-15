// tests/composables/useValidation.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useValidation } from '../../src/composables/useValidation';
import { useFormStore } from '../../src/stores/form';

describe('useValidation', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('validateIniciais returns valid when all required fields are filled', () => {
    const form = useFormStore();
    form.iniciais.uc = '123';
    form.iniciais.os = '456';
    form.iniciais.lider = 'ANDRE DE SOUSA CARVALHO';
    form.iniciais.parceiro = 'BERKSON EVANGELISTA DE OLIVEIRA';
    form.iniciais.municipio = 'FORTALEZA';
    form.iniciais.notificado = 'SIM';
    form.iniciais.placa = 'RHS6G02';
    form.iniciais.data = '2026-06-14';
    form.iniciais.hora_inicio = '08:00';
    form.iniciais.hora_fim = '12:00';
    form.iniciais['tipo-ordem'] = 'VISTORIA DA UC';

    const { validateIniciais } = useValidation();
    const result = validateIniciais();
    
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('validateIniciais returns errors when required fields are missing', () => {
    const form = useFormStore();
    form.iniciais.uc = '123';
    // os is missing

    const { validateIniciais } = useValidation();
    const result = validateIniciais();
    
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.includes('OS'))).toBe(true);
  });

  it('validateEquipamentos validates equipment rows', () => {
    const form = useFormStore();
    form.equipamentos = [
      { status: 'OK', categoria: 'MEDIDOR', numero: '12345' },
      { status: '', categoria: 'DISPLAY', numero: '67890' } // missing status
    ];

    const { validateEquipamentos } = useValidation();
    const result = validateEquipamentos();
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Equipamento 2'))).toBe(true);
  });

  it('validateAll combines all validations', () => {
    const form = useFormStore();
    form.iniciais.uc = '123';
    form.iniciais.os = '456';
    form.iniciais.lider = 'ANDRE DE SOUSA CARVALHO';
    form.iniciais.parceiro = 'BERKSON EVANGELISTA DE OLIVEIRA';
    form.iniciais.municipio = 'FORTALEZA';
    form.iniciais.notificado = 'SIM';
    form.iniciais.placa = 'RHS6G02';
    form.iniciais.data = '2026-06-14';
    form.iniciais.hora_inicio = '08:00';
    form.iniciais.hora_fim = '12:00';
    form.iniciais['tipo-ordem'] = 'VISTORIA DA UC';
    // Preencher campos de retorno visiveis (FIELD_DESCRICAO + resultado)
    form.retorno['descricao'] = 'Vistoria realizada';
    form.retorno['resultado'] = 'Regular';
    form.equipamentos = [{ status: 'Instalado', categoria: 'Medidor', numero: '12345' }];

    const { validateAll } = useValidation();
    const result = validateAll();
    
    expect(result.valid).toBe(true);
  });
});
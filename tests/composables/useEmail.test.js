// tests/composables/useEmail.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useEmail } from '../../src/composables/useEmail';
import { useFormStore } from '../../src/stores/form';

describe('useEmail', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('normalizeText removes accents and converts to uppercase', () => {
    const { normalizeText } = useEmail();
    expect(normalizeText('café')).toBe('CAFE');
    expect(normalizeText('ação')).toBe('ACAO');
    expect(normalizeText('maçã')).toBe('MACA');
    expect(normalizeText('ção')).toBe('CAO');
    expect(normalizeText('TESTE')).toBe('TESTE');
  });

  it('reverseDate converts YYYY-MM-DD to DD-MM-YYYY', () => {
    const { reverseDate } = useEmail();
    expect(reverseDate('2026-06-14')).toBe('14-06-2026');
    expect(reverseDate('2025-12-25')).toBe('25-12-2025');
    expect(reverseDate('invalid')).toBe('invalid');
    expect(reverseDate('')).toBe('');
  });

  it('composeEmail includes iniciais fields', () => {
    const form = useFormStore();
    form.iniciais.uc = '123';
    form.iniciais.os = '456';
    form.iniciais.lider = 'ANDRE DE SOUSA CARVALHO';
    form.iniciais['tipo-ordem'] = 'VISTORIA DA UC';
    
    const { composeEmail } = useEmail();
    const email = composeEmail.value;
    
    expect(email).toContain('UC: 123');
    expect(email).toContain('OS: 456');
    expect(email).toContain('LÍDER: ANDRE DE SOUSA CARVALHO');
  });

  it('composeEmail includes equipamentos', () => {
    const form = useFormStore();
    form.equipamentos = [
      { status: 'OK', categoria: 'MEDIDOR', numero: '12345' },
      { status: 'FALHA', categoria: 'DISPLAY', numero: '67890' }
    ];
    
    const { composeEmail } = useEmail();
    const email = composeEmail.value;
    
    expect(email).toContain('EQUIPAMENTOS:');
    expect(email).toContain('MEDIDOR OK Nº 12345');
    expect(email).toContain('DISPLAY FALHA Nº 67890');
  });

  it('composeEmail includes retorno fields for tipo-ordem', () => {
    const form = useFormStore();
    form.iniciais['tipo-ordem'] = 'VISTORIA DA UC';
    form.retorno.resultado = 'Regular';
    form.retorno.descricao = 'Tudo ok';
    
    const { composeEmail } = useEmail();
    const email = composeEmail.value;
    
    expect(email).toContain('RETORNO:');
    expect(email).toContain('RESULTADO DA VISTORIA: REGULAR');
    expect(email).toContain('DESCRIÇÃO DO SERVIÇO: TUDO OK');
  });

  it('composeEmail handles empty retorno fields', () => {
    const form = useFormStore();
    form.iniciais['tipo-ordem'] = 'VISTORIA DA UC';
    
    const { composeEmail } = useEmail();
    const email = composeEmail.value;
    
    expect(email).toContain('RETORNO:');
  });
});
// tests/stores/form.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useFormStore } from '../../src/stores/form';
import { db } from '../../src/db';

describe('Form Store', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await db.records.clear();
    await db.attachments.clear();
  });

  it('initial state is empty', () => {
    const form = useFormStore();
    expect(form.iniciais).toEqual({});
    expect(form.retorno).toEqual({});
    expect(form.equipamentos).toEqual([]);
    expect(form.attachments).toEqual([]);
    expect(form.currentUUID).toBeNull();
    expect(form.status).toBe('draft');
    expect(form.iniciaisValido).toBe(false);
  });

  it('validateIniciais sets iniciaisValido when uc and os are filled', () => {
    const form = useFormStore();
    form.iniciais.uc = '123';
    form.iniciais.os = '456';
    form.validateIniciais();
    expect(form.iniciaisValido).toBe(true);
  });

  it('validateIniciais is false when uc is missing', () => {
    const form = useFormStore();
    form.iniciais.os = '456';
    form.validateIniciais();
    expect(form.iniciaisValido).toBe(false);
  });

  it('validateIniciais is false when os is missing', () => {
    const form = useFormStore();
    form.iniciais.uc = '123';
    form.validateIniciais();
    expect(form.iniciaisValido).toBe(false);
  });

  it('setTipoOrdem clears retorno', () => {
    const form = useFormStore();
    form.retorno.descricao = 'test';
    form.setTipoOrdem('NEW TYPE');
    expect(form.tipoOrdem).toBe('NEW TYPE');
    expect(form.retorno).toEqual({});
  });

  it('resetForm clears all state', () => {
    const form = useFormStore();
    form.iniciais.uc = '123';
    form.retorno.descricao = 'test';
    form.equipamentos.push({ status: 'ok', categoria: 'cat', numero: '1' });
    form.currentUUID = 'uuid-123';
    form.status = 'sent';
    
    form.resetForm();
    
    expect(form.iniciais).toEqual({});
    expect(form.retorno).toEqual({});
    expect(form.equipamentos).toEqual([]);
    expect(form.currentUUID).toBeNull();
    expect(form.status).toBe('draft');
  });

  it('saveDraft creates record in IndexedDB', async () => {
    const form = useFormStore();
    form.iniciais.uc = '123';
    form.iniciais.os = '456';
    form.tipoOrdem = 'TEST TYPE';
    
    await form.saveDraft();
    
    expect(form.currentUUID).not.toBeNull();
    const uuid = form.currentUUID;
    const record = await db.records.get(uuid);
    expect(record).toBeDefined();
    expect(record?.iniciais.uc).toBe('123');
    expect(record?.tipoOrdem).toBe('TEST TYPE');
  });

  it('loadRecord restores state from IndexedDB', async () => {
    const form = useFormStore();
    form.iniciais.uc = '123';
    form.iniciais.os = '456';
    form.tipoOrdem = 'TEST TYPE';
    await form.saveDraft();
    const uuid = form.currentUUID;
    
    form.resetForm();
    await form.loadRecord(uuid);
    
    expect(form.currentUUID).toBe(uuid);
    expect(form.iniciais.uc).toBe('123');
    expect(form.tipoOrdem).toBe('TEST TYPE');
  });

  it('attachmentCount reflects attachments length', () => {
    const form = useFormStore();
    expect(form.attachmentCount).toBe(0);
    
    form.attachments.push({ uuid: 'test', index: 0, name: 'a.jpg', type: 'image/jpeg', data: '' });
    expect(form.attachmentCount).toBe(1);
  });
});
// tests/collectors.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { collectAllData, collectIniciais, collectRetorno, collectEquipamentos } from '../scripts/collectors.js';
import { cacheDOM } from '../scripts/dom.js';
import { state } from '../scripts/state.js';

describe('collectors', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="iniciais-campos"></div>
      <div id="equipamentos-list"></div>
      <div id="retorno-campos"></div>
      <select id="tipo-ordem">
        <option value="">Selecione</option>
        <option value="CORTE POR FALTA DE PAGAMENTO">CORTE POR FALTA DE PAGAMENTO</option>
      </select>
      <textarea id="complemento-corpo"></textarea>
    `;
    cacheDOM();
    
    // Reset state
    state.iniciais = {};
    state.retorno = {};
    state.equipamentos = [];
    state.attachments = [];
  });

  describe('collectIniciais', () => {
    it('should collect initial fields from DOM and update state', () => {
      // Setup DOM with fields
      const container = document.getElementById('iniciais-campos');
      container.innerHTML = `
        <input id="uc" value="12345">
        <input id="os" value="67890">
        <input id="lider" value="ANDRE DE SOUSA CARVALHO">
      `;
      
      const result = collectIniciais();
      
      expect(result.uc).toBe('12345');
      expect(result.os).toBe('67890');
      expect(result.lider).toBe('ANDRE DE SOUSA CARVALHO');
      expect(state.iniciais.uc).toBe('12345');
    });
  });

  describe('collectRetorno', () => {
    it('should collect retorno fields from DOM and update state', () => {
      document.getElementById('tipo-ordem').value = 'CORTE POR FALTA DE PAGAMENTO';
      
      const container = document.getElementById('retorno-campos');
      container.innerHTML = `
        <div data-field-nome="situacao_corte" style="display: block;">
          <select id="situacao_corte">
            <option value="CLIENTE CORTADO">CLIENTE CORTADO</option>
          </select>
        </div>
      `;
      document.getElementById('situacao_corte').value = 'CLIENTE CORTADO';
      
      const result = collectRetorno();
      
      expect(result.situacao_corte).toBe('CLIENTE CORTADO');
      expect(state.retorno.situacao_corte).toBe('CLIENTE CORTADO');
    });

    it('should return empty object when no tipo-ordem is selected', () => {
      document.getElementById('tipo-ordem').value = '';
      
      const result = collectRetorno();
      
      expect(result).toEqual({});
    });
  });

  describe('collectEquipamentos', () => {
    it('should collect equipment rows from DOM and update state', () => {
      const container = document.getElementById('equipamentos-list');
      container.innerHTML = `
        <div class="equip-row">
          <select class="equip-tipo"><option value="Instalado" selected>Instalado</option></select>
          <select class="equip-categoria"><option value="Medidor" selected>Medidor</option></select>
          <input class="equip-numero" value="12345">
        </div>
      `;
      
      const result = collectEquipamentos();
      
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('Instalado');
      expect(result[0].categoria).toBe('Medidor');
      expect(result[0].numero).toBe('12345');
      expect(state.equipamentos).toHaveLength(1);
    });
  });

  describe('collectAllData', () => {
    it('should collect all data and update state', () => {
      // Setup DOM
      const iniciaisContainer = document.getElementById('iniciais-campos');
      iniciaisContainer.innerHTML = `
        <input id="uc" value="12345">
        <input id="os" value="67890">
      `;
      
      const equipContainer = document.getElementById('equipamentos-list');
      equipContainer.innerHTML = `
        <div class="equip-row">
          <select class="equip-tipo"><option value="Instalado" selected>Instalado</option></select>
          <select class="equip-categoria"><option value="Medidor" selected>Medidor</option></select>
          <input class="equip-numero" value="12345">
        </div>
      `;
      
      state.attachments = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];
      
      const result = collectAllData();
      
      expect(result.iniciais.uc).toBe('12345');
      expect(result.equipamentos).toHaveLength(1);
      expect(result.attachments).toHaveLength(1);
      expect(state.iniciais.uc).toBe('12345');
      expect(state.equipamentos).toHaveLength(1);
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { applyRecord } from '../scripts/restore.js';
import { cacheDOM, DOM } from '../scripts/dom.js';
import { state } from '../scripts/state.js';

// Mock navigation to prevent side effects
vi.mock('../scripts/navigation.js', () => ({
  showSection: vi.fn(),
}));

describe('restore', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="iniciais-campos"></div>
      <div id="equipamentos-list"></div>
      <div id="retorno-campos"></div>
      <div id="retorno-desc"></div>
      <select id="tipo-ordem">
        <option value="">Selecione</option>
        <option value="ADEQUACAO SMF">ADEQUACAO SMF</option>
        <option value="CORTE POR FALTA DE PAGAMENTO">CORTE POR FALTA DE PAGAMENTO</option>
      </select>
      <div id="preview-grid"></div>
      <div id="file-count">0 / 12</div>
      <textarea id="complemento-corpo"></textarea>
      <div id="file-upload-area"></div>
      <input type="file" id="file-input">
      <div id="error-msg" style="display:none"></div>
      <div class="toast" id="toast"></div>
      <div class="modal-overlay hidden" id="modal-tipo">
        <div class="modal">
          <p id="modal-tipo-text"></p>
          <button id="modal-cancel">Cancelar</button>
          <button id="modal-confirm">Alterar mesmo assim</button>
        </div>
      </div>
      <div class="lightbox-overlay hidden" id="lightbox">
        <button id="lightbox-close">✕</button>
        <img id="lightbox-img" src="" alt="Preview ampliado">
      </div>
      <div class="modal-overlay hidden" id="dup-modal">
        <div class="modal">
          <p id="dup-modal-title"></p>
          <p id="dup-modal-body"></p>
          <button id="dup-modal-cancel">Cancelar</button>
          <button id="dup-modal-confirm">Reenviar</button>
        </div>
      </div>
      <div class="modal-overlay hidden" id="confirm-modal">
        <div class="modal">
          <p id="confirm-modal-text"></p>
          <button id="confirm-modal-cancel">Cancelar</button>
          <button id="confirm-modal-ok">Confirmar</button>
        </div>
      </div>
    `;
    cacheDOM();
    
    // Reset state
    state.iniciais = {};
    state.equipamentos = [];
    state.attachments = [];
    state.lastTipoOrdem = '';
    state.visitedRetorno = false;
    state.iniciaisValido = false;
    state.currentUUID = '';
    state.retorno = {};
    state._createdAt = null;

    localStorage.clear();
  });

  describe('applyRecord', () => {
    const sampleRecord = {
      uuid: 'restored-uuid-123',
      currentSection: 3,
      status: 'draft',
      iniciais: {
        uc: '99999',
        os: '88888',
        lider: 'ANDRE DE SOUSA CARVALHO',
        municipio: 'FORTALEZA',
        placa: 'RHS6G02',
        notificado: 'SIM',
        tipo_ordem: 'ADEQUACAO SMF',
        data: '2024-03-15',
        hora_inicio: '08:00',
        hora_fim: '17:00',
      },
      equipamentos: [
        { status: 'Instalado', categoria: 'Medidor', numero: '111' },
        { status: 'Retirado', categoria: 'Display', numero: '222' },
      ],
      retorno: { descricao: 'Restored description' },
      lastTipoOrdem: 'ADEQUACAO SMF',
      visitedRetorno: true,
      tipoOrdem: 'ADEQUACAO SMF',
      composicao: { complementoCorpo: 'Restored complement' },
      attachments: [
        { name: 'photo.jpg', type: 'image/jpeg', data: btoa('fake-image-data') },
      ],
      createdAt: '2024-01-01T10:00:00.000Z',
    };

    it('should set currentUUID in state and localStorage', () => {
      applyRecord(sampleRecord);
      expect(state.currentUUID).toBe('restored-uuid-123');
      expect(localStorage.getItem('currentUUID')).toBe('restored-uuid-123');
    });

    it('should set iniciaisValido to true', () => {
      applyRecord(sampleRecord);
      expect(state.iniciaisValido).toBe(true);
    });

    it('should restore equipamentos', () => {
      applyRecord(sampleRecord);
      expect(state.equipamentos).toEqual(sampleRecord.equipamentos);
    });

    it('should restore lastTipoOrdem', () => {
      applyRecord(sampleRecord);
      expect(state.lastTipoOrdem).toBe('ADEQUACAO SMF');
    });

    it('should restore visitedRetorno', () => {
      applyRecord(sampleRecord);
      expect(state.visitedRetorno).toBe(true);
    });

    it('should restore iniciais data', () => {
      applyRecord(sampleRecord);
      expect(state.iniciais).toEqual(sampleRecord.iniciais);
    });

    it('should restore retorno data', () => {
      applyRecord(sampleRecord);
      expect(state.retorno).toEqual({ descricao: 'Restored description' });
    });

    it('should restore _createdAt', () => {
      applyRecord(sampleRecord);
      expect(state._createdAt).toBe('2024-01-01T10:00:00.000Z');
    });

    it('should restore attachments as File objects', () => {
      applyRecord(sampleRecord);
      expect(state.attachments).toHaveLength(1);
      expect(state.attachments[0]).toBeInstanceOf(File);
      expect(state.attachments[0].name).toBe('photo.jpg');
      expect(state.attachments[0].type).toBe('image/jpeg');
    });

    it('should set attachments to empty array when no attachments in record', () => {
      const recordWithoutAttachments = { ...sampleRecord, attachments: null };
      applyRecord(recordWithoutAttachments);
      expect(state.attachments).toEqual([]);
    });

    it('should restore iniciais field values in DOM', () => {
      applyRecord(sampleRecord);
      const uc = document.getElementById('uc');
      expect(uc.value).toBe('99999');
      const os = document.getElementById('os');
      expect(os.value).toBe('88888');
    });

    it('should restore tipoOrdem select value', () => {
      applyRecord(sampleRecord);
      expect(DOM.tipoOrdem.value).toBe('ADEQUACAO SMF');
    });

    it('should restore complementoCorpo', () => {
      applyRecord(sampleRecord);
      expect(DOM.complementoCorpo.value).toBe('Restored complement');
    });

    it('should return record.currentSection', () => {
      const result = applyRecord(sampleRecord);
      expect(result).toBe(3);
    });

    it('should default to section 1 if currentSection is not set', () => {
      const recordWithoutSection = { ...sampleRecord, currentSection: undefined };
      const result = applyRecord(recordWithoutSection);
      expect(result).toBe(1);
    });

    it('should handle empty or missing composicao', () => {
      const recordWithoutComposicao = { ...sampleRecord, composicao: undefined };
      expect(() => applyRecord(recordWithoutComposicao)).not.toThrow();
    });
  });
});

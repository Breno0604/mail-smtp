import { describe, it, expect, beforeEach, vi } from 'vitest';
import { applyRecord } from '../scripts/restore.js';
import { cacheDOM, DOM } from '../scripts/dom.js';
import { state, createDefaultEquipamentos } from '../scripts/state.js';

// Mock navigation to prevent side effects
vi.mock('../scripts/navigation.js', () => ({
  showSection: vi.fn(),
}));

describe('restore', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="iniciais-campos"></div>
      <select id="instalado-equip"><option value="NAO">NAO</option><option value="SIM">SIM</option></select>
      <select id="retirado-equip"><option value="NAO">NAO</option><option value="SIM">SIM</option></select>
      <div id="sec-equip-instalados" class="hidden"></div>
      <div id="sec-equip-retirados" class="hidden"></div>
      <div id="checkboxes-instalados"></div>
      <div id="checkboxes-retirados"></div>
      <div id="campos-instalados"></div>
      <div id="campos-retirados"></div>
      <div id="retorno-campos"></div>
      <div id="retorno-placeholder"></div>
      <div id="retorno-desc"></div>
      <select id="tipo-ordem">
        <option value="">Selecione</option>
        <option value="ADEQUACAO SMF">ADEQUACAO SMF</option>
        <option value="CORTE POR FALTA DE PAGAMENTO">CORTE POR FALTA DE PAGAMENTO</option>
      </select>
      <div id="preview-grid"></div>
      <div id="preview-corpo">—</div>
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
    state.equipamentos = createDefaultEquipamentos();
    state.attachments = [];
    state.lastTipoOrdem = '';
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
      equipamentos: {
        instaladoEquip: 'SIM',
        retiradoEquip: 'SIM',
        instalados: {
          medidor: '111',
          conjunto: '',
          display: '',
          tc_fase_a: '',
          tc_fase_b: '',
          tc_fase_c: '',
          tp_fase_a: '',
          tp_fase_b: '',
          tp_fase_c: '',
        },
        retirados: {
          medidor: '',
          conjunto: '',
          display: '222',
          tc_fase_a: '',
          tc_fase_b: '',
          tc_fase_c: '',
          tp_fase_a: '',
          tp_fase_b: '',
          tp_fase_c: '',
        },
        checkboxes: {
          instalados: {
            medidor: true,
            conjunto: false,
            display: false,
            tc_fase_a: false,
            tc_fase_b: false,
            tc_fase_c: false,
            tp_fase_a: false,
            tp_fase_b: false,
            tp_fase_c: false,
          },
          retirados: {
            medidor: false,
            conjunto: false,
            display: true,
            tc_fase_a: false,
            tc_fase_b: false,
            tc_fase_c: false,
            tp_fase_a: false,
            tp_fase_b: false,
            tp_fase_c: false,
          },
        },
      },
      retorno: { descricao: 'Restored description' },
      lastTipoOrdem: 'ADEQUACAO SMF',
      tipoOrdem: 'ADEQUACAO SMF',
      attachments: [{ name: 'photo.jpg', type: 'image/jpeg', data: btoa('fake-image-data') }],
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

    it('should restore iniciais data', () => {
      applyRecord(sampleRecord);
      // state.iniciais is now synced from DOM via collectIniciais(),
      // so it uses DOM field names (kebab-case) and includes all defined fields
      expect(state.iniciais.uc).toBe('99999');
      expect(state.iniciais.os).toBe('88888');
      expect(state.iniciais.lider).toBe('ANDRE DE SOUSA CARVALHO');
      expect(state.iniciais.municipio).toBe('FORTALEZA');
      expect(state.iniciais['tipo-ordem']).toBe('ADEQUACAO SMF');
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

    // ── Bug 1: lastTipoOrdem must match record.tipoOrdem, not record.lastTipoOrdem ──

    it('should set lastTipoOrdem to record.tipoOrdem (not record.lastTipoOrdem)', () => {
      const record = {
        ...sampleRecord,
        tipoOrdem: 'CORTE POR FALTA DE PAGAMENTO',
        lastTipoOrdem: 'ADEQUACAO SMF', // stale value from a previous session
      };
      applyRecord(record);
      expect(state.lastTipoOrdem).toBe('CORTE POR FALTA DE PAGAMENTO');
    });

    it('should set lastTipoOrdem to empty string when record has no tipoOrdem', () => {
      const record = {
        ...sampleRecord,
        tipoOrdem: '',
        lastTipoOrdem: 'ADEQUACAO SMF',
      };
      applyRecord(record);
      expect(state.lastTipoOrdem).toBe('');
    });

    // ── Bug 4: state.retorno must sync with DOM after restore ──

    it('should synchronize state.retorno with DOM values after restore', () => {
      applyRecord(sampleRecord);
      // state.retorno must be consistent with what getRetornoData() returns from the DOM
      expect(state.retorno).toEqual(sampleRecord.retorno);
    });
  });
});

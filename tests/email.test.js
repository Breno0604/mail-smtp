import { describe, it, expect, beforeEach } from 'vitest';
import { composeEmail } from '../scripts/email.js';
import { cacheDOM, DOM } from '../scripts/dom.js';
import { renderIniciais } from '../scripts/iniciais.js';
import { renderRetorno } from '../scripts/retornos.js';

describe('email', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="iniciais-campos"></div>
      <div id="equipamentos-list"></div>
      <div id="retorno-campos"></div>
      <div id="retorno-desc"></div>
      <select id="tipo-ordem">
        <option value="">Selecione</option>
        <option value="ADEQUACAO SMF">ADEQUACAO SMF</option>
      </select>
      <div id="preview-corpo">—</div>
      <textarea id="complemento-corpo" rows="3"></textarea>
      <div id="preview-grid"></div>
      <div id="file-count">0 / 12</div>
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
  });

  describe('composeEmail', () => {
    const sampleData = {
      iniciais: {
        coordenadas: '-3.123, -38.456',
        lider: 'ANDRE DE SOUSA CARVALHO',
        parceiro: '',
        municipio: 'FORTALEZA',
        uc: '12345',
        os: '67890',
        notificado: 'SIM',
        placa: 'RHS6G02',
        data: '2024-03-15',
        hora_inicio: '08:00',
        hora_fim: '17:00',
        'tipo-ordem': 'ADEQUACAO SMF',
      },
      equipamentos: [],
      retorno: { descricao: '' },
    };

    it('should generate email body with iniciais fields', () => {
      const body = composeEmail(sampleData);
      expect(body).toContain('LIDER:');
      expect(body).toContain('ANDRE DE SOUSA CARVALHO');
      expect(body).toContain('UC:');
      expect(body).toContain('12345');
      expect(body).toContain('OS:');
      expect(body).toContain('67890');
    });

    it('should format date field as DD-MM-YYYY', () => {
      const data = { ...sampleData, iniciais: { ...sampleData.iniciais, data: '2024-03-15' } };
      const body = composeEmail(data);
      expect(body).toContain('15-03-2024');
    });

    it('should include "—" for empty iniciais fields', () => {
      const data = { ...sampleData, iniciais: { ...sampleData.iniciais, lider: '' } };
      const body = composeEmail(data);
      expect(body).toContain('—');
    });

    it('should include equipamentos section when equipment rows exist', () => {
      const data = {
        ...sampleData,
        equipamentos: [{ status: 'Instalado', categoria: 'Medidor', numero: '12345' }],
      };
      const body = composeEmail(data);
      expect(body).toContain('EQUIPAMENTOS:');
      expect(body).toContain('MEDIDOR');
      expect(body).toContain('INSTALADO');
      expect(body).toContain('Nº');
      expect(body).toContain('12345');
    });

    it('should include "—" for equipment number when empty', () => {
      const data = {
        ...sampleData,
        equipamentos: [{ status: 'Instalado', categoria: 'Medidor', numero: '' }],
      };
      const body = composeEmail(data);
      expect(body).toContain('—');
    });

    it('should include retorno section', () => {
      const data = { ...sampleData, retorno: { descricao: 'Retorno test description' } };
      const body = composeEmail(data);
      expect(body).toContain('RETORNO:');
      expect(body).toContain('DESCRICAO DO SERVICO:');
      expect(body).toContain('RETORNO TEST DESCRIPTION');
    });

    it('should show "(NAO PREENCHIDO)" for empty retorno field', () => {
      const body = composeEmail(sampleData);
      expect(body).toContain('(NAO PREENCHIDO)');
    });

    it('should return body string', () => {
      const body = composeEmail(sampleData);
      expect(typeof body).toBe('string');
      expect(body.length).toBeGreaterThan(0);
    });
  });
});

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
    function fillIniciaisField(name, value) {
      const el = document.getElementById(name);
      if (el) el.value = value;
    }

    it('should generate email body with iniciais fields', () => {
      renderIniciais();
      fillIniciaisField('lider', 'ANDRE DE SOUSA CARVALHO');
      fillIniciaisField('uc', '12345');
      fillIniciaisField('os', '67890');
      fillIniciaisField('notificado', 'SIM');
      fillIniciaisField('placa', 'RHS6G02');
      fillIniciaisField('tipo-ordem', 'ADEQUACAO SMF');
      fillIniciaisField('data', '2024-03-15');
      fillIniciaisField('hora_inicio', '08:00');
      fillIniciaisField('hora_fim', '17:00');
      fillIniciaisField('coordenadas', '-3.123, -38.456');

      composeEmail();
      const body = DOM.previewCorpo.textContent;
      expect(body).toContain('Líder:');
      expect(body).toContain('ANDRE DE SOUSA CARVALHO');
      expect(body).toContain('UC:');
      expect(body).toContain('12345');
      expect(body).toContain('OS:');
      expect(body).toContain('67890');
    });

    it('should format date field as DD-MM-YYYY', () => {
      renderIniciais();
      fillIniciaisField('data', '2024-03-15');
      composeEmail();
      const body = DOM.previewCorpo.textContent;
      // Date format: DD-MM-YYYY
      expect(body).toContain('15-03-2024');
    });

    it('should include "—" for empty iniciais fields', () => {
      renderIniciais();
      composeEmail();
      const body = DOM.previewCorpo.textContent;
      expect(body).toContain('—');
    });

    it('should include equipamentos section when equipment rows exist', () => {
      renderIniciais();
      const row = document.createElement('div');
      row.className = 'equip-row';
      row.innerHTML = `
        <select class="equip-tipo"><option value="Instalado">Instalado</option></select>
        <select class="equip-categoria"><option value="Medidor">Medidor</option></select>
        <input class="equip-numero" value="12345">
      `;
      DOM.equipList.appendChild(row);

      composeEmail();
      const body = DOM.previewCorpo.textContent;
      expect(body).toContain('Equipamentos:');
      expect(body).toContain('Medidor');
      expect(body).toContain('Instalado');
      expect(body).toContain('Nº');
      expect(body).toContain('12345');
    });

    it('should include "—" for equipment number when empty', () => {
      renderIniciais();
      const row = document.createElement('div');
      row.className = 'equip-row';
      row.innerHTML = `
        <select class="equip-tipo"><option value="Instalado">Instalado</option></select>
        <select class="equip-categoria"><option value="Medidor">Medidor</option></select>
        <input class="equip-numero" value="">
      `;
      DOM.equipList.appendChild(row);

      composeEmail();
      const body = DOM.previewCorpo.textContent;
      expect(body).toContain('—');
    });

    it('should include retorno section', () => {
      renderIniciais();
      renderRetorno();
      const textarea = document.getElementById('descricao-retorno');
      textarea.value = 'Retorno test description';

      composeEmail();
      const body = DOM.previewCorpo.textContent;
      expect(body).toContain('Retorno:');
      expect(body).toContain('Descrição:');
      expect(body).toContain('Retorno test description');
    });

    it('should show "(não preenchido)" for empty retorno field', () => {
      renderIniciais();
      renderRetorno();
      composeEmail();
      const body = DOM.previewCorpo.textContent;
      expect(body).toContain('(não preenchido)');
    });

    it('should update preview-corpo element', () => {
      renderIniciais();
      composeEmail();
      expect(DOM.previewCorpo.textContent).not.toBe('—');
    });
  });
});

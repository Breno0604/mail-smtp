import { describe, it, expect, beforeEach } from 'vitest';
import { renderRetorno, setRetornoData, handleTipoChange } from '../scripts/retornos.js';
import { cacheDOM, DOM } from '../scripts/dom.js';
import { state } from '../scripts/state.js';
import { collectRetorno } from '../scripts/collectors.js';

describe('retornos', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="retorno-campos"></div>
      <div id="retorno-placeholder"></div>
      <div id="retorno-desc"></div>
      <select id="tipo-ordem">
        <option value="">Selecione</option>
        <option value="ADEQUACAO SMF">ADEQUACAO SMF</option>
        <option value="CORTE POR FALTA DE PAGAMENTO">CORTE POR FALTA DE PAGAMENTO</option>
        <option value="DESLIG.PROG.MANUTENÇÃO">DESLIG.PROG.MANUTENÇÃO</option>
        <option value="INSPECAO UC CORTADA I15">INSPECAO UC CORTADA I15</option>
        <option value="INSPECAO UC CORTADA I30">INSPECAO UC CORTADA I30</option>
        <option value="LIGACAO NOVA MEDIA TENSAO">LIGACAO NOVA MEDIA TENSAO</option>
        <option value="AFERIÇÃO DE MEDIDOR">AFERIÇÃO DE MEDIDOR</option>
        <option value="AFERIÇÃO MEDIDOR CLIENTE LIVRE">AFERIÇÃO MEDIDOR CLIENTE LIVRE</option>
      </select>
      <div id="iniciais-campos"></div>
      <div id="equipamentos-list"></div>
      <div id="preview-grid"></div>
      <div id="file-count">0 / 12</div>
      <div id="complemento-corpo"></div>
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
    state.lastTipoOrdem = '';
    state.retorno = {};
  });

  describe('renderRetorno', () => {
    it('should create a textarea with id descricao', () => {
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      renderRetorno();
      const textarea = document.getElementById('descricao');
      expect(textarea).toBeTruthy();
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('should set data-required attribute on textarea', () => {
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      renderRetorno();
      const textarea = document.getElementById('descricao');
      expect(textarea.hasAttribute('data-required')).toBe(true);
    });

    it('should clear existing content before rendering', () => {
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      DOM.retornoCampos.innerHTML = '<div>old content</div>';
      renderRetorno();
      expect(DOM.retornoCampos.children.length).toBe(1); // just the new field
    });

    it('should update retorno-desc with the current tipo label', () => {
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      renderRetorno();
      expect(DOM.retornoDesc.innerHTML).toContain('ADEQUACAO SMF');
    });

    it('should show the selected option text when no tipo is selected (shows "Selecione")', () => {
      DOM.tipoOrdem.value = '';
      renderRetorno();
      expect(DOM.retornoDesc.innerHTML).toContain('Selecione');
    });

    it('should create a label for the textarea', () => {
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      renderRetorno();
      const label = document.querySelector('label[for="descricao"]');
      expect(label).toBeTruthy();
      expect(label.textContent).toContain('Descrição');
    });

    it('should show required indicator on label', () => {
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      renderRetorno();
      const input = document.getElementById('descricao');
      expect(input.hasAttribute('data-required')).toBe(true);
    });
  });

  describe('collectRetorno', () => {
    it('should return empty object when no tipo is selected', () => {
      DOM.retornoCampos.innerHTML = '';
      const data = collectRetorno();
      expect(data).toEqual({});
    });

    it('should return descricao from textarea', () => {
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      renderRetorno();
      const textarea = document.getElementById('descricao');
      textarea.value = 'Test description';
      const data = collectRetorno();
      expect(data.descricao).toBe('Test description');
    });

    it('should return empty string when textarea is empty', () => {
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      renderRetorno();
      const data = collectRetorno();
      expect(data.descricao).toBe('');
    });

    it('should update state.retorno when collecting', () => {
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      renderRetorno();
      const textarea = document.getElementById('descricao');
      textarea.value = 'Test description';
      collectRetorno();
      expect(state.retorno.descricao).toBe('Test description');
    });
  });

  describe('setRetornoData', () => {
    it('should set descricao value on textarea', () => {
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      renderRetorno();
      setRetornoData({ descricao: 'Restored description' });
      const textarea = document.getElementById('descricao');
      expect(textarea.value).toBe('Restored description');
    });

    it('should not throw when data is null', () => {
      renderRetorno();
      expect(() => setRetornoData(null)).not.toThrow();
    });

    it('should not throw when data is undefined', () => {
      renderRetorno();
      expect(() => setRetornoData(undefined)).not.toThrow();
    });

    it('should set value to empty string when descricao is empty', () => {
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      renderRetorno();
      const textarea = document.getElementById('descricao');
      textarea.value = 'existing';
      setRetornoData({ descricao: '' });
      expect(textarea.value).toBe('');
    });
  });

  describe('handleTipoChange', () => {
    it('should update lastTipoOrdem when tipo changes', () => {
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      handleTipoChange();
      expect(state.lastTipoOrdem).toBe('ADEQUACAO SMF');
    });

    it('should clear retorno when tipo changes', () => {
      state.retorno = { descricao: 'old' };
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      handleTipoChange();
      expect(state.retorno).toEqual({});
    });

    it('should not change when tipo matches lastTipoOrdem', () => {
      state.lastTipoOrdem = 'ADEQUACAO SMF';
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      handleTipoChange();
      expect(state.lastTipoOrdem).toBe('ADEQUACAO SMF');
    });
  });

  describe('UC Cortada - layout lado-a-lado', () => {
    it('should render 8 fields for INSPECAO UC CORTADA I15', () => {
      DOM.tipoOrdem.value = 'INSPECAO UC CORTADA I15';
      renderRetorno();
      const situacao = document.getElementById('situacao-cliente');
      const viavel = document.getElementById('viavel-retirar');
      const ramal = document.getElementById('ramal');
      const medicao = document.getElementById('medicao');
      const jump = document.getElementById('jump');
      const chaves = document.getElementById('chaves');
      const aplicadoToi = document.getElementById('aplicado-toi');
      const toi = document.getElementById('toi');
      expect(situacao).toBeTruthy();
      expect(viavel).toBeTruthy();
      expect(ramal).toBeTruthy();
      expect(medicao).toBeTruthy();
      expect(jump).toBeTruthy();
      expect(chaves).toBeTruthy();
      expect(aplicadoToi).toBeTruthy();
      expect(toi).toBeTruthy();
    });

    it('should render ramal and medicao in same flex row container', () => {
      DOM.tipoOrdem.value = 'INSPECAO UC CORTADA I15';
      renderRetorno();
      const ramalGroup = document.querySelector('[data-field-nome="ramal"]');
      const medicaoGroup = document.querySelector('[data-field-nome="medicao"]');
      expect(ramalGroup.parentElement).toBe(medicaoGroup.parentElement);
      expect(ramalGroup.parentElement.classList.contains('flex')).toBe(true);
    });

    it('should render jump and chaves in same flex row container', () => {
      DOM.tipoOrdem.value = 'INSPECAO UC CORTADA I15';
      renderRetorno();
      const jumpGroup = document.querySelector('[data-field-nome="jump"]');
      const chavesGroup = document.querySelector('[data-field-nome="chaves"]');
      expect(jumpGroup.parentElement).toBe(chavesGroup.parentElement);
      expect(jumpGroup.parentElement.classList.contains('flex')).toBe(true);
    });

    it('should render aplicado-toi and toi in same flex row container', () => {
      DOM.tipoOrdem.value = 'INSPECAO UC CORTADA I15';
      renderRetorno();
      const aplicadoGroup = document.querySelector('[data-field-nome="aplicado-toi"]');
      const toiGroup = document.querySelector('[data-field-nome="toi"]');
      expect(aplicadoGroup.parentElement).toBe(toiGroup.parentElement);
      expect(aplicadoGroup.parentElement.classList.contains('flex')).toBe(true);
    });

    it('should render situacao-cliente alone (no flex container)', () => {
      DOM.tipoOrdem.value = 'INSPECAO UC CORTADA I15';
      renderRetorno();
      const situacaoGroup = document.querySelector('[data-field-nome="situacao-cliente"]');
      expect(situacaoGroup.parentElement.classList.contains('flex')).toBe(false);
    });

    it('should have flex-1 class on fields sharing a row', () => {
      DOM.tipoOrdem.value = 'INSPECAO UC CORTADA I15';
      renderRetorno();
      const ramalGroup = document.querySelector('[data-field-nome="ramal"]');
      const medicaoGroup = document.querySelector('[data-field-nome="medicao"]');
      expect(ramalGroup.classList.contains('flex-1')).toBe(true);
      expect(medicaoGroup.classList.contains('flex-1')).toBe(true);
    });
  });

  describe('UC Cortada - campo TOI condicional', () => {
    it('should hide TOI field when aplicado-toi is not SIM', () => {
      DOM.tipoOrdem.value = 'INSPECAO UC CORTADA I15';
      renderRetorno();
      const aplicadoToi = document.getElementById('aplicado-toi');
      aplicadoToi.value = 'NAO';
      aplicadoToi.dispatchEvent(new Event('change'));
      const toiGroup = document.querySelector('[data-field-nome="toi"]');
      expect(toiGroup.style.display).toBe('none');
    });

    it('should show TOI field when aplicado-toi is SIM', () => {
      DOM.tipoOrdem.value = 'INSPECAO UC CORTADA I15';
      renderRetorno();
      const aplicadoToi = document.getElementById('aplicado-toi');
      aplicadoToi.value = 'SIM';
      aplicadoToi.dispatchEvent(new Event('change'));
      const toiGroup = document.querySelector('[data-field-nome="toi"]');
      expect(toiGroup.style.display).toBe('');
    });

    it('should initially hide TOI field on render (no value selected)', () => {
      DOM.tipoOrdem.value = 'INSPECAO UC CORTADA I15';
      renderRetorno();
      const toiGroup = document.querySelector('[data-field-nome="toi"]');
      expect(toiGroup.style.display).toBe('none');
    });

    it('should render same fields for I30 as for I15', () => {
      DOM.tipoOrdem.value = 'INSPECAO UC CORTADA I30';
      renderRetorno();
      expect(document.getElementById('situacao-cliente')).toBeTruthy();
      expect(document.getElementById('viavel-retirar')).toBeTruthy();
      expect(document.getElementById('ramal')).toBeTruthy();
      expect(document.getElementById('medicao')).toBeTruthy();
      expect(document.getElementById('jump')).toBeTruthy();
      expect(document.getElementById('chaves')).toBeTruthy();
      expect(document.getElementById('aplicado-toi')).toBeTruthy();
      expect(document.getElementById('toi')).toBeTruthy();
      expect(document.getElementById('observacoes')).toBeNull();
    });

    it('should render descricao field for UC Cortada', () => {
      DOM.tipoOrdem.value = 'INSPECAO UC CORTADA I15';
      renderRetorno();
      const descricao = document.getElementById('descricao');
      expect(descricao).toBeTruthy();
      expect(descricao.tagName).toBe('TEXTAREA');
      expect(descricao.placeholder).toBe('Descrição do Serviço');
    });

    it('should collect all visible UC Cortada field values via collectRetorno', () => {
      DOM.tipoOrdem.value = 'INSPECAO UC CORTADA I15';
      renderRetorno();
      document.getElementById('situacao-cliente').value = 'CORTADO';
      document.getElementById('viavel-retirar').value = 'COM MUNK';
      document.getElementById('ramal').value = 'COM RAMAL';
      document.getElementById('medicao').value = 'COM MEDIÇÃO';
      document.getElementById('jump').value = 'COM JUMP';
      document.getElementById('chaves').value = 'COM CHAVE';
      document.getElementById('aplicado-toi').value = 'NAO';
      const data = collectRetorno();
      expect(data['situacao-cliente']).toBe('CORTADO');
      expect(data['viavel-retirar']).toBe('COM MUNK');
      expect(data['ramal']).toBe('COM RAMAL');
      expect(data['medicao']).toBe('COM MEDIÇÃO');
      expect(data['jump']).toBe('COM JUMP');
      expect(data['chaves']).toBe('COM CHAVE');
      expect(data['observacoes']).toBeUndefined();
      expect(data['toi']).toBeUndefined();
    });

    it('should include TOI in collectRetorno when visible', () => {
      DOM.tipoOrdem.value = 'INSPECAO UC CORTADA I15';
      renderRetorno();
      document.getElementById('aplicado-toi').value = 'SIM';
      document.getElementById('aplicado-toi').dispatchEvent(new Event('change'));
      document.getElementById('toi').value = 'TOI-123';
      const data = collectRetorno();
      expect(data['toi']).toBe('TOI-123');
    });
  });

  describe('Condicionais multi-valor e negado', () => {
    describe('DESLIG.PROG.MANUTENÇÃO - campo negado', () => {
      it('should hide acesso_desligamento when desligamento is DESLIGAMENTO EXECUTADO', () => {
        DOM.tipoOrdem.value = 'DESLIG.PROG.MANUTENÇÃO';
        renderRetorno();
        const deslig = document.getElementById('desligamento');
        deslig.value = 'DESLIGAMENTO EXECUTADO';
        deslig.dispatchEvent(new Event('change'));
        const group = document.querySelector('[data-field-nome="acesso_desligamento"]');
        expect(group.style.display).toBe('none');
      });

      it('should show acesso_desligamento when desligamento is SEM ACESSO', () => {
        DOM.tipoOrdem.value = 'DESLIG.PROG.MANUTENÇÃO';
        renderRetorno();
        const deslig = document.getElementById('desligamento');
        deslig.value = 'SEM ACESSO';
        deslig.dispatchEvent(new Event('change'));
        const group = document.querySelector('[data-field-nome="acesso_desligamento"]');
        expect(group.style.display).toBe('');
      });

it('should initially hide acesso_desligamento when no value selected in control field', () => {
        DOM.tipoOrdem.value = 'DESLIG.PROG.MANUTENÇÃO';
        renderRetorno();
        const group = document.querySelector('[data-field-nome="acesso_desligamento"]');
        expect(group.style.display).toBe('none');
      });
    });

    describe('LIGACAO NOVA MEDIA TENSAO - condicional multi-valor', () => {
      it('should show obra when retorno_ligacao is VISTORIA', () => {
        DOM.tipoOrdem.value = 'LIGACAO NOVA MEDIA TENSAO';
        renderRetorno();
        const retorno = document.getElementById('retorno_ligacao');
        retorno.value = 'VISTORIA';
        retorno.dispatchEvent(new Event('change'));
        const group = document.querySelector('[data-field-nome="obra"]');
        expect(group.style.display).toBe('');
      });

      it('should hide obra when retorno_ligacao is LIGAÇÃO', () => {
        DOM.tipoOrdem.value = 'LIGACAO NOVA MEDIA TENSAO';
        renderRetorno();
        const retorno = document.getElementById('retorno_ligacao');
        retorno.value = 'LIGAÇÃO';
        retorno.dispatchEvent(new Event('change'));
        const group = document.querySelector('[data-field-nome="obra"]');
        expect(group.style.display).toBe('none');
      });

      it('should show ligacao when retorno_ligacao is LIGAÇÃO', () => {
        DOM.tipoOrdem.value = 'LIGACAO NOVA MEDIA TENSAO';
        renderRetorno();
        const retorno = document.getElementById('retorno_ligacao');
        retorno.value = 'LIGAÇÃO';
        retorno.dispatchEvent(new Event('change'));
        const group = document.querySelector('[data-field-nome="ligacao"]');
        expect(group.style.display).toBe('');
      });

      it('should hide ligacao when retorno_ligacao is VISTORIA', () => {
        DOM.tipoOrdem.value = 'LIGACAO NOVA MEDIA TENSAO';
        renderRetorno();
        const retorno = document.getElementById('retorno_ligacao');
        retorno.value = 'VISTORIA';
        retorno.dispatchEvent(new Event('change'));
        const group = document.querySelector('[data-field-nome="ligacao"]');
        expect(group.style.display).toBe('none');
      });
    });

    describe('LIGACAO NOVA MEDIA TENSAO - condicional em cascata', () => {
      it('should show qtd_medidor_bt when medidor_bt is COM MEDIDOR BT (after showing conditional parent)', () => {
        DOM.tipoOrdem.value = 'LIGACAO NOVA MEDIA TENSAO';
        renderRetorno();
        // First make medidor_bt visible by selecting VISTORIA
        const retorno = document.getElementById('retorno_ligacao');
        retorno.value = 'VISTORIA';
        retorno.dispatchEvent(new Event('change'));
        // Then set medidor_bt
        const medidor = document.getElementById('medidor_bt');
        medidor.value = 'COM MEDIDOR BT';
        medidor.dispatchEvent(new Event('change'));
        const group = document.querySelector('[data-field-nome="qtd_medidor_bt"]');
        expect(group.style.display).toBe('');
      });

      it('should hide qtd_medidor_bt when medidor_bt is SEM MEDIDOR BT', () => {
        DOM.tipoOrdem.value = 'LIGACAO NOVA MEDIA TENSAO';
        renderRetorno();
        const retorno = document.getElementById('retorno_ligacao');
        retorno.value = 'VISTORIA';
        retorno.dispatchEvent(new Event('change'));
        const medidor = document.getElementById('medidor_bt');
        medidor.value = 'SEM MEDIDOR BT';
        medidor.dispatchEvent(new Event('change'));
        const group = document.querySelector('[data-field-nome="qtd_medidor_bt"]');
        expect(group.style.display).toBe('none');
      });
    });
  });

  describe('AFERICAO MEDIDOR - renderização', () => {
    it('should render all 7 fields for AFERIÇÃO DE MEDIDOR', () => {
      DOM.tipoOrdem.value = 'AFERIÇÃO DE MEDIDOR';
      renderRetorno();
      expect(document.getElementById('medidor_afericao')).toBeTruthy();
      expect(document.getElementById('Motivo_cancel_afericao')).toBeTruthy();
      expect(document.getElementById('leitura_afericao')).toBeTruthy();
      expect(document.getElementById('motivo_nao_colher')).toBeTruthy();
      expect(document.getElementById('toi_afericao')).toBeTruthy();
      expect(document.getElementById('numero_toi')).toBeTruthy();
      expect(document.getElementById('porque_nao_aplicado_toi')).toBeTruthy();
    });

    it('should render all 7 fields for AFERIÇÃO MEDIDOR CLIENTE LIVRE', () => {
      DOM.tipoOrdem.value = 'AFERIÇÃO MEDIDOR CLIENTE LIVRE';
      renderRetorno();
      expect(document.getElementById('medidor_afericao')).toBeTruthy();
      expect(document.getElementById('Motivo_cancel_afericao')).toBeTruthy();
      expect(document.getElementById('leitura_afericao')).toBeTruthy();
      expect(document.getElementById('motivo_nao_colher')).toBeTruthy();
      expect(document.getElementById('toi_afericao')).toBeTruthy();
      expect(document.getElementById('numero_toi')).toBeTruthy();
      expect(document.getElementById('porque_nao_aplicado_toi')).toBeTruthy();
    });

    it('should hide condicional fields initially', () => {
      DOM.tipoOrdem.value = 'AFERIÇÃO DE MEDIDOR';
      renderRetorno();
      expect(document.querySelector('[data-field-nome="Motivo_cancel_afericao"]').style.display).toBe('none');
      expect(document.querySelector('[data-field-nome="leitura_afericao"]').style.display).toBe('none');
      expect(document.querySelector('[data-field-nome="motivo_nao_colher"]').style.display).toBe('none');
      expect(document.querySelector('[data-field-nome="toi_afericao"]').style.display).toBe('none');
      expect(document.querySelector('[data-field-nome="numero_toi"]').style.display).toBe('none');
      expect(document.querySelector('[data-field-nome="porque_nao_aplicado_toi"]').style.display).toBe('none');
    });

    it('should show Motivo_cancel_afericao when medidor_afericao = NAO SUBSTITUIDO', () => {
      DOM.tipoOrdem.value = 'AFERIÇÃO DE MEDIDOR';
      renderRetorno();
      const medidor = document.getElementById('medidor_afericao');
      medidor.value = 'NAO SUBSTITUIDO';
      medidor.dispatchEvent(new Event('change'));
      expect(document.querySelector('[data-field-nome="Motivo_cancel_afericao"]').style.display).toBe('');
    });

    it('should show leitura_afericao and toi_afericao when medidor_afericao = SUBSTITUIDO', () => {
      DOM.tipoOrdem.value = 'AFERIÇÃO DE MEDIDOR';
      renderRetorno();
      const medidor = document.getElementById('medidor_afericao');
      medidor.value = 'SUBSTITUIDO';
      medidor.dispatchEvent(new Event('change'));
      expect(document.querySelector('[data-field-nome="leitura_afericao"]').style.display).toBe('');
      expect(document.querySelector('[data-field-nome="toi_afericao"]').style.display).toBe('');
    });

    it('should show motivo_nao_colher when leitura_afericao = NAO FOI COLHIDO LEITURA', () => {
      DOM.tipoOrdem.value = 'AFERIÇÃO DE MEDIDOR';
      renderRetorno();
      const medidor = document.getElementById('medidor_afericao');
      medidor.value = 'SUBSTITUIDO';
      medidor.dispatchEvent(new Event('change'));
      const leitura = document.getElementById('leitura_afericao');
      leitura.value = 'NAO FOI COLHIDO LEITURA';
      leitura.dispatchEvent(new Event('change'));
      expect(document.querySelector('[data-field-nome="motivo_nao_colher"]').style.display).toBe('');
    });

    it('should show numero_toi when toi_afericao = APLICADO TOI', () => {
      DOM.tipoOrdem.value = 'AFERIÇÃO DE MEDIDOR';
      renderRetorno();
      const medidor = document.getElementById('medidor_afericao');
      medidor.value = 'SUBSTITUIDO';
      medidor.dispatchEvent(new Event('change'));
      const toi = document.getElementById('toi_afericao');
      toi.value = 'APLICADO TOI';
      toi.dispatchEvent(new Event('change'));
      expect(document.querySelector('[data-field-nome="numero_toi"]').style.display).toBe('');
    });

    it('should show porque_nao_aplicado_toi when toi_afericao = NAO FOI APLICADO TOI', () => {
      DOM.tipoOrdem.value = 'AFERIÇÃO DE MEDIDOR';
      renderRetorno();
      const medidor = document.getElementById('medidor_afericao');
      medidor.value = 'SUBSTITUIDO';
      medidor.dispatchEvent(new Event('change'));
      const toi = document.getElementById('toi_afericao');
      toi.value = 'NAO FOI APLICADO TOI';
      toi.dispatchEvent(new Event('change'));
      expect(document.querySelector('[data-field-nome="porque_nao_aplicado_toi"]').style.display).toBe('');
    });

    it('should collect visible fields but skip hidden ones', () => {
      DOM.tipoOrdem.value = 'AFERIÇÃO DE MEDIDOR';
      renderRetorno();
      // Set medidor = SUBSTITUIDO to show leitura and toi
      const medidor = document.getElementById('medidor_afericao');
      medidor.value = 'SUBSTITUIDO';
      medidor.dispatchEvent(new Event('change'));
      const leitura = document.getElementById('leitura_afericao');
      leitura.value = 'VISUAL E NETBOOK';
      leitura.dispatchEvent(new Event('change'));
      const toi = document.getElementById('toi_afericao');
      toi.value = 'APLICADO TOI';
      toi.dispatchEvent(new Event('change'));
      document.getElementById('numero_toi').value = '12345';
      // Set cancel field (should be hidden since medidor != NAO SUBSTITUIDO)
      document.getElementById('Motivo_cancel_afericao').value = 'teste';
      const data = collectRetorno();
      expect(data.medidor_afericao).toBe('SUBSTITUIDO');
      expect(data.leitura_afericao).toBe('VISUAL E NETBOOK');
      expect(data.toi_afericao).toBe('APLICADO TOI');
      expect(data.numero_toi).toBe('12345');
      // Hidden fields should NOT be collected
      expect(data.Motivo_cancel_afericao).toBeUndefined();
      expect(data.motivo_nao_colher).toBeUndefined();
      expect(data.porque_nao_aplicado_toi).toBeUndefined();
    });
  });
});

// tests/helpers/dom-fixture.js
// DOM fixture factory for tests — substitutes duplicated document.body.innerHTML in ~28 test files.
// Uso: import { createTestDOM } from '../helpers/dom-fixture.js';

import { cacheDOM } from '../../scripts/dom.js';

/**
 * Cria a estrutura DOM completa para testes, correspondendo ao index.html real.
 *
 * @param {object} [opts]
 * @param {boolean} [opts.withTipoOrdem=true] - incluir <select id="tipo-ordem"> com opções
 * @param {string[]} [opts.extraTipoOptions=[]] - opções adicionais para tipo-ordem
 */
export function createTestDOM(opts = {}) {
  const { withTipoOrdem = true, extraTipoOptions = [] } = opts;

  const tipoOrdemHTML = withTipoOrdem
    ? `
    <select id="tipo-ordem" class="w-full px-3.5 py-3 border rounded-[10px] text-[15px] font-sans outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10">
      <option value="">Selecione</option>
      <option value="ADEQUACAO SMF">ADEQUACAO SMF</option>
      <option value="CORTE POR FALTA DE PAGAMENTO">CORTE POR FALTA DE PAGAMENTO</option>
      <option value="CORTE DE UC POR DEF TECNICO">CORTE DE UC POR DEF TECNICO</option>
      <option value="DESLIG.PROG.MANUTENCAO">DESLIG.PROG.MANUTENCAO</option>
      <option value="INSPECAO UC CORTADA I15">INSPECAO UC CORTADA I15</option>
      <option value="LIGACAO NOVA MEDIA TENSAO">LIGACAO NOVA MEDIA TENSAO</option>
      ${extraTipoOptions.join('\n')}
    </select>`
    : '';

  document.body.innerHTML = `
    <div class="container bg-white rounded-[20px] shadow-sm border border-slate-200/50 w-full max-w-[640px] relative">

      <div class="flex justify-between items-center px-5 pt-3.5 pb-2.5">
        <button class="hamburger" id="hamburger" aria-label="Menu">☰</button>
        <h1 class="text-xl text-slate-900 font-bold m-0 tracking-tight">Retorno de Ordens</h1>
        <button class="btn-new-form" id="btn-novo-form" title="Novo formulário">+</button>
      </div>

      <div id="error-msg" role="alert" aria-live="assertive" style="display:none"></div>

      <!-- Section 1: Início -->
      <section class="sec-card" id="sec-inicio">
        <div class="sec-head"><span class="sec-num">1</span> Início</div>
        <div class="sec-body" id="iniciais-campos"></div>
      </section>

      ${tipoOrdemHTML}

      <!-- Section 2: Retorno -->
      <section class="sec-card" id="sec-retorno">
        <div class="sec-head"><span class="sec-num">2</span> Retorno</div>
        <div class="sec-body">
          <p id="retorno-desc">—</p>
          <div id="retorno-placeholder"></div>
          <div id="retorno-campos"></div>
        </div>
      </section>

      <!-- Section 3: Equipamentos -->
      <section class="sec-card" id="sec-equipamentos">
        <div class="sec-head"><span class="sec-num">3</span> Equipamentos</div>
        <div class="sec-body">
          <select id="instalado-equip" data-required>
            <option value="">Selecione</option>
            <option value="NAO">NAO</option>
            <option value="SIM">SIM</option>
          </select>
          <div id="sec-equip-instalados" class="hidden">
            <div id="checkboxes-instalados"></div>
            <div id="campos-instalados"></div>
          </div>
          <select id="retirado-equip" data-required>
            <option value="">Selecione</option>
            <option value="NAO">NAO</option>
            <option value="SIM">SIM</option>
          </select>
          <div id="sec-equip-retirados" class="hidden">
            <div id="checkboxes-retirados"></div>
            <div id="campos-retirados"></div>
          </div>
        </div>
      </section>

      <!-- Section 4: Anexos -->
      <section class="sec-card" id="sec-anexos">
        <div class="sec-head"><span class="sec-num">4</span> Anexos</div>
        <div class="sec-body">
          <div id="file-upload-area">
            <span id="file-count">0 / 12</span>
          </div>
          <input type="file" id="file-input" multiple>
          <div id="preview-grid"></div>
        </div>
      </section>

      <!-- Section 5: Revisão -->
      <section class="sec-card" id="sec-revisao">
        <div class="sec-head"><span class="sec-num">5</span> Revisão</div>
        <div class="sec-body">
          <div id="preview-corpo">—</div>
          <textarea id="complemento-corpo"></textarea>
        </div>
      </section>

      <!-- Send button -->
      <button id="btn-enviar">📨 Enviar</button>
    </div>

    <div class="sidebar" id="sidebar" role="complementary" aria-label="Registros">
      <div class="sidebar-inner">
        <button class="sidebar-close" id="sidebar-close" aria-label="Fechar">×</button>
        <label for="sidebar-filter" class="sr-only">Buscar</label>
        <input type="search" id="sidebar-filter" placeholder="Buscar...">
        <div id="sidebar-list"></div>
      </div>
    </div>
    <div id="sidebar-overlay"></div>

    <div class="toast" id="toast" role="status" aria-live="polite"></div>

    <div class="modal-overlay hidden" id="dup-modal" role="dialog" aria-modal="true">
      <p id="dup-modal-title"></p>
      <p id="dup-modal-body"></p>
      <button id="dup-modal-cancel">Cancelar</button>
      <button id="dup-modal-confirm">Reenviar</button>
    </div>

    <div class="lightbox-overlay hidden" id="lightbox">
      <button id="lightbox-close" aria-label="Fechar">✕</button>
      <img id="lightbox-img" src="" alt="Preview">
    </div>

    <div class="modal-overlay hidden" id="confirm-modal" role="dialog" aria-modal="true">
      <p id="confirm-modal-text"></p>
      <button id="confirm-modal-cancel">Cancelar</button>
      <button id="confirm-modal-ok">Confirmar</button>
    </div>

    <div class="modal-overlay hidden" id="update-modal">
      <button id="update-modal-ok">OK</button>
    </div>
  `;

  // Compatibilidade: alguns testes referenciam #modal-tipo (modal antigo que não existe mais no HTML real).
  // Criar aliases para elementos existentes.
  if (!document.getElementById('modal-tipo')) {
    const oldModal = document.createElement('div');
    oldModal.className = 'modal-overlay hidden';
    oldModal.id = 'modal-tipo';
    oldModal.innerHTML = `
      <p id="modal-tipo-text"></p>
      <button id="modal-cancel">Cancelar</button>
      <button id="modal-confirm">Alterar mesmo assim</button>
    `;
    document.body.appendChild(oldModal);
  }

  // Re-executar cacheDOM para que o Proxy aponte para os novos elementos
  cacheDOM();
}

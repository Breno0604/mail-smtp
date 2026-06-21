// Test setup - mocks browser APIs and sets up DOM structure

// Mock crypto.randomUUID
if (!globalThis.crypto?.randomUUID) {
  globalThis.crypto = {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).slice(2),
  };
}

// Mock URL.createObjectURL and URL.revokeObjectURL
if (!globalThis.URL?.createObjectURL) {
  globalThis.URL.createObjectURL = () => 'blob:test';
  globalThis.URL.revokeObjectURL = () => {};
}

// Mock canvas methods
HTMLCanvasElement.prototype.getContext = function () {
  return {
    drawImage: () => {},
    toBlob: cb => cb(new Blob(['test'], { type: 'image/jpeg' })),
  };
};

// Mock Image
class MockImage {
  constructor() {
    this.naturalWidth = 100;
    this.naturalHeight = 100;
    setTimeout(() => this.onload?.(), 0);
  }
}
globalThis.Image = MockImage;

// Set up basic DOM structure needed by the app
document.body.innerHTML = `
  <div class="container">
    <div class="progress" id="progress">
      <div class="step" data-step="1">Iniciais</div>
      <div class="step" data-step="2">Equip.</div>
      <div class="step" data-step="3">Retorno</div>
      <div class="step" data-step="4">Anexos</div>
      <div class="step" data-step="5">Revisão</div>
    </div>

    <div class="error-msg" id="error-msg" style="display:none"></div>

    <div class="section-wrapper" id="section-wrapper">
      <div class="section active" id="section-1">
        <div id="iniciais-campos"></div>
      </div>

      <div class="section" id="section-2">
        <div id="equipamentos-list"></div>
        <button id="btn-add-equip">+ Adicionar equipamento</button>
      </div>

      <div class="section" id="section-3">
        <p id="retorno-desc">Preencha as informações de retorno.</p>
        <div id="retorno-campos"></div>
      </div>

      <div class="section" id="section-4">
        <div id="file-upload-area">Clique para selecionar imagens</div>
        <input type="file" id="file-input" accept="image/*" multiple class="hidden">
        <div class="preview-grid" id="preview-grid"></div>
        <span class="file-count" id="file-count">0 / 12</span>
      </div>

      <div class="section" id="section-5">
        <div class="email-preview">
          <div class="preview-value" id="preview-corpo">—</div>
          <textarea id="complemento-corpo" rows="3"></textarea>
        </div>
      </div>
    </div>

    <div class="nav-buttons" id="nav-buttons">
      <button class="btn btn-secondary" id="btn-anterior" disabled>← Anterior</button>
      <button class="btn btn-primary" id="btn-proximo">Avançar →</button>
    </div>
  </div>

  <div class="sidebar" id="sidebar">
    <div class="sidebar-inner">
      <h2 class="sidebar-title">Registros</h2>
      <button class="sidebar-close" id="sidebar-close">&times;</button>
    </div>
    <input type="search" id="sidebar-filter" placeholder="Buscar por UC ou OS...">
    <div class="sidebar-list" id="sidebar-list"></div>
  </div>
  <div class="sidebar-overlay" id="sidebar-overlay"></div>

  <div class="toast" id="toast"></div>

  <div class="modal-overlay hidden" id="modal-tipo">
    <div class="modal">
      <p id="modal-tipo-text"></p>
      <button id="modal-cancel">Cancelar</button>
      <button id="modal-confirm">Alterar mesmo assim</button>
    </div>
  </div>

  <div class="modal-overlay hidden" id="dup-modal">
    <div class="modal">
      <p id="dup-modal-title"></p>
      <p id="dup-modal-body"></p>
      <button id="dup-modal-cancel">Cancelar</button>
      <button id="dup-modal-confirm">Reenviar</button>
    </div>
  </div>

  <div class="lightbox-overlay hidden" id="lightbox">
    <button id="lightbox-close">✕</button>
    <img id="lightbox-img" src="" alt="Preview ampliado">
  </div>

  <div class="modal-overlay hidden" id="confirm-modal">
    <div class="modal">
      <p id="confirm-modal-text"></p>
      <button id="confirm-modal-cancel">Cancelar</button>
      <button id="confirm-modal-ok">Confirmar</button>
    </div>
  </div>
`;

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear();
});

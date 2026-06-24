// DOM cache module
// Convention: DOM elements are cached once via cacheDOM() and never reassigned.
// Individual element properties (textContent, className, value) may be mutated.

// Cache interno recriado a cada cacheDOM() para suportar múltiplas chamadas (testes).
// DOM é um Proxy que delega leituras ao cache atual e ignora escritas externas.
let _cache = {};

export function cacheDOM() {
  const fresh = {};

  // Header
  fresh.hamburger = document.getElementById('hamburger');
  fresh.btnNovoForm = document.getElementById('btn-novo-form');

  // Sections
  fresh.secInicio = document.getElementById('sec-inicio');
  fresh.secRetorno = document.getElementById('sec-retorno');
  fresh.secEquipamentos = document.getElementById('sec-equipamentos');
  fresh.secAnexos = document.getElementById('sec-anexos');
  fresh.secRevisao = document.getElementById('sec-revisao');

  // Error & Toast
  fresh.errorMsg = document.getElementById('error-msg');
  fresh.toast = document.getElementById('toast');

  // Início
  fresh.iniciaisCampos = document.getElementById('iniciais-campos');
  // tipoOrdem usa getter porque renderIniciais() recria o elemento após cacheDOM().
  // O getter sempre consulta o DOM ao vivo, sem referências obsoletas.
  Object.defineProperty(fresh, 'tipoOrdem', {
    get() {
      return document.getElementById('tipo-ordem');
    },
    enumerable: true,
    configurable: false,
  });

  // Retorno
  fresh.retornoDesc = document.getElementById('retorno-desc');
  fresh.retornoPlaceholder = document.getElementById('retorno-placeholder');
  fresh.retornoCampos = document.getElementById('retorno-campos');

  // Equipamentos
  fresh.instaladoEquip = document.getElementById('instalado-equip');
  fresh.retiradoEquip = document.getElementById('retirado-equip');
  fresh.secEquipInstalados = document.getElementById('sec-equip-instalados');
  fresh.secEquipRetirados = document.getElementById('sec-equip-retirados');
  fresh.checkboxesInstalados = document.getElementById('checkboxes-instalados');
  fresh.checkboxesRetirados = document.getElementById('checkboxes-retirados');
  fresh.camposInstalados = document.getElementById('campos-instalados');
  fresh.camposRetirados = document.getElementById('campos-retirados');

  // Anexos
  fresh.fileInput = document.getElementById('file-input');
  fresh.fileCount = document.getElementById('file-count');
  fresh.previewGrid = document.getElementById('preview-grid');
  fresh.fileUploadArea = document.getElementById('file-upload-area');

  // Revisão
  fresh.previewCorpo = document.getElementById('preview-corpo');

  // Send
  fresh.btnEnviar = document.getElementById('btn-enviar');

  // Sidebar
  fresh.sidebar = document.getElementById('sidebar');
  fresh.sidebarOverlay = document.getElementById('sidebar-overlay');
  fresh.sidebarClose = document.getElementById('sidebar-close');
  fresh.sidebarList = document.getElementById('sidebar-list');
  fresh.sidebarFilter = document.getElementById('sidebar-filter');

  // Modals
  fresh.dupModal = document.getElementById('dup-modal');
  fresh.dupModalTitle = document.getElementById('dup-modal-title');
  fresh.dupModalBody = document.getElementById('dup-modal-body');
  fresh.dupModalCancel = document.getElementById('dup-modal-cancel');
  fresh.dupModalConfirm = document.getElementById('dup-modal-confirm');
  fresh.lightbox = document.getElementById('lightbox');
  fresh.lightboxImg = document.getElementById('lightbox-img');
  fresh.lightboxClose = document.getElementById('lightbox-close');
  fresh.confirmModal = document.getElementById('confirm-modal');
  fresh.confirmModalText = document.getElementById('confirm-modal-text');
  fresh.confirmModalOk = document.getElementById('confirm-modal-ok');
  fresh.confirmModalCancel = document.getElementById('confirm-modal-cancel');
  fresh.updateModal = document.getElementById('update-modal');
  fresh.updateModalOk = document.getElementById('update-modal-ok');

  // Congela o cache para prevenir mutações acidentais nas chaves do objeto.
  // Propriedades de elementos DOM individuais (textContent, className, value) ainda podem ser alteradas.
  Object.freeze(fresh);

  // Atualiza o cache — chamadas subsequentes a cacheDOM() criam um novo objeto fresco.
  _cache = fresh;
}

// Proxy que delega leituras ao cache atual e ignora escritas externas.
// Isso permite que cacheDOM() seja chamado múltiplas vezes (ex: testes com beforeEach)
// sem que o módulo precise reexportar um novo objeto a cada chamada.
export const DOM = new Proxy(
  {},
  {
    get(_, prop) {
      return _cache[prop];
    },
    set() {
      return true;
    },
  }
);

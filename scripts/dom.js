// DOM cache module
// Convention: DOM elements are cached once via cacheDOM() and never reassigned.
// Individual element properties (textContent, className, value) may be mutated.

const DOM = {};

export function cacheDOM() {
  // Header
  DOM.hamburger = document.getElementById('hamburger');
  DOM.btnNovoForm = document.getElementById('btn-novo-form');

  // Sections
  DOM.secInicio = document.getElementById('sec-inicio');
  DOM.secRetorno = document.getElementById('sec-retorno');
  DOM.secEquipamentos = document.getElementById('sec-equipamentos');
  DOM.secAnexos = document.getElementById('sec-anexos');
  DOM.secRevisao = document.getElementById('sec-revisao');

  // Error & Toast
  DOM.errorMsg = document.getElementById('error-msg');
  DOM.toast = document.getElementById('toast');

  // Início
  DOM.iniciaisCampos = document.getElementById('iniciais-campos');
  DOM.tipoOrdem = document.getElementById('tipo-ordem');

  // Retorno
  DOM.retornoDesc = document.getElementById('retorno-desc');
  DOM.retornoPlaceholder = document.getElementById('retorno-placeholder');
  DOM.retornoCampos = document.getElementById('retorno-campos');

  // Equipamentos
  DOM.instaladoEquip = document.getElementById('instalado-equip');
  DOM.retiradoEquip = document.getElementById('retirado-equip');
  DOM.secEquipInstalados = document.getElementById('sec-equip-instalados');
  DOM.secEquipRetirados = document.getElementById('sec-equip-retirados');
  DOM.checkboxesInstalados = document.getElementById('checkboxes-instalados');
  DOM.checkboxesRetirados = document.getElementById('checkboxes-retirados');
  DOM.camposInstalados = document.getElementById('campos-instalados');
  DOM.camposRetirados = document.getElementById('campos-retirados');

  // Anexos
  DOM.fileInput = document.getElementById('file-input');
  DOM.fileCount = document.getElementById('file-count');
  DOM.previewGrid = document.getElementById('preview-grid');
  DOM.fileUploadArea = document.getElementById('file-upload-area');

  // Revisão
  DOM.previewCorpo = document.getElementById('preview-corpo');

  // Send
  DOM.btnEnviar = document.getElementById('btn-enviar');

  // Sidebar
  DOM.sidebar = document.getElementById('sidebar');
  DOM.sidebarOverlay = document.getElementById('sidebar-overlay');
  DOM.sidebarClose = document.getElementById('sidebar-close');
  DOM.sidebarList = document.getElementById('sidebar-list');
  DOM.sidebarFilter = document.getElementById('sidebar-filter');

  // Modals
  DOM.dupModal = document.getElementById('dup-modal');
  DOM.dupModalTitle = document.getElementById('dup-modal-title');
  DOM.dupModalBody = document.getElementById('dup-modal-body');
  DOM.dupModalCancel = document.getElementById('dup-modal-cancel');
  DOM.dupModalConfirm = document.getElementById('dup-modal-confirm');
  DOM.lightbox = document.getElementById('lightbox');
  DOM.lightboxImg = document.getElementById('lightbox-img');
  DOM.lightboxClose = document.getElementById('lightbox-close');
  DOM.confirmModal = document.getElementById('confirm-modal');
  DOM.confirmModalText = document.getElementById('confirm-modal-text');
  DOM.confirmModalOk = document.getElementById('confirm-modal-ok');
  DOM.confirmModalCancel = document.getElementById('confirm-modal-cancel');
  DOM.updateModal = document.getElementById('update-modal');
  DOM.updateModalOk = document.getElementById('update-modal-ok');
}

export { DOM };

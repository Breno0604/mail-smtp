export const DOM = {};

export function cacheDOM() {
  DOM.sections = document.querySelectorAll(".section");
  DOM.wrapper = document.getElementById("section-wrapper");
  DOM.steps = document.querySelectorAll(".step");
  DOM.lines = document.querySelectorAll(".step-line");
  DOM.btnAnterior = document.getElementById("btn-anterior");
  DOM.btnProximo = document.getElementById("btn-proximo");
  DOM.errorMsg = document.getElementById("error-msg");
  DOM.iniciaisCampos = document.getElementById("iniciais-campos");
  DOM.tipoOrdem = document.getElementById("tipo-ordem");
  DOM.equipList = document.getElementById("equipamentos-list");
  DOM.btnAddEquip = document.getElementById("btn-add-equip");
  DOM.btnSkipEquip = document.getElementById("btn-skip-equip");
  DOM.retornoDesc = document.getElementById("retorno-desc");
  DOM.retornoCampos = document.getElementById("retorno-campos");
  DOM.fileInput = document.getElementById("file-input");
  DOM.fileCount = document.getElementById("file-count");
  DOM.previewGrid = document.getElementById("preview-grid");
  DOM.fileUploadArea = document.getElementById("file-upload-area");
  DOM.previewCorpo = document.getElementById("preview-corpo");
  DOM.complementoCorpo = document.getElementById("complemento-corpo");
  DOM.toast = document.getElementById("toast");
  DOM.btnLimpar = document.getElementById("btn-limpar");
  DOM.modalTipo = document.getElementById("modal-tipo");
  DOM.modalCancel = document.getElementById("modal-cancel");
  DOM.modalConfirm = document.getElementById("modal-confirm");
  DOM.lightbox = document.getElementById("lightbox");
  DOM.lightboxImg = document.getElementById("lightbox-img");
  DOM.lightboxClose = document.getElementById("lightbox-close");
}

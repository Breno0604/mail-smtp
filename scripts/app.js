import { DOM, cacheDOM } from "./dom.js";
import { state, STORAGE_KEY, saveState } from "./state.js";
import { addBlurValidation } from "./validation.js";
import { addEquip } from "./equipment.js";
import { handleTipoChange, cancelTipoChange, confirmTipoChange } from "./retornos.js";
import { handleUploadClick, handleFileChange, closeLightbox, updateFileCount } from "./attachments.js";
import { showSection, prevSection, nextSection } from "./navigation.js";
import { resetForm } from "./reset.js";

function restoreSavedState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const data = JSON.parse(saved);
    const section = data.currentSection || 1;
    const ok = confirm(`H\u00E1 um formul\u00E1rio salvo (Se\u00E7\u00E3o ${section} de 5). Deseja continuar de onde parou?`);
    if (!ok) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    DOM.uc.value = data.uc || "";
    DOM.os.value = data.os || "";
    DOM.cliente.value = data.cliente || "";
    DOM.tipoOrdem.value = data.tipoOrdem || "";
    state.equipamentos = data.equipamentos || [];
    state.lastTipoOrdem = data.lastTipoOrdem || "";
    state.visitedRetorno = data.visitedRetorno || false;
    showSection(section, "next", true);
  } catch (e) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function initEvents() {
  DOM.btnAnterior.addEventListener("click", prevSection);
  DOM.btnProximo.addEventListener("click", nextSection);
  DOM.btnAddEquip.addEventListener("click", () => addEquip());
  DOM.btnSkipEquip.addEventListener("click", () => showSection(3, "next"));
  DOM.tipoOrdem.addEventListener("change", handleTipoChange);
  DOM.modalCancel.addEventListener("click", cancelTipoChange);
  DOM.modalConfirm.addEventListener("click", confirmTipoChange);
  DOM.fileUploadArea.addEventListener("click", handleUploadClick);
  DOM.fileInput.addEventListener("change", handleFileChange);
  DOM.lightboxClose.addEventListener("click", closeLightbox);
  DOM.lightbox.addEventListener("click", (e) => {
    if (e.target === DOM.lightbox) closeLightbox();
  });
  DOM.btnLimpar.addEventListener("click", () => {
    if (!confirm("Tem certeza? Todos os dados ser\u00E3o perdidos.")) return;
    resetForm();
    showSection(1, "prev", true);
  });

  [DOM.uc, DOM.os, DOM.cliente, DOM.tipoOrdem].forEach((el) => {
    if (el) addBlurValidation(el);
  });

  document.querySelectorAll("input, select, textarea").forEach((el) => {
    el.addEventListener("change", saveState);
    el.addEventListener("input", saveState);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  cacheDOM();
  initEvents();
  updateFileCount();
  restoreSavedState();
  if (state.currentSection === 1 && !document.getElementById("section-1").classList.contains("active")) {
    showSection(1, "next", true);
  }
});

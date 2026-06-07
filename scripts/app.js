import { DOM, cacheDOM } from "./dom.js";
import { state, debouncedSave } from "./state.js";
import { renderIniciais } from "./iniciais.js";
import { addEquip } from "./equipment.js";
import { handleTipoChange, cancelTipoChange, confirmTipoChange } from "./retornos.js";
import { handleUploadClick, handleFileChange, closeLightbox, updateFileCount } from "./attachments.js";
import { showSection, prevSection, nextSection } from "./navigation.js";
import { resetForm } from "./reset.js";
import { renderSidebar, closeSidebar } from "./sidebar.js";
import { getRecord } from "./db.js";
import { applyRecord } from "./restore.js";

async function restoreSavedState() {
  const uuid = sessionStorage.getItem("currentUUID");
  if (!uuid) return false;

  try {
    const record = await getRecord(uuid);
    if (!record) {
      sessionStorage.removeItem("currentUUID");
      return false;
    }
    const ok = confirm(`H\u00E1 um formul\u00E1rio salvo (Se\u00E7\u00E3o ${record.currentSection} de 5). Deseja continuar de onde parou?`);
    if (!ok) {
      sessionStorage.removeItem("currentUUID");
      return false;
    }

    applyRecord(record);
    return true;
  } catch (_) {
    return false;
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
  DOM.hamburger.addEventListener("click", () => {
    renderSidebar();
    document.body.classList.add("sidebar-open");
  });
  DOM.sidebarOverlay.addEventListener("click", closeSidebar);
  DOM.sidebarClose.addEventListener("click", closeSidebar);

  document.addEventListener("pointerdown", (e) => {
    if (e.target.tagName !== "INPUT" && e.target.tagName !== "SELECT" && e.target.tagName !== "TEXTAREA") {
      document.activeElement?.blur();
    }
  });

  document.querySelectorAll("input, select, textarea").forEach((el) => {
    el.addEventListener("change", debouncedSave);
    el.addEventListener("input", debouncedSave);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  cacheDOM();
  renderIniciais();
  DOM.tipoOrdem = document.getElementById("tipo-ordem");
  initEvents();
  updateFileCount();
  const restored = await restoreSavedState();
  if (!restored && state.currentSection === 1 && !document.getElementById("section-1").classList.contains("active")) {
    showSection(1, "next", true);
  }
});

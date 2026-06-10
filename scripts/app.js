import { DOM, cacheDOM } from "./dom.js";
import { state, debouncedSave, saveState, clearCurrentUUID } from "./state.js";
import { renderIniciais, getIniciaisData } from "./iniciais.js";
import { addEquip } from "./equipment.js";
import { handleTipoChange } from "./retornos.js";
import { handleUploadClick, handleFileChange, closeLightbox, updateFileCount, renderPreviews } from "./attachments.js";
import { resetForm } from "./reset.js";
import { renderSidebar, closeSidebar, initSidebarFilter } from "./sidebar.js";
import { captureCoordinates } from "./utils.js";
import { sendEmail } from "./send.js";
import { updateLivePreview } from "./email.js";

function updateFilledClass(el) {
  if (el.value && el.value.trim() !== "") {
    el.classList.add("is-filled");
  } else {
    el.classList.remove("is-filled");
  }
}

/**
 * Verifica se UC e OS estão preenchidos e habilita o auto-save inicial.
 * Quando ambos estão preenchidos, seta iniciaisValido = true e dispara saveState().
 */
function checkInitialPersistence() {
  const iniciaisData = getIniciaisData();
  const ucPreenchido = iniciaisData.uc && iniciaisData.uc.trim() !== "";
  const osPreenchido = iniciaisData.os && iniciaisData.os.trim() !== "";

  if (ucPreenchido && osPreenchido && !state.iniciaisValido) {
    state.iniciaisValido = true;
    saveState();
  }
}

export function updateAllFilledClasses() {
  document.querySelectorAll("input, select, textarea").forEach((el) => {
    updateFilledClass(el);
  });
}

function initEvents() {
  DOM.btnEnviar.addEventListener("click", sendEmail);

  DOM.btnNovoForm.addEventListener("click", async () => {
    await saveState();
    resetForm();
    await captureCoordinates();
    updateAllFilledClasses();
  });

  DOM.btnAddEquip.addEventListener("click", () => addEquip());

  DOM.tipoOrdem.addEventListener("change", handleTipoChange);

  DOM.fileUploadArea.addEventListener("click", handleUploadClick);
  DOM.fileInput.addEventListener("change", handleFileChange);

  DOM.lightboxClose.addEventListener("click", closeLightbox);
  DOM.lightbox.addEventListener("click", (e) => {
    if (e.target === DOM.lightbox) closeLightbox();
  });

  DOM.hamburger.addEventListener("click", () => {
    renderSidebar();
    document.body.classList.add("sidebar-open");
  });
  DOM.sidebarOverlay.addEventListener("click", closeSidebar);
  DOM.sidebarClose.addEventListener("click", closeSidebar);

  document.addEventListener("input", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA") {
      updateFilledClass(e.target);
      debouncedSave();
      updateLivePreview();
      // Check if UC and OS are now filled to enable initial persistence
      if (e.target.id === "uc" || e.target.id === "os") {
        checkInitialPersistence();
      }
    }
  });

  document.addEventListener("change", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA") {
      updateFilledClass(e.target);
      debouncedSave();
      updateLivePreview();
      // Check if UC and OS are now filled to enable initial persistence
      if (e.target.id === "uc" || e.target.id === "os") {
        checkInitialPersistence();
      }
    }
  });

  document.addEventListener("pointerdown", (e) => {
    if (e.target.tagName !== "INPUT" && e.target.tagName !== "SELECT" && e.target.tagName !== "TEXTAREA" && e.target.tagName !== "BUTTON") {
      document.activeElement?.blur();
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  cacheDOM();
  initSidebarFilter();
  renderIniciais();
  initEvents();
  updateFileCount();
  renderPreviews();
  await captureCoordinates();
  updateLivePreview();
  updateAllFilledClasses();
  // Limpar UUID ao iniciar (sempre começa limpo)
  clearCurrentUUID();
});

import { DOM, cacheDOM } from "./dom.js";
import { state, clearCurrentUUID } from "./state.js";
import { saveState, debouncedSave } from "./persistence.js";
import { iniciaisFields } from "./fields.js";
import { renderIniciais } from "./iniciais.js";
import { addEquip } from "./equipment.js";
import { collectEquipamentos } from "./collectors.js";
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
  const ucPreenchido = state.iniciais.uc && state.iniciais.uc.trim() !== "";
  const osPreenchido = state.iniciais.os && state.iniciais.os.trim() !== "";

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

  /**
   * Sync a DOM element's value to state.iniciais if it matches an iniciais field
   */
  function syncIniciaisField(el) {
    const field = iniciaisFields.find(f => f.nome === el.id);
    if (field) {
      state.iniciais[field.nome] = el.value;
    }
  }

  function handleFieldChange(e) {
    if (e.target.tagName !== "INPUT" && e.target.tagName !== "SELECT" && e.target.tagName !== "TEXTAREA") return;
    updateFilledClass(e.target);
    syncIniciaisField(e.target);
    if (e.target.closest('.equip-row')) {
      collectEquipamentos();
    }
    debouncedSave();
    updateLivePreview();
    if (e.target.id === "uc" || e.target.id === "os") {
      checkInitialPersistence();
    }
  }

  document.addEventListener("input", handleFieldChange);
  document.addEventListener("change", handleFieldChange);

  document.addEventListener("pointerdown", (e) => {
    if (e.target.tagName !== "INPUT" && e.target.tagName !== "SELECT" && e.target.tagName !== "TEXTAREA" && e.target.tagName !== "BUTTON") {
      document.activeElement?.blur();
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  cacheDOM();
  initSidebarFilter();

  // Solicita armazenamento persistente (protege contra limpeza automática do navegador)
  if (navigator.storage?.persist) {
    await navigator.storage.persist();
  }

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

import { DOM, cacheDOM } from "./dom.js";
import { state, debouncedSave, saveState, getCurrentUUID, clearCurrentUUID } from "./state.js";
import { renderIniciais } from "./iniciais.js";
import { addEquip } from "./equipment.js";
import { handleTipoChange } from "./retornos.js";
import { handleUploadClick, handleFileChange, closeLightbox, updateFileCount, renderPreviews } from "./attachments.js";
import { resetForm } from "./reset.js";
import { renderSidebar, closeSidebar, initSidebarFilter } from "./sidebar.js";
import { getRecord } from "./db.js";
import { applyRecord } from "./restore.js";
import { showConfirm } from "./ui.js";
import { captureCoordinates } from "./utils.js";
import { sendEmail } from "./send.js";
import { updateLivePreview } from "./email.js";

async function restoreSavedState() {
  const uuid = getCurrentUUID();
  if (!uuid) return false;

  try {
    const record = await getRecord(uuid);
    if (!record) {
      clearCurrentUUID();
      return false;
    }

    const ok = await showConfirm("H\u00E1 um formul\u00E1rio salvo. Deseja continuar de onde parou?");
    if (!ok) {
      clearCurrentUUID();
      return false;
    }

    applyRecord(record);
    updateAllFilledClasses();
    updateLivePreview();
    return true;
  } catch (_) {
    return false;
  }
}

function updateFilledClass(el) {
  if (el.value && el.value.trim() !== "") {
    el.classList.add("is-filled");
  } else {
    el.classList.remove("is-filled");
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
    }
  });

  document.addEventListener("change", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA") {
      updateFilledClass(e.target);
      debouncedSave();
      updateLivePreview();
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
  const restored = await restoreSavedState();
  if (!restored) {
    updateLivePreview();
  }
  updateAllFilledClasses();
});

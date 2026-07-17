import { DOM, cacheDOM } from './dom.js';
import { state, clearCurrentUUID } from './state.js';
import { saveState, debouncedSave } from './persistence.js';
import { iniciaisFields } from './fields.js';
import { renderIniciais } from './iniciais.js';
import { cleanupOldSentRecords } from './db.js';
import {
  renderEquipamentos,
  toggleSectionVisibility,
  toggleFieldVisibility,
  updateFieldValue,
} from './equipment.js';
import { handleTipoChange } from './retornos.js';
import {
  handleUploadClick,
  handleFileChange,
  closeLightbox,
  updateFileCount,
  renderPreviews,
} from './attachments.js';
import { resetForm } from './reset.js';
import { renderSidebar, closeSidebar, initSidebarFilter } from './sidebar.js';
import { captureCoordinates } from './utils.js';
import { sendEmail } from './send.js';
import { updateLivePreview } from './email.js';
import { updateFilledClass, updateAllFilledClasses } from './filled-state.js';

/**
 * Verifica se UC e OS estão preenchidos e habilita o auto-save inicial.
 * Quando ambos estão preenchidos, seta iniciaisValido = true e dispara saveState().
 */
export async function checkInitialPersistence() {
  const ucPreenchido = state.iniciais.uc && state.iniciais.uc.trim() !== '';
  const osPreenchido = state.iniciais.os && state.iniciais.os.trim() !== '';

  if (ucPreenchido && osPreenchido && !state.iniciaisValido) {
    state.iniciaisValido = true;
    await saveState();
  }
}

function initEvents() {
  DOM.btnEnviar.addEventListener('click', sendEmail);

  DOM.btnNovoForm.addEventListener('click', async () => {
    await saveState();
    resetForm();
    captureCoordinates();
    updateAllFilledClasses();
  });

  DOM.tipoOrdem.addEventListener('change', handleTipoChange);

  // Equipment control fields
  DOM.instaladoEquip.addEventListener('change', () => {
    toggleSectionVisibility('instalados');
    debouncedSave();
    updateLivePreview();
  });

  DOM.retiradoEquip.addEventListener('change', () => {
    toggleSectionVisibility('retirados');
    debouncedSave();
    updateLivePreview();
  });

  DOM.fileUploadArea.addEventListener('click', handleUploadClick);
  DOM.fileInput.addEventListener('change', handleFileChange);

  DOM.lightboxClose.addEventListener('click', closeLightbox);
  DOM.lightbox.addEventListener('click', e => {
    if (e.target === DOM.lightbox) closeLightbox();
  });

  DOM.hamburger.addEventListener('click', () => {
    renderSidebar();
    document.body.classList.add('sidebar-open');
  });
  DOM.sidebarOverlay.addEventListener('click', closeSidebar);
  DOM.sidebarClose.addEventListener('click', closeSidebar);

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
    if (
      e.target.tagName !== 'INPUT' &&
      e.target.tagName !== 'SELECT' &&
      e.target.tagName !== 'TEXTAREA'
    )
      return;

    // Converte o valor digitado para upperCase em tempo real (input/textarea)
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const upperValue = e.target.value.toUpperCase();
      if (upperValue !== e.target.value) {
        e.target.value = upperValue;
        // Preserva posição do cursor para não atrapalhar digitação
        if (document.activeElement === e.target) {
          e.target.setSelectionRange(start, end);
        }
      }
    }

    updateFilledClass(e.target);
    syncIniciaisField(e.target);
    debouncedSave();
    updateLivePreview();
    if (e.target.id === 'uc' || e.target.id === 'os') {
      checkInitialPersistence();
    }
  }

  document.addEventListener('input', handleFieldChange);
  document.addEventListener('change', handleFieldChange);

  document.addEventListener('pointerdown', e => {
    if (
      e.target.tagName !== 'INPUT' &&
      e.target.tagName !== 'SELECT' &&
      e.target.tagName !== 'TEXTAREA' &&
      e.target.tagName !== 'BUTTON'
    ) {
      document.activeElement?.blur();
    }
  });

  // Equipment checkboxes (delegated)
  document.addEventListener('change', e => {
    if (e.target.classList.contains('equip-checkbox')) {
      const tipo = e.target.getAttribute('data-tipo');
      const equipKey = e.target.getAttribute('data-equip');
      toggleFieldVisibility(tipo, equipKey, e.target.checked);
      updateLivePreview();
    }
  });

  // Equipment input fields (delegated)
  document.addEventListener('input', e => {
    if (e.target.matches('#campos-instalados input, #campos-retirados input')) {
      const tipo = e.target.getAttribute('data-tipo');
      const equipKey = e.target.getAttribute('data-equip');
      updateFieldValue(tipo, equipKey, e.target.value);
      updateLivePreview();
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  cacheDOM();
  initSidebarFilter();

  // Solicita armazenamento persistente (protege contra limpeza automática do navegador)
  if (navigator.storage?.persist) {
    await navigator.storage.persist();
  }

  renderIniciais();
  renderEquipamentos();
  initEvents();
  updateFileCount();
  renderPreviews();
  captureCoordinates();
  updateLivePreview();
  updateAllFilledClasses();

  // Online/offline indicator
  const statusDot = document.getElementById('status-dot');
  function updateStatusDot() {
    if (!statusDot) return;
    statusDot.classList.toggle('online', navigator.onLine);
    statusDot.classList.toggle('offline', !navigator.onLine);
  }
  updateStatusDot();
  window.addEventListener('online', updateStatusDot);
  window.addEventListener('offline', updateStatusDot);

  cleanupOldSentRecords(); // fire-and-forget, no await needed

  // Keep focused input visible when Android virtual keyboard opens
  window.visualViewport?.addEventListener('resize', () => {
    const focused = document.activeElement;
    if (focused && focused !== document.body) {
      setTimeout(() => {
        focused.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  });

  // Limpar UUID ao iniciar (sempre começa limpo)
  clearCurrentUUID();
});

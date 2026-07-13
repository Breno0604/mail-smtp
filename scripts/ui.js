import { DOM } from './dom.js';

let toastTimer = null;

export function showError(msg) {
  DOM.errorMsg.textContent = msg;
  DOM.errorMsg.style.display = 'block';
}

export function hideError() {
  DOM.errorMsg.style.display = 'none';
  DOM.errorMsg.textContent = '';
}

export function showToast(msg, success) {
  DOM.toast.textContent = msg;
  DOM.toast.classList.remove('success');
  if (success) DOM.toast.classList.add('success');
  DOM.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => DOM.toast.classList.remove('show'), 3500);
}

export function setFieldError(el, message) {
  const span = el.nextElementSibling;
  if (span && span.classList.contains('field-error')) {
    span.textContent = message;
    span.classList.add('show');
  }
}

export function clearFieldError(el) {
  const span = el.nextElementSibling;
  if (span && span.classList.contains('field-error')) {
    span.textContent = '';
    span.classList.remove('show');
  }
}

/**
 * Generic Promise-based modal interaction.
 * Shows an overlay modal with a message and confirm/cancel buttons,
 * resolves with true (confirm) or false (cancel).
 *
 * @param {HTMLElement} overlay - Modal overlay element
 * @param {HTMLElement} bodyEl - Element to set message content on
 * @param {HTMLElement} confirmBtn - Confirm button element
 * @param {HTMLElement} cancelBtn - Cancel button element
 * @param {string} bodyContent - Message content (textContent by default)
 * @param {object} [options]
 * @param {boolean} [options.useHtml=false] - Use innerHTML instead of textContent
 * @returns {Promise<boolean>}
 */
export function showModalElements(
  overlay,
  bodyEl,
  confirmBtn,
  cancelBtn,
  bodyContent,
  options = {}
) {
  return new Promise(resolve => {
    if (options.useHtml) {
      bodyEl.innerHTML = bodyContent;
    } else {
      bodyEl.textContent = bodyContent;
    }
    overlay.classList.remove('hidden');

    const cleanup = () => {
      overlay.classList.add('hidden');
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
    };

    confirmBtn.onclick = () => {
      cleanup();
      resolve(true);
    };

    cancelBtn.onclick = () => {
      cleanup();
      resolve(false);
    };
  });
}

export function showConfirm(message) {
  return showModalElements(
    DOM.confirmModal,
    DOM.confirmModalText,
    DOM.confirmModalOk,
    DOM.confirmModalCancel,
    message
  );
}

export function showAnexosModal() {
  DOM.anexosModalText.textContent = 'O formulário deve conter no mínimo 2 e no máximo 12 anexos.';
  DOM.anexosModal.classList.remove('hidden');

  DOM.anexosModalClose.onclick = () => {
    DOM.anexosModal.classList.add('hidden');
    DOM.anexosModalClose.onclick = null;
    DOM.secAnexos.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Pequeno delay para garantir que o scroll terminou antes de focar
    setTimeout(() => {
      DOM.secAnexos.setAttribute('tabindex', '-1');
      DOM.secAnexos.focus();
    }, 400);
  };
}

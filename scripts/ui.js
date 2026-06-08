import { DOM } from "./dom.js";

let toastTimer = null;

export function showError(msg) {
  DOM.errorMsg.textContent = msg;
  DOM.errorMsg.style.display = "block";
}

export function hideError() {
  DOM.errorMsg.style.display = "none";
  DOM.errorMsg.textContent = "";
}

export function showToast(msg, success) {
  DOM.toast.textContent = msg;
  DOM.toast.classList.remove("success");
  if (success) DOM.toast.classList.add("success");
  DOM.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => DOM.toast.classList.remove("show"), 3500);
}

export function setFieldError(el, message) {
  const span = el.nextElementSibling;
  if (span && span.classList.contains("field-error")) {
    span.textContent = message;
    span.classList.add("show");
  }
}

export function clearFieldError(el) {
  const span = el.nextElementSibling;
  if (span && span.classList.contains("field-error")) {
    span.textContent = "";
    span.classList.remove("show");
  }
}

export function showConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirm-modal");
    const text = document.getElementById("confirm-modal-text");
    const okBtn = document.getElementById("confirm-modal-ok");
    const cancelBtn = document.getElementById("confirm-modal-cancel");

    text.textContent = message;
    modal.classList.remove("hidden");

    const cleanup = () => {
      modal.classList.add("hidden");
      okBtn.onclick = null;
      cancelBtn.onclick = null;
    };

    okBtn.onclick = () => {
      cleanup();
      resolve(true);
    };

    cancelBtn.onclick = () => {
      cleanup();
      resolve(false);
    };
  });
}

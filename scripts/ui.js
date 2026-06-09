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
    DOM.confirmModalText.textContent = message;
    DOM.confirmModal.classList.remove("hidden");

    const cleanup = () => {
      DOM.confirmModal.classList.add("hidden");
      DOM.confirmModalOk.onclick = null;
      DOM.confirmModalCancel.onclick = null;
    };

    DOM.confirmModalOk.onclick = () => {
      cleanup();
      resolve(true);
    };

    DOM.confirmModalCancel.onclick = () => {
      cleanup();
      resolve(false);
    };
  });
}

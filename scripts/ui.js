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

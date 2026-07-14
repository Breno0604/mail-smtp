/**
 * Utilitário de UI para gerenciar a classe CSS `is-filled`.
 * Extraído de app.js para quebrar dependência circular:
 * app.js → sidebar.js → restore.js → app.js
 */

/**
 * Adiciona ou remove a classe `is-filled` de um elemento
 * baseado no seu valor atual.
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} el
 */
export function updateFilledClass(el) {
  if (el.value && el.value.trim() !== '') {
    el.classList.add('is-filled');
  } else {
    el.classList.remove('is-filled');
  }
}

/**
 * Atualiza a classe `is-filled` em todos os inputs, selects e textareas do documento.
 */
export function updateAllFilledClasses() {
  document.querySelectorAll('input, select, textarea').forEach(el => {
    updateFilledClass(el);
  });
}

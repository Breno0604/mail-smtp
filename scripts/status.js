// scripts/status.js
// Manages connection (online/offline) and save status indicators.
// Call initStatus() once after cacheDOM() in app.js.
// Export notifySaveStart/notifySaveComplete for use by persistence.js.

import { DOM } from './dom.js';

const saveEvents = new EventTarget();

/**
 * Notify status module that a save operation is starting.
 */
export function notifySaveStart() {
  saveEvents.dispatchEvent(new Event('save:start'));
}

/**
 * Notify status module that a save operation completed (success or error).
 */
export function notifySaveComplete() {
  saveEvents.dispatchEvent(new Event('save:complete'));
}

/**
 * Initialize online/offline and save status indicators.
 * Call once after cacheDOM() in the DOMContentLoaded handler.
 */
export function initStatus() {
  // --- Online/Offline ---
  const connectionDot = DOM.connectionDot;
  const connectionText = DOM.connectionText;

  function updateConnection() {
    const online = navigator.onLine;
    if (connectionDot) {
      connectionDot.className = online
        ? 'w-2 h-2 rounded-full bg-emerald-500'
        : 'w-2 h-2 rounded-full bg-red-500';
    }
    if (connectionText) {
      connectionText.textContent = online ? 'ONLINE' : 'OFFLINE';
    }
  }

  window.addEventListener('online', updateConnection);
  window.addEventListener('offline', updateConnection);
  updateConnection(); // initial state

  // --- Save status ---
  const saveText = DOM.saveStatusText;
  if (!saveText) return;

  saveText.textContent = '';

  saveEvents.addEventListener('save:start', () => {
    saveText.textContent = 'Salvando...';
    saveText.className = 'text-[10px] text-slate-400 font-medium tracking-wide';
  });

  saveEvents.addEventListener('save:complete', () => {
    saveText.textContent = 'Salvo ✓';
    saveText.className = 'text-[10px] text-emerald-600 font-medium tracking-wide';
    // Fade out after 3 seconds
    setTimeout(() => {
      if (saveText.textContent === 'Salvo ✓') {
        saveText.textContent = '';
      }
    }, 3000);
  });
}

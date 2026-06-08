export function initSW() {
  if (!('serviceWorker' in navigator)) return;

  const hadController = !!navigator.serviceWorker.controller;

  navigator.serviceWorker.register('/sw.js')
    .then((registration) => {
      registration.update();

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (hadController) {
          showUpdateModal();
        }
      });
    })
    .catch((err) => {
      console.warn('[SW] Registration failed:', err);
    });
}

function showUpdateModal() {
  const modal = document.getElementById('update-modal');
  const okBtn = document.getElementById('update-modal-ok');
  if (!modal || !okBtn) return;

  modal.classList.remove('hidden');

  okBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    location.reload();
  });
}

initSW();

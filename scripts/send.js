import { DOM } from './dom.js';
import { state } from './state.js';
import { updateRecordStatus } from './db.js';
import { showSendModal, showConfirm } from './ui.js';
import { checkDuplicate } from './duplicate.js';
import { compressAttachments } from './compress.js';
import { validateAll, validateCoordinates } from './validation.js';
import { collectAllData } from './collectors.js';
import { composeEmail } from './email.js';
import { saveState } from './persistence.js';

export async function sendEmail() {
  if (!validateAll()) return false;

  const canProceed = await checkDuplicate();
  if (!canProceed) return false;

  if (state.status === 'changed') {
    const confirmed = await showConfirm(
      'Este registro j\u00e1 foi enviado anteriormente e sofreu altera\u00e7\u00f5es ap\u00f3s o envio. Deseja reenvi\u00e1-lo?'
    );
    if (!confirmed) return false;
  }

  await saveState();

  // Última barreira: revalida as coordenadas imediatamente antes de enviar,
  // para que nenhum evento ou caminho alternativo burle a regra depois do
  // validateAll() (há passos assíncronos entre a validação e o envio).
  if (!validateCoordinates()) return false;

  const btn = DOM.btnEnviar;
  btn.disabled = true;
  btn.textContent = 'Enviando...';

  try {
    const uc = state.iniciais?.uc || '\u2014';
    const os = state.iniciais?.os || '\u2014';
    const tipoLabel = DOM.tipoOrdem?.options[DOM.tipoOrdem.selectedIndex]?.text || '\u2014';
    const subject = `RETORNO DE ORDEM UC ${uc} OS ${os} - ${tipoLabel}`;

    const collectedData = collectAllData();
    const text = composeEmail(collectedData);

    const attachments = await compressAttachments(state.attachments);

    let lastFetchError = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      let res;
      try {
        res = await fetch('/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject, text, attachments }),
        });
      } catch (fetchErr) {
        lastFetchError = fetchErr;
        console.error(`[send] Fetch error (attempt ${attempt}):`, fetchErr.message);
        if (!navigator.onLine) {
          showSendModal('Sem internet \u2014 dados salvos. Conecte-se e clique Enviar novamente.');
          return false;
        }
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        break;
      }

      const ct = res.headers?.get?.('content-type') || '';
      if (!ct.includes('application/json')) {
        const snippet = (await res.text().catch(() => '')).slice(0, 200);
        console.error(`[send] Non-JSON response (attempt ${attempt}):`, snippet);
        if (attempt < 2 && navigator.onLine) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        showSendModal(
          'Erro de conex\u00e3o com o servidor. Verifique sua internet e tente novamente.'
        );
        return false;
      }

      const data = await res.json();

      if (res.ok && data.success) {
        showSendModal('Email enviado com sucesso!');
        if (state.currentUUID) {
          updateRecordStatus(
            state.currentUUID,
            { subject, sentAt: new Date().toISOString() },
            'sent'
          ).catch(err => {
            console.warn('[send] Falha ao persistir status sent:', err);
          });
        }
        return true;
      }

      showSendModal(data.error || 'Erro ao enviar email.');
      return false;
    }

    if (lastFetchError) {
      if (!navigator.onLine) {
        showSendModal('Sem internet \u2014 dados salvos. Conecte-se e clique Enviar novamente.');
      } else {
        showSendModal('Erro de conex\u00e3o com o servidor. Tente novamente.');
      }
      return false;
    }

    showSendModal('Erro ao enviar. Tente novamente.');
    return false;
  } finally {
    btn.disabled = false;
    btn.textContent = '\uD83D\uDCE8 Enviar';
  }
}

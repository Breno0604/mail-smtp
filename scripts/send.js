import { DOM } from './dom.js';
import { state } from './state.js';
import { updateRecordStatus } from './db.js';
import { showSendModal, showConfirm } from './ui.js';
import { checkDuplicate } from './duplicate.js';
import { compressAttachments } from './compress.js';
import { validateAll } from './validation.js';
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
          showSendModal(
            'Sem internet \u2014 dados salvos. Conecte-se e clique Enviar novamente.',
            false
          );
          return false;
        }
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        break;
      }

      const ct = res.headers?.get?.('content-type') || '';
      console.log(`[send] attempt ${attempt}: status=${res.status} ct=${ct}`);

      if (!ct.includes('application/json')) {
        const snippet = (await res.text().catch(() => '')).slice(0, 200);
        console.error(`[send] Non-JSON response (attempt ${attempt}):`, snippet);
        if (attempt < 2 && navigator.onLine) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        showSendModal(
          'Erro de conex\u00e3o com o servidor. Verifique sua internet e tente novamente.',
          false
        );
        return false;
      }

      const data = await res.json();
      console.log(`[send] response:`, { ok: res.ok, success: data.success, error: data.error });

      if (res.ok && data.success) {
        showSendModal('Email enviado com sucesso!', true);
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

      showSendModal(data.error || 'Erro ao enviar email.', false);
      return false;
    }

    if (lastFetchError) {
      if (!navigator.onLine) {
        showSendModal(
          'Sem internet \u2014 dados salvos. Conecte-se e clique Enviar novamente.',
          false
        );
      } else {
        showSendModal('Erro de conex\u00e3o com o servidor. Tente novamente.', false);
      }
      return false;
    }

    showSendModal('Erro ao enviar. Tente novamente.', false);
    return false;
  } finally {
    btn.disabled = false;
    btn.textContent = '\uD83D\uDCE8 Enviar';
  }
}

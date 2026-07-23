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

  // Garantir que o registro est\u00e1 salvo no IndexedDB antes de enviar
  await saveState();

  const btn = DOM.btnEnviar;
  btn.disabled = true;
  btn.textContent = 'Enviando...';

  try {
    const uc = state.iniciais?.uc || '—';
    const os = state.iniciais?.os || '—';
    const tipoLabel = DOM.tipoOrdem?.options[DOM.tipoOrdem.selectedIndex]?.text || '\u2014';
    const subject = `RETORNO DE ORDEM UC ${uc} OS ${os} - ${tipoLabel}`;

    const collectedData = collectAllData();
    const text = composeEmail(collectedData);

    const attachments = await compressAttachments(state.attachments);

    // Retry loop: max 2 attempts for cold-start resilience
    let sendOk = false;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch('/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject, text, attachments }),
        });

        // Handle non-JSON responses (Netlify cold-start HTML error pages)
        const contentType = res.headers?.get?.('content-type') || '';
        if (contentType && !contentType.includes('application/json')) {
          if (attempt < 2 && navigator.onLine) {
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }
          showSendModal('Erro no servidor. Tente novamente.', false);
          return false;
        }

        const responseData = await res.json();

        if (res.ok && responseData.success) {
          sendOk = true;
          break;
        } else {
          // Server returned an error — don't retry (it's a logic error, not transient)
          showSendModal(responseData.error || 'Erro ao enviar email.', false);
          return false;
        }
      } catch (_fetchErr) {
        // If offline, don't retry
        if (!navigator.onLine) {
          showSendModal(
            'Sem internet — dados salvos. Conecte-se e clique Enviar novamente.',
            false
          );
          return false;
        }
        // Retry on transient errors
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
      }
    }

    if (!sendOk) {
      showSendModal('Erro no servidor. Tente novamente.', false);
      return false;
    }

    // Email sent — update local record status (fire-and-forget, never blocks UI)
    showSendModal('Email enviado com sucesso!', true);
    if (state.currentUUID) {
      updateRecordStatus(
        state.currentUUID,
        { subject, sentAt: new Date().toISOString() },
        'sent'
      ).catch(() => {});
    }
    return true;
  } finally {
    btn.disabled = false;
    btn.textContent = '\uD83D\uDCE8 Enviar';
  }
}

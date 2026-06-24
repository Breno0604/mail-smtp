import { DOM } from './dom.js';
import { state } from './state.js';
import { getRecord } from './db.js';
import { formatDate } from './utils.js';
import { showModalElements } from './ui.js';

export async function checkDuplicate() {
  const uuid = state.currentUUID;
  if (!uuid) return true;

  try {
    const record = await getRecord(uuid);
    if (!record || record.status !== 'sent') return true;

    const os = record.iniciais?.os || '\u2014';
    const sentAt = record.sentData?.sentAt
      ? formatDate(record.sentData.sentAt)
      : 'data desconhecida';

    DOM.dupModalTitle.textContent = 'Registro j\u00E1 enviado';

    const bodyContent =
      `Este registro (OS #${os}) j\u00E1 foi enviado com sucesso em ${sentAt}. ` +
      'Deseja realizar um novo envio mesmo assim?';

    return showModalElements(
      DOM.dupModal,
      DOM.dupModalBody,
      DOM.dupModalConfirm,
      DOM.dupModalCancel,
      bodyContent,
      { useHtml: true }
    );
  } catch {
    return true;
  }
}

import { DOM } from "./dom.js";
import { state } from "./state.js";
import { updateRecordStatus } from "./db.js";
import { showToast } from "./ui.js";
import { checkDuplicate } from "./duplicate.js";
import { compressAttachments } from "./compress.js";
import { validateAll } from "./validation.js";
import { collectAllData } from "./collectors.js";
import { composeEmail } from "./email.js";

export async function sendEmail() {
  if (!validateAll()) return false;

  const canProceed = await checkDuplicate();
  if (!canProceed) return false;

  const btn = DOM.btnEnviar;
  btn.disabled = true;
  btn.textContent = "Enviando...";

  try {
    const uc = state.iniciais?.uc || "—";
    const os = state.iniciais?.os || "—";
    const tipoLabel = DOM.tipoOrdem?.options[DOM.tipoOrdem.selectedIndex]?.text || "\u2014";
    const subject = `OS #${os} - UC ${uc} - ${tipoLabel}`;
    
    const collectedData = collectAllData();
    const text = composeEmail(collectedData);

    const attachments = await compressAttachments(state.attachments);

    const res = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, text, attachments }),
    });

    const responseData = await res.json();

    if (res.ok && responseData.success) {
      showToast("Email enviado com sucesso!", true);
      if (state.currentUUID) {
        await updateRecordStatus(state.currentUUID, { to: responseData.to, subject, sentAt: new Date().toISOString() });
      }
      return true;
    } else {
      showToast(responseData.error || "Erro ao enviar email.", false);
      return false;
    }
  } catch (err) {
    showToast("Erro de conex\u00E3o. Tente novamente.", false);
    return false;
  } finally {
    btn.disabled = false;
    btn.textContent = "\uD83D\uDCE8 Enviar";
  }
}

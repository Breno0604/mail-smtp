import { DOM } from "./dom.js";
import { state } from "./state.js";
import { updateRecordStatus } from "./db.js";
import { showToast } from "./ui.js";
import { checkDuplicate } from "./duplicate.js";
import { compressAttachments } from "./compress.js";

export async function sendEmail() {
  const canProceed = await checkDuplicate();
  if (!canProceed) return;

  const btn = DOM.btnProximo;
  btn.disabled = true;
  btn.textContent = "Enviando...";

  try {
    const uc = document.getElementById("uc")?.value || "\u2014";
    const os = document.getElementById("os")?.value || "\u2014";
    const tipoLabel = DOM.tipoOrdem.options[DOM.tipoOrdem.selectedIndex]?.text || "\u2014";
    const subject = `OS #${os} - UC ${uc} - ${tipoLabel}`;
    const baseBody = DOM.previewCorpo.textContent;
    const compCorpo = DOM.complementoCorpo.value.trim();

    const text = compCorpo ? `${baseBody}\n\n${compCorpo}` : baseBody;

    const attachments = await compressAttachments(state.attachments);

    const res = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, text, attachments }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      showToast("Email enviado com sucesso!", true);
      if (state.currentUUID) {
        await updateRecordStatus(state.currentUUID, { to: data.to, subject, sentAt: new Date().toISOString() });
      }
      return true;
    } else {
      showToast(data.error || "Erro ao enviar email.", false);
      return false;
    }
  } catch (err) {
    showToast("Erro de conex\u00E3o. Tente novamente.", false);
    return false;
  } finally {
    btn.disabled = false;
    btn.textContent = "Enviar";
  }
}

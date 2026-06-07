import { DOM } from "./dom.js";
import { state } from "./state.js";
import { updateRecordStatus } from "./db.js";
import { MAX_SIZE, SKIP_SIZE, toBase64, blobToBase64, loadImage } from "./utils.js";
import { showToast } from "./ui.js";

export async function sendEmail() {
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

    const attachments = [];
    for (const file of state.attachments) {
      if (file.size <= SKIP_SIZE) {
        attachments.push({
          filename: file.name,
          content: await toBase64(file),
          encoding: "base64",
        });
        continue;
      }

      const img = await loadImage(file);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      let width = img.naturalWidth;
      let quality = 0.9;
      let blob;

      for (let attempt = 0; attempt < 10; attempt++) {
        const ratio = width / img.naturalWidth;
        canvas.width = width;
        canvas.height = Math.round(img.naturalHeight * ratio);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
        if (blob.size <= MAX_SIZE) break;
        width = Math.round(width * 0.8);
      }

      if (blob.size > MAX_SIZE) {
        quality = 0.7;
        const ratio = width / img.naturalWidth;
        canvas.width = width;
        canvas.height = Math.round(img.naturalHeight * ratio);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      }

      const dot = file.name.lastIndexOf(".");
      const basename = dot > -1 ? file.name.slice(0, dot) : file.name;
      attachments.push({
        filename: basename + "_red.jpg",
        content: await blobToBase64(blob),
        encoding: "base64",
      });
    }

    const res = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, text, attachments }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      showToast("Email enviado com sucesso!", true);
      if (state.currentUUID) {
        updateRecordStatus(state.currentUUID, { to: data.to, subject, sentAt: new Date().toISOString() }).catch(() => {});
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

import { DOM } from "./dom.js";
import { state } from "./state.js";
import { getRecord } from "./db.js";
import { formatDate } from "./utils.js";

export function checkDuplicate() {
  return new Promise((resolve) => {
    const uuid = state.currentUUID;
    if (!uuid) {
      resolve(true);
      return;
    }

    getRecord(uuid).then((record) => {
      if (!record || record.status !== "sent") {
        resolve(true);
        return;
      }

      const os = record.iniciais?.os || "\u2014";
      const sentAt = record.sentData?.sentAt ? formatDate(record.sentData.sentAt) : "data desconhecida";

      DOM.dupModalTitle.textContent = "Registro j\u00E1 enviado";
      DOM.dupModalBody.innerHTML = `Este registro (OS #${os}) j\u00E1 foi enviado com sucesso em ${sentAt}. Deseja realizar um novo envio mesmo assim?`;
      DOM.dupModal.classList.remove("hidden");

      DOM.dupModalCancel.onclick = () => {
        DOM.dupModal.classList.add("hidden");
        resolve(false);
      };

      DOM.dupModalConfirm.onclick = () => {
        DOM.dupModal.classList.add("hidden");
        resolve(true);
      };
    }).catch(() => {
      resolve(true);
    });
  });
}

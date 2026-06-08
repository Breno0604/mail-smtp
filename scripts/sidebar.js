import { DOM } from "./dom.js";
import { state, clearCurrentUUID } from "./state.js";
import { getAllRecords, deleteRecord, getRecord } from "./db.js";
import { formatDate } from "./utils.js";
import { applyRecord } from "./restore.js";
import { showConfirm } from "./ui.js";

export function closeSidebar() {
  document.body.classList.remove("sidebar-open");
}

function getRecordSummary(record) {
  const uc = record.iniciais?.uc || "";
  const os = record.iniciais?.os || "";
  if (uc && os) return `OS #${os} — UC ${uc}`;
  if (os) return `OS #${os}`;
  if (uc) return `UC ${uc}`;
  return "(rascunho vazio)";
}

export async function renderSidebar(filterTerm = "") {
  const list = DOM.sidebarList;
  list.innerHTML = "";

  let records;
  try {
    records = await getAllRecords();
  } catch (e) {
    list.innerHTML = '<div class="sidebar-empty">Erro ao carregar registros.</div>';
    return;
  }

  if (!records || records.length === 0) {
    list.innerHTML = '<div class="sidebar-empty">Nenhum registro encontrado.</div>';
    return;
  }

  records.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  if (filterTerm) {
    const term = filterTerm.toString().toLowerCase();
    records = records.filter((r) => {
      const uc = (r.iniciais?.uc ?? "").toString().toLowerCase();
      const os = (r.iniciais?.os ?? "").toLowerCase();
      return uc.includes(term) || os.includes(term);
    });
    if (records.length === 0) {
      list.innerHTML = `<div class="sidebar-empty">Nenhum registro encontrado para "${filterTerm}".</div>`;
      return;
    }
  }

  records.forEach((record) => {
    const item = document.createElement("div");
    item.className = "sidebar-item";

    const header = document.createElement("div");
    header.className = "sidebar-item-header";

    const title = document.createElement("span");
    title.className = "sidebar-item-title";
    title.textContent = getRecordSummary(record);

    const status = document.createElement("span");
    status.className = `sidebar-status ${record.status === "sent" ? "status-sent" : "status-draft"}`;
    status.textContent = record.status === "sent" ? "Enviado" : "Rascunho";

    header.appendChild(title);
    header.appendChild(status);

    const meta = document.createElement("div");
    meta.className = "sidebar-item-meta";
    meta.textContent = formatDate(record.updatedAt);

    const actions = document.createElement("div");
    actions.className = "sidebar-item-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "sidebar-btn sidebar-btn-edit";
    editBtn.textContent = "\u270F\uFE0F Editar";
    editBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      try {
        const full = await getRecord(record.uuid);
        if (!full) return;
        loadRecord(full);
      } catch (err) { /* ignore */ }
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "sidebar-btn sidebar-btn-delete";
    deleteBtn.textContent = "\uD83D\uDDD1\uFE0F Excluir";
    deleteBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const ok = await showConfirm("Excluir este registro? Esta ação não pode ser desfeita.");
      if (!ok) return;
      try {
        await deleteRecord(record.uuid);
        if (state.currentUUID === record.uuid) {
          clearCurrentUUID();
        }
        renderSidebar(DOM.sidebarFilter.value);
      } catch (err) { /* ignore */ }
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(header);
    item.appendChild(meta);
    item.appendChild(actions);
    list.appendChild(item);
  });
}

function loadRecord(record) {
  applyRecord(record);
  closeSidebar();
}

export function initSidebarFilter() {
  DOM.sidebarFilter.addEventListener("input", () => {
    renderSidebar(DOM.sidebarFilter.value);
  });
}

const DB_NAME = "mail-mvp";
const DB_VERSION = 1;
const STORE_NAME = "sent_emails";
const STORAGE_KEY = "mail_form_estado";
const MAX_SIZE = 650 * 1024;
const SKIP_SIZE = 670 * 1024;

const state = {
  currentSection: 1,
  totalSections: 5,
  equipamentos: [],
  attachments: [],
  lastTipoOrdem: "",
  visitedRetorno: false,
  animating: false,
};

const DOM = {};

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function saveRecord(record) {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.add(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.readAsDataURL(blob);
  });
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}

function cacheDOM() {
  DOM.sections = document.querySelectorAll(".section");
  DOM.wrapper = document.getElementById("section-wrapper");
  DOM.steps = document.querySelectorAll(".step");
  DOM.lines = document.querySelectorAll(".step-line");
  DOM.btnAnterior = document.getElementById("btn-anterior");
  DOM.btnProximo = document.getElementById("btn-proximo");
  DOM.errorMsg = document.getElementById("error-msg");
  DOM.uc = document.getElementById("uc");
  DOM.os = document.getElementById("os");
  DOM.cliente = document.getElementById("cliente");
  DOM.tipoOrdem = document.getElementById("tipo-ordem");
  DOM.equipList = document.getElementById("equipamentos-list");
  DOM.btnAddEquip = document.getElementById("btn-add-equip");
  DOM.btnSkipEquip = document.getElementById("btn-skip-equip");
  DOM.retornoDesc = document.getElementById("retorno-desc");
  DOM.retornoCampos = document.getElementById("retorno-campos");
  DOM.fileInput = document.getElementById("file-input");
  DOM.fileCount = document.getElementById("file-count");
  DOM.previewGrid = document.getElementById("preview-grid");
  DOM.fileUploadArea = document.getElementById("file-upload-area");
  DOM.previewAssunto = document.getElementById("preview-assunto");
  DOM.previewCorpo = document.getElementById("preview-corpo");
  DOM.previewAnexos = document.getElementById("preview-anexos");
  DOM.complementoAssunto = document.getElementById("complemento-assunto");
  DOM.complementoCorpo = document.getElementById("complemento-corpo");
  DOM.toast = document.getElementById("toast");
  DOM.sectionCounter = document.getElementById("section-counter");
  DOM.btnLimpar = document.getElementById("btn-limpar");
  DOM.modalTipo = document.getElementById("modal-tipo");
  DOM.modalCancel = document.getElementById("modal-cancel");
  DOM.modalConfirm = document.getElementById("modal-confirm");
  DOM.lightbox = document.getElementById("lightbox");
  DOM.lightboxImg = document.getElementById("lightbox-img");
  DOM.lightboxClose = document.getElementById("lightbox-close");
}

function showSection(n, direction, noAnimation) {
  if (!noAnimation && state.animating) return;
  if (!noAnimation) state.animating = true;

  const current = state.currentSection;
  const goingForward = direction !== "prev";
  const currentEl = document.getElementById(`section-${current}`);
  const nextEl = document.getElementById(`section-${n}`);

  if (!noAnimation && current !== n) {
    currentEl.classList.remove("active");
    currentEl.classList.add(goingForward ? "slide-out-left" : "slide-out-right");

    setTimeout(() => {
      currentEl.classList.remove("slide-out-left", "slide-out-right");
      currentEl.style.display = "none";

      nextEl.style.display = "block";
      nextEl.classList.add(goingForward ? "section-enter-next" : "section-enter-prev");

      setTimeout(() => {
        nextEl.classList.remove("section-enter-next", "section-enter-prev");
        nextEl.classList.add("active");
        state.animating = false;
      }, 220);
    }, 220);
  } else {
    currentEl.classList.remove("active");
    currentEl.style.display = "none";
    nextEl.style.display = "block";
    nextEl.classList.add("active");
    state.animating = false;
  }

  DOM.steps.forEach((el, i) => {
    const num = i + 1;
    el.classList.toggle("active", num === n);
    el.classList.toggle("completed", num < n);
    el.classList.toggle("done", num < n);
  });

  DOM.lines.forEach((el, i) => {
    el.classList.toggle("completed", i + 1 < n);
  });

  DOM.btnAnterior.disabled = n === 1;

  if (n === state.totalSections) {
    DOM.btnProximo.textContent = "Enviar";
    DOM.btnProximo.className = "btn btn-success";
    composeEmail();
  } else if (n === state.totalSections - 1) {
    DOM.btnProximo.textContent = "Revisar \u2192";
    DOM.btnProximo.className = "btn btn-primary";
  } else {
    DOM.btnProximo.textContent = "Avan\u00E7ar \u2192";
    DOM.btnProximo.className = "btn btn-primary";
  }

  DOM.sectionCounter.textContent = `Se\u00E7\u00E3o ${n} de ${state.totalSections} \u2014 ${getSectionName(n)}`;

  if (n === 2) renderEquipamentos();
  if (n === 3) { renderRetorno(); state.visitedRetorno = true; }
  if (n === 4) renderPreviews();

  hideError();
  state.currentSection = n;
  saveState();
}

function getSectionName(n) {
  const nomes = ["", "Iniciais", "Equipamentos", "Retorno", "Anexos", "Revis\u00E3o"];
  return nomes[n] || "";
}

function nextSection() {
  if (!validateSection(state.currentSection)) return;
  collectSectionData(state.currentSection);

  if (state.currentSection === state.totalSections) {
    sendEmail();
    return;
  }

  showSection(state.currentSection + 1, "next");
}

function prevSection() {
  if (state.currentSection <= 1) return;
  showSection(state.currentSection - 1, "prev");
}

function validateSection(n) {
  hideError();
  let valid = true;

  if (n === 1) {
    const fields = [
      { el: DOM.uc, name: "UC" },
      { el: DOM.os, name: "OS" },
      { el: DOM.cliente, name: "Cliente" },
      { el: DOM.tipoOrdem, name: "Tipo de ordem" },
    ];
    fields.forEach(({ el }) => {
      if (!el.value || el.value.trim() === "") {
        el.classList.add("error");
        valid = false;
      } else {
        el.classList.remove("error");
      }
    });
    if (!valid) showError("Preencha todos os campos obrigat\u00F3rios.");
  }

  if (n === 2) {
    const rows = DOM.equipList.querySelectorAll(".equip-row");
    if (rows.length > 0) {
      let hasError = false;
      const nums = [];
      rows.forEach((row) => {
        const tipo = row.querySelector(".equip-tipo");
        const categoria = row.querySelector(".equip-categoria");
        const inp = row.querySelector(".equip-numero");
        [tipo, categoria, inp].forEach((el) => el.classList.remove("error"));
        if (tipo.value === "") { tipo.classList.add("error"); hasError = true; }
        if (categoria.value === "") { categoria.classList.add("error"); hasError = true; }
        if (inp.value === "") { inp.classList.add("error"); hasError = true; }
        else if (nums.includes(inp.value)) { inp.classList.add("error"); hasError = true; }
        else { nums.push(inp.value); }
      });
      if (hasError) {
        const dup = nums.length !== new Set(nums).size;
        showError(dup
          ? "N\u00BA de equipamento duplicado."
          : "Preencha todos os campos de cada equipamento.");
        valid = false;
      }
    }
  }

  if (n === 3) {
    const campos = DOM.retornoCampos.querySelectorAll("textarea, input");
    campos.forEach((el) => {
      if (el.hasAttribute("data-required") && el.value.trim() === "") {
        el.classList.add("error");
        valid = false;
      } else {
        el.classList.remove("error");
      }
    });
    if (!valid) showError("Preencha todos os campos obrigat\u00F3rios.");
  }

  return valid;
}

function showError(msg) {
  DOM.errorMsg.textContent = msg;
  DOM.errorMsg.style.display = "block";
}

function hideError() {
  DOM.errorMsg.style.display = "none";
  DOM.errorMsg.textContent = "";
}

function addBlurValidation(el) {
  el.addEventListener("blur", () => {
    if (el.hasAttribute("required") || el.hasAttribute("data-required")) {
      el.classList.toggle("error", !el.value || el.value.trim() === "");
    }
  });
  el.addEventListener("input", () => el.classList.remove("error"));
  el.addEventListener("change", () => {
    if (el.value && el.value.trim() !== "") el.classList.remove("error");
  });
}

function collectSectionData(n) {
  if (n === 2) {
    const rows = DOM.equipList.querySelectorAll(".equip-row");
    state.equipamentos = [];
    rows.forEach((row) => {
      state.equipamentos.push({
        status: row.querySelector(".equip-tipo").value,
        categoria: row.querySelector(".equip-categoria").value,
        numero: row.querySelector(".equip-numero").value,
      });
    });
  }
}

function addEquip(data) {
  const div = document.createElement("div");
  div.className = "equip-row flex gap-2 items-center mb-2 p-2 bg-gray-50 rounded-lg";
  div.innerHTML = `
    <select class="equip-tipo w-[100px] flex-shrink-0 px-2.5 py-2 border border-gray-300 rounded-lg text-[15px] outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-600/15">
      <option value="">Selecione...</option>
      <option value="Instalado" ${data?.status === "Instalado" ? "selected" : ""}>Instalado</option>
      <option value="Retirado" ${data?.status === "Retirado" ? "selected" : ""}>Retirado</option>
    </select>
    <select class="equip-categoria w-[150px] flex-shrink-0 px-2.5 py-2 border border-gray-300 rounded-lg text-[15px] outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-600/15">
      <option value="">Selecione...</option>
      <option value="Medidor" ${data?.categoria === "Medidor" ? "selected" : ""}>Medidor</option>
      <option value="Display" ${data?.categoria === "Display" ? "selected" : ""}>Display</option>
      <option value="Conjunto" ${data?.categoria === "Conjunto" ? "selected" : ""}>Conjunto</option>
      <option value="TC" ${data?.categoria === "TC" ? "selected" : ""}>TC</option>
      <option value="TP" ${data?.categoria === "TP" ? "selected" : ""}>TP</option>
    </select>
    <input type="number" class="equip-numero flex-1 min-w-[80px] px-2.5 py-2 border border-gray-300 rounded-lg text-[15px] outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-600/15" placeholder="N\u00B0 Equip." value="${data?.numero || ""}">
    <button class="btn-remove w-9 h-9 border-none rounded-lg bg-red-50 text-red-600 text-base cursor-pointer flex-shrink-0 transition-colors duration-200 flex items-center justify-center hover:bg-red-200" type="button">\u2715</button>
  `;

  addBlurValidation(div.querySelector(".equip-numero"));

  div.querySelector(".btn-remove").addEventListener("click", () => {
    div.remove();
    if (DOM.equipList.querySelectorAll(".equip-row").length === 0) showEmptyEquip();
    updateSkipBtn();
    saveState();
  });

  DOM.equipList.appendChild(div);
  hideEmptyEquip();
  updateSkipBtn();
  saveState();
}

function showEmptyEquip() {
  if (!DOM.equipList.querySelector(".empty-msg")) {
    const msg = document.createElement("div");
    msg.className = "empty-msg text-center text-gray-400 text-sm py-5";
    msg.textContent = "Nenhum equipamento adicionado.";
    DOM.equipList.appendChild(msg);
  }
}

function hideEmptyEquip() {
  const msg = DOM.equipList.querySelector(".empty-msg");
  if (msg) msg.remove();
}

function updateSkipBtn() {
  const rows = DOM.equipList.querySelectorAll(".equip-row");
  DOM.btnSkipEquip.style.display = rows.length === 0 ? "inline" : "none";
}

function renderEquipamentos() {
  DOM.equipList.innerHTML = "";
  if (state.equipamentos.length === 0) {
    showEmptyEquip();
  } else {
    state.equipamentos.forEach((eq) => addEquip(eq));
  }
  updateSkipBtn();
}

const retornoFields = {
  "ordem-servico": [
    { label: "Servi\u00E7o realizado", id: "servico-realizado", type: "textarea", required: true },
    { label: "Observa\u00E7\u00F5es", id: "observacoes", type: "textarea", required: false },
  ],
  "garantia": [
    { label: "Defeito relatado", id: "defeito-relatado", type: "textarea", required: true },
    { label: "A\u00E7\u00E3o tomada", id: "acao-tomada", type: "textarea", required: true },
  ],
  "orcamento": [
    { label: "Descri\u00E7\u00E3o", id: "descricao", type: "textarea", required: true },
    { label: "Valor estimado", id: "valor-estimado", type: "number", required: true },
  ],
};

function renderRetorno() {
  const tipo = DOM.tipoOrdem.value;
  const tipoLabel = DOM.tipoOrdem.options[DOM.tipoOrdem.selectedIndex]?.text || "\u2014";
  DOM.retornoDesc.innerHTML = `Preencha as informa\u00E7\u00F5es para <strong>${tipoLabel}</strong>.`;
  DOM.retornoCampos.innerHTML = "";

  if (!tipo || !retornoFields[tipo]) {
    DOM.retornoCampos.innerHTML = '<p class="text-gray-400 text-sm">Selecione um Tipo de ordem na se\u00E7\u00E3o anterior.</p>';
    return;
  }

  retornoFields[tipo].forEach((field) => {
    const group = document.createElement("div");
    group.className = "mb-4";

    const label = document.createElement("label");
    label.setAttribute("for", field.id);
    label.className = "block font-semibold text-sm text-gray-700 mb-1";
    label.innerHTML = field.label + (field.required ? ' <span class="text-red-600">*</span>' : "");

    let input;
    if (field.type === "textarea") {
      input = document.createElement("textarea");
      input.setAttribute("rows", "4");
      input.className = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[15px] font-sans text-gray-900 bg-white outline-none transition-all resize-y min-h-[80px] focus:border-blue-600 focus:ring-3 focus:ring-blue-600/15";
    } else {
      input = document.createElement("input");
      input.type = field.type;
      input.className = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[15px] font-sans text-gray-900 bg-white outline-none transition-all focus:border-blue-600 focus:ring-3 focus:ring-blue-600/15";
    }

    input.id = field.id;
    if (field.required) input.setAttribute("data-required", "");
    input.placeholder = field.label;

    addBlurValidation(input);
    group.appendChild(label);
    group.appendChild(input);
    DOM.retornoCampos.appendChild(group);
  });
}

let pendingTipoValue = null;

function handleTipoChange() {
  const sel = DOM.tipoOrdem;
  if (sel.value === state.lastTipoOrdem) return;
  if (state.lastTipoOrdem && state.visitedRetorno) {
    pendingTipoValue = sel.value;
    DOM.modalTipo.classList.remove("hidden");
    sel.value = state.lastTipoOrdem;
  } else {
    state.lastTipoOrdem = sel.value;
    saveState();
  }
}

function cancelTipoChange() {
  DOM.modalTipo.classList.add("hidden");
  pendingTipoValue = null;
}

function confirmTipoChange() {
  DOM.modalTipo.classList.add("hidden");
  state.lastTipoOrdem = pendingTipoValue;
  DOM.tipoOrdem.value = pendingTipoValue;
  DOM.retornoCampos.innerHTML = "";
  pendingTipoValue = null;
  saveState();
}

function handleUploadClick() {
  DOM.fileInput.click();
}

function handleFileChange(e) {
  const files = Array.from(e.target.files);
  const remaining = 12 - state.attachments.length;
  const toAdd = files.slice(0, remaining);

  toAdd.forEach((file) => state.attachments.push(file));

  if (files.length > remaining) {
    showError(`M\u00E1ximo de 12 anexos. ${files.length - remaining} ignorado(s).`);
  }

  renderPreviews();
  updateFileCount();
  DOM.fileInput.value = "";
  saveState();
}

function removeFile(index) {
  state.attachments.splice(index, 1);
  renderPreviews();
  updateFileCount();
  saveState();
}

function renderPreviews() {
  DOM.previewGrid.innerHTML = "";
  state.attachments.forEach((file, i) => {
    const div = document.createElement("div");
    div.className = "preview-item relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50 cursor-pointer";

    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    img.className = "w-full aspect-square object-cover block";

    const name = document.createElement("div");
    name.className = "preview-name text-[11px] text-gray-500 px-1.5 py-1 truncate";
    name.textContent = file.name;

    const removeBtn = document.createElement("button");
    removeBtn.className = "preview-remove absolute top-0.5 right-0.5 w-[22px] h-[22px] border-none rounded-full bg-black/55 text-white text-xs cursor-pointer flex items-center justify-center leading-none hover:bg-red-600/85";
    removeBtn.textContent = "\u2715";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeFile(i);
    });

    div.addEventListener("click", () => {
      DOM.lightboxImg.src = img.src;
      DOM.lightbox.classList.remove("hidden");
    });

    div.appendChild(img);
    div.appendChild(name);
    div.appendChild(removeBtn);
    DOM.previewGrid.appendChild(div);
  });
}

function updateFileCount() {
  DOM.fileCount.textContent = `${state.attachments.length} / 12`;
}

function closeLightbox() {
  DOM.lightbox.classList.add("hidden");
}

function composeEmail() {
  const uc = DOM.uc.value || "\u2014";
  const os = DOM.os.value || "\u2014";
  const cliente = DOM.cliente.value || "\u2014";
  const tipoLabel = DOM.tipoOrdem.options[DOM.tipoOrdem.selectedIndex]?.text || "\u2014";
  const assunto = `OS #${os} - ${cliente} - ${tipoLabel}`;
  DOM.previewAssunto.textContent = assunto;

  let body = `UC: ${uc}\nOS: ${os}\nCliente: ${cliente}\nTipo de ordem: ${tipoLabel}`;

  const eqs = DOM.equipList.querySelectorAll(".equip-row");
  if (eqs.length > 0) {
    body += "\n\nEquipamentos:";
    eqs.forEach((row) => {
      const status = row.querySelector(".equip-tipo").value;
      const categoria = row.querySelector(".equip-categoria").value;
      const num = row.querySelector(".equip-numero").value || "\u2014";
      body += `\n- ${status} - ${categoria} - N\u00B0 ${num}`;
    });
  }

  const tipoKey = DOM.tipoOrdem.value;
  if (tipoKey && retornoFields[tipoKey]) {
    body += "\n\nRetorno:";
    retornoFields[tipoKey].forEach((field) => {
      const el = document.getElementById(field.id);
      if (el) body += `\n${field.label}: ${el.value || "(n\u00E3o preenchido)"}`;
    });
  }

  DOM.previewCorpo.textContent = body;

  if (state.attachments.length === 0) {
    DOM.previewAnexos.textContent = "Nenhum anexo";
  } else {
    DOM.previewAnexos.textContent = `${state.attachments.length} arquivo(s): ${state.attachments.map((f) => f.name).join(", ")}`;
  }
}

async function sendEmail() {
  const btn = DOM.btnProximo;
  btn.disabled = true;
  btn.textContent = "Enviando...";

  try {
    const baseSubject = DOM.previewAssunto.textContent;
    const baseBody = DOM.previewCorpo.textContent;
    const compAssunto = DOM.complementoAssunto.value.trim();
    const compCorpo = DOM.complementoCorpo.value.trim();

    const subject = compAssunto ? `${baseSubject} - ${compAssunto}` : baseSubject;
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
      saveRecord({ to: data.to, subject, sentAt: new Date().toISOString(), status: "sucesso" });
      resetForm();
    } else {
      showToast(data.error || "Erro ao enviar email.", false);
    }
  } catch (err) {
    showToast("Erro de conex\u00E3o. Tente novamente.", false);
  } finally {
    btn.disabled = false;
    btn.textContent = "Enviar";
  }
}

function resetForm() {
  DOM.uc.value = "";
  DOM.os.value = "";
  DOM.cliente.value = "";
  DOM.tipoOrdem.value = "";
  DOM.retornoCampos.innerHTML = "";
  DOM.equipList.innerHTML = "";
  DOM.complementoAssunto.value = "";
  DOM.complementoCorpo.value = "";
  state.equipamentos = [];
  state.attachments = [];
  state.lastTipoOrdem = "";
  state.visitedRetorno = false;
  DOM.previewGrid.innerHTML = "";
  showEmptyEquip();
  updateFileCount();
  updateSkipBtn();
  hideError();
  localStorage.removeItem(STORAGE_KEY);
  if (state.currentSection !== 1) {
    showSection(1, "prev");
  } else {
    state.currentSection = 1;
  }
}

let toastTimer = null;

function showToast(msg, success) {
  DOM.toast.textContent = msg;
  DOM.toast.classList.remove("success");
  if (success) DOM.toast.classList.add("success");
  DOM.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => DOM.toast.classList.remove("show"), 3500);
}

function saveState() {
  if (!DOM.uc.value && !DOM.os.value && !DOM.cliente.value && state.equipamentos.length === 0 && state.attachments.length === 0) return;

  const data = {
    uc: DOM.uc.value,
    os: DOM.os.value,
    cliente: DOM.cliente.value,
    tipoOrdem: DOM.tipoOrdem.value,
    equipamentos: state.equipamentos,
    lastTipoOrdem: state.lastTipoOrdem,
    visitedRetorno: state.visitedRetorno,
    currentSection: state.currentSection,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) { /* quota exceeded */ }
}

function restoreState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const data = JSON.parse(saved);
    const section = data.currentSection || 1;
    const ok = confirm(`H\u00E1 um formul\u00E1rio salvo (Se\u00E7\u00E3o ${section} de 5). Deseja continuar de onde parou?`);
    if (!ok) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    DOM.uc.value = data.uc || "";
    DOM.os.value = data.os || "";
    DOM.cliente.value = data.cliente || "";
    DOM.tipoOrdem.value = data.tipoOrdem || "";
    state.equipamentos = data.equipamentos || [];
    state.lastTipoOrdem = data.lastTipoOrdem || "";
    state.visitedRetorno = data.visitedRetorno || false;
    showSection(section, "next", true);
  } catch (e) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function initEvents() {
  DOM.btnAnterior.addEventListener("click", prevSection);
  DOM.btnProximo.addEventListener("click", nextSection);
  DOM.btnAddEquip.addEventListener("click", () => addEquip());
  DOM.btnSkipEquip.addEventListener("click", () => showSection(3, "next"));
  DOM.tipoOrdem.addEventListener("change", handleTipoChange);
  DOM.modalCancel.addEventListener("click", cancelTipoChange);
  DOM.modalConfirm.addEventListener("click", confirmTipoChange);
  DOM.fileUploadArea.addEventListener("click", handleUploadClick);
  DOM.fileInput.addEventListener("change", handleFileChange);
  DOM.lightboxClose.addEventListener("click", closeLightbox);
  DOM.lightbox.addEventListener("click", (e) => {
    if (e.target === DOM.lightbox) closeLightbox();
  });
  DOM.btnLimpar.addEventListener("click", () => {
    if (!confirm("Tem certeza? Todos os dados ser\u00E3o perdidos.")) return;
    resetForm();
  });

  [DOM.uc, DOM.os, DOM.cliente, DOM.tipoOrdem].forEach((el) => {
    if (el) addBlurValidation(el);
  });

  document.querySelectorAll("input, select, textarea").forEach((el) => {
    el.addEventListener("change", saveState);
    el.addEventListener("input", saveState);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  cacheDOM();
  initEvents();
  updateFileCount();
  restoreState();
  if (state.currentSection === 1 && !document.getElementById("section-1").classList.contains("active")) {
    showSection(1, "next", true);
  }
});

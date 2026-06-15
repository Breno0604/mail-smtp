import { DOM } from "./dom.js";
import { state } from "./state.js";
import { saveState, markAttachmentsDirty } from "./persistence.js";
import { showError } from "./ui.js";

// Array para rastrear Object URLs criadas para previews
let previewObjectUrls = [];

// Função para revogar todas as URLs de preview
function revokePreviewUrls() {
  previewObjectUrls.forEach(url => URL.revokeObjectURL(url));
  previewObjectUrls = [];
}

export function handleUploadClick() {
  DOM.fileInput.click();
}

export function handleFileChange(e) {
  const files = Array.from(e.target.files);
  const remaining = 12 - state.attachments.length;
  const toAdd = files.slice(0, remaining);

  toAdd.forEach((file) => state.attachments.push(file));

  if (files.length > remaining) {
    showError(`M\u00E1ximo de 12 anexos. ${files.length - remaining} ignorado(s).`);
  }

  markAttachmentsDirty();
  renderPreviews();
  updateFileCount();
  DOM.fileInput.value = "";
  saveState();
}

export function removeFile(index) {
  state.attachments.splice(index, 1);
  markAttachmentsDirty();
  renderPreviews();
  updateFileCount();
  saveState();
}

export function renderPreviews() {
  // Revogar URLs antigas para evitar memory leak
  revokePreviewUrls();
  
  DOM.previewGrid.innerHTML = "";
  state.attachments.forEach((file, i) => {
    const div = document.createElement("div");
    div.className = "preview-item relative border border-slate-200 rounded-[10px] overflow-hidden bg-slate-50 cursor-pointer transition-all duration-200 hover:border-blue-300";

    const img = document.createElement("img");
    const objectUrl = URL.createObjectURL(file);
    previewObjectUrls.push(objectUrl); // Rastrear URL para revogação futura
    img.src = objectUrl;
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

export function updateFileCount() {
  DOM.fileCount.textContent = `${state.attachments.length} / 12`;
}

export function closeLightbox() {
  DOM.lightbox.classList.add("hidden");
}

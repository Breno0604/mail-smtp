# Ferramentas, Design

> Gerado pelo Redator em 2026-06-15

---

## app.js — Orquestração

### Fluxo de Inicialização

```
DOMContentLoaded
  │
  ├─ cacheDOM()
  ├─ initSidebarFilter()
  ├─ renderIniciais()
  ├─ initEvents()
  │   ├─ btnEnviar → sendEmail
  │   ├─ btnNovoForm → saveState + resetForm + captureCoordinates + updateFilledClasses
  │   ├─ btnAddEquip → addEquip
  │   ├─ tipoOrdem change → handleTipoChange
  │   ├─ fileUploadArea click → handleUploadClick
  │   ├─ fileInput change → handleFileChange
  │   ├─ lightboxClose click → closeLightbox
  │   ├─ lightbox click (fora) → closeLightbox
  │   ├─ hamburger click → renderSidebar + sidebar-open
  │   ├─ sidebarOverlay click → closeSidebar
  │   ├─ sidebarClose click → closeSidebar
  │   └─ document input/change → updateFilledClass + debouncedSave + updateLivePreview + checkInitialPersistence
  │     └─ document pointerdown → blur activeElement (fora de input/select/textarea/button)
  │
  ├─ updateFileCount()
  ├─ renderPreviews()
  ├─ await captureCoordinates()
  ├─ updateLivePreview()
  ├─ updateAllFilledClasses()
  └─ clearCurrentUUID()
```

### Filled Class

```
updateFilledClass(el)
  ├─ if el.value.trim() !== "" → el.classList.add("is-filled")
  └─ else → el.classList.remove("is-filled")
```

Usado para estilizar campos preenchidos (borda verde, label flutuante).

### Initial Persistence Gate

```
checkInitialPersistence()
  ├─ getIniciaisData()
  ├─ if uc && os preenchidos && !state.iniciaisValido
  │   ├─ state.iniciaisValido = true
  │   └─ saveState()  ← salva imediatamente, não debounced
```

---

## ui.js — Componentes de UI

### Toast

```
showToast(msg, success)
  ├─ DOM.toast.textContent = msg
  ├─ toggle classe .success
  ├─ DOM.toast.classList.add("show")
  └─ setTimeout 3500ms → .remove("show")
```

### Error Global

```
showError(msg) → DOM.errorMsg display:block + textContent
hideError()    → DOM.errorMsg display:none + textContent = ""
```

### Field Error

```
setFieldError(el, msg)
  ├─ el.nextElementSibling (span.field-error)
  └─ if exists → textContent = msg + .add("show")

clearFieldError(el)
  ├─ el.nextElementSibling (span.field-error)
  └─ if exists → textContent = "" + .remove("show")
```

### Confirm Modal

```
showConfirm(msg) → Promise<boolean>
  ├─ DOM.confirmModalText.textContent = msg
  ├─ DOM.confirmModal.classList.remove("hidden")
  ├─ [OK] → cleanup listeners + resolve(true)
  └─ [Cancelar] → cleanup listeners + resolve(false)
```

---

## utils.js — Utilitários

| Função | Entrada | Saída | Notas |
|--------|---------|-------|-------|
| `toBase64(file)` | File | string (base64) | FileReader.readAsDataURL → split(",")[1] |
| `blobToBase64(blob)` | Blob | string (base64) | Idem |
| `base64ToBlob(base64, type)` | string base64, string type | Blob | atob → Uint8Array → Blob |
| `loadImage(file)` | File | HTMLImageElement | URL.createObjectURL; revoga após load |
| `formatDate(iso)` | ISO string | "DD/MM/YYYY HH:mm" | padStart(2) |
| `captureCoordinates()` | void | void | Geolocation API, timeout 10s, fallback "Não disponível" |

---

## dom.js — Cache DOM

```
cacheDOM() → popula objeto DOM
  ├─ Hamburger, Novo Form
  ├─ Sections (5)
  ├─ Error + Toast
  ├─ Início (campos, tipoOrdem)
  ├─ Retorno (desc, placeholder, campos)
  ├─ Equipamentos (list, add btn)
  ├─ Anexos (file input, count, preview grid, upload area)
  ├─ Revisão (preview corpo, complemento)
  ├─ Send (btn)
  ├─ Sidebar (elementos)
  └─ Modals (dup, lightbox, confirm)
```

Convenção: elementos são buscados via `getElementById` uma vez e nunca reassignados. Propriedades individuais podem ser mutadas.

---

## send.js — Orquestração de Envio

```
sendEmail()
  │
  ├─ if (!validateAll()) return false
  ├─ if (!await checkDuplicate()) return false
  │
  ├─ btn.disabled = true, text = "Enviando..."
  │
  ├─ subject = "OS #<os> - UC <uc> - <tipoLabel>"
  ├─ text = baseBody + (complemento ? "\n\n" + complemento : "")
  ├─ attachments = await compressAttachments(state.attachments)
  │
  ├─ fetch POST /api/send { subject, text, attachments }
  │
  ├─ if (res.ok && data.success)
  │   ├─ showToast("Email enviado com sucesso!", true)
  │   ├─ updateRecordStatus(state.currentUUID, { to, subject, sentAt })
  │   └─ return true
  │
  ├─ else
  │   ├─ showToast(data.error || "Erro ao enviar email.", false)
  │   └─ return false
  │
  └─ catch → showToast("Erro de conexão. Tente novamente.", false)
      └─ finally → btn.disabled = false, text = "📨 Enviar"
```

---

## sw-update.js — Service Worker

```
initSW()
  ├─ if (!'serviceWorker' in navigator) return
  ├─ const hadController = !!navigator.serviceWorker.controller
  │
  ├─ navigator.serviceWorker.register('/sw.js')
  │   ├─ registration.update()
  │   └─ controllerchange:
  │       └─ if (hadController) → showUpdateModal()
  │
  └─ catch → console.warn
```

### Update Modal

```html
<div id="update-modal" class="modal hidden">
  <div class="modal-content">
    <p>Nova versão disponível. Deseja atualizar?</p>
    <button id="update-modal-ok">Atualizar</button>
  </div>
</div>
```

---

## styles.js — Constantes CSS

```js
export const INPUT_CLASS =
  "w-full px-3.5 py-3 border rounded-[10px] text-[15px] font-sans outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10";

export const SELECT_CLASS = INPUT_CLASS + " py-3";
```

---

## Fluxo de Eventos Globais

```
document event: input / change (bubbling)
  │
  ├─ if (target.tagName in INPUT|SELECT|TEXTAREA)
  │   ├─ updateFilledClass(target)
  │   ├─ debouncedSave()
  │   ├─ updateLivePreview()
  │   └─ if target.id in ["uc","os"] → checkInitialPersistence()
  │
  document event: pointerdown (bubbling)
  └─ if (target.tagName not in INPUT|SELECT|TEXTAREA|BUTTON)
      └─ document.activeElement?.blur()
```

## Dependências

- `dom.js`: nenhuma (é dependência de todos)
- `ui.js`: `DOM` de `dom.js`
- `utils.js`: nenhuma
- `app.js`: todos os módulos da aplicação
- `send.js`: `DOM`, `state`, `db.js`, `ui.js`, `duplicate.js`, `compress.js`, `validation.js`
- `sw-update.js`: nenhuma
- `styles.js`: nenhuma

## API Pública

| Módulo | Função | Parâmetros | Retorno | Descrição |
|--------|--------|-----------|---------|-----------|
| `app.js` | `updateAllFilledClasses()` | `void` | `void` | Atualiza filled classes em todos inputs |
| `ui.js` | `showError(msg)` | string | `void` | Exibe erro global |
| `ui.js` | `hideError()` | `void` | `void` | Oculta erro global |
| `ui.js` | `showToast(msg, success)` | string, boolean | `void` | Exibe toast |
| `ui.js` | `setFieldError(el, msg)` | Element, string | `void` | Marca erro em campo |
| `ui.js` | `clearFieldError(el)` | Element | `void` | Limpa erro em campo |
| `ui.js` | `showConfirm(msg)` | string | `Promise<boolean>` | Modal de confirmação |
| `utils.js` | `toBase64(file)` | File | `Promise<string>` | File → base64 |
| `utils.js` | `blobToBase64(blob)` | Blob | `Promise<string>` | Blob → base64 |
| `utils.js` | `base64ToBlob(base64, type)` | string, string | `Blob` | base64 → Blob |
| `utils.js` | `loadImage(file)` | File | `Promise<Image>` | File → Image element |
| `utils.js` | `formatDate(iso)` | string | `string` | ISO → "DD/MM/YYYY HH:mm" |
| `utils.js` | `captureCoordinates()` | `void` | `Promise<void>` | Geolocation → campo coordenadas |
| `send.js` | `sendEmail()` | `void` | `Promise<boolean>` | Orquestra envio completo |
| `sw-update.js` | `initSW()` | `void` | `void` | Registra SW |

---

*Fim do design de ferramentas.*

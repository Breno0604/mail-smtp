# Sidebar, Design

> Gerado pelo Redator em 2026-06-15

---

## Estrutura DOM

```html
<aside id="sidebar">
  <div id="sidebar-header">
    <h2>Registros</h2>
    <button id="sidebar-close">✕</button>
  </div>
  <input id="sidebar-filter" type="text" placeholder="Filtrar por UC, OS...">
  <div id="sidebar-list">
    <!-- gerado dinamicamente por renderSidebar() -->
  </div>
</aside>
```

## Layout do Item

```
┌─────────────────────────────────────────────┐
│  [Resumo UC-OS-Tipo]            [Rascunho ▼] │
│  15/06/2026 12:30                            │
│  [✏️ Editar]  [🗑️ Excluir]                  │
└─────────────────────────────────────────────┘
```

- **Título**: `getRecordSummary(record)` → "UC-OS-Tipo" ou fallbacks
- **Status badge**: `.status-draft` (amarelo) ou `.status-sent` (verde)
- **Meta**: `formatDate(record.updatedAt)`
- **Ações**: Botões Editar e Excluir

## Fluxo de Sidebar

```
[Toggle sidebar] → body.classList.toggle("sidebar-open")
                      │
                      ▼
              renderSidebar(filterTerm)
                      │
                      ├─ getAllRecords()
                      ├─ sort(updatedAt desc)
                      ├─ filter por term (UC/OS/tipoOrdem)
                      ├─ renderizar itens
                      │
                      ├─ [Click Editar]
                      │   ├─ getRecord(uuid) — busca completo
                      │   └─ applyRecord(record) + closeSidebar()
                      │
                      └─ [Click Excluir]
                          ├─ closeSidebar() (fecha antes do modal)
                          ├─ showConfirm("Excluir?")
                          ├─ deleteRecord(uuid)
                          ├─ if currentUUID === uuid → clearCurrentUUID()
                          └─ renderSidebar() (re-renderiza)
```

## Fluxo de Duplicidade (Reenvio)

```
[Click Enviar]
     │
     ▼
checkDuplicate()
     │
     ├─ getRecord(currentUUID)
     │
     ├─ if (!record || status !== "sent") → resolve(true) [permite envio]
     │
     └─ if (status === "sent")
         ├─ exibe modal "Registro já enviado"
         ├─ mostra OS + data do envio
         ├─ [Cancelar] → resolve(false) [bloqueia]
         └─ [Confirmar] → resolve(true) [permite reenvio]
```

## Fluxo de Reset

```
resetForm()
  │
  ├─ Limpa state: equipamentos=[], attachments=[], iniciais={}, etc.
  ├─ markAttachmentsDirty()  (força re-save vazio)
  ├─ renderIniciais()
  ├─ captureCoordinates()
  ├─ re-attach tipoOrdem change listener
  ├─ DOM.retornoCampos.innerHTML = ""
  ├─ DOM.retornoPlaceholder.style.display = ""
  ├─ DOM.retornoDesc.innerHTML = "—"
  ├─ DOM.equipList.innerHTML = ""
  ├─ DOM.complementoCorpo.value = ""
  ├─ DOM.previewGrid.innerHTML = ""
  ├─ DOM.previewCorpo.textContent = "—"
  ├─ showEmptyEquip()
  ├─ updateFileCount()
  ├─ hideError()
  └─ clearCurrentUUID()
```

## Modal de Confirmação (Duplicidade)

```html
<div id="dup-modal" class="modal hidden">
  <div class="modal-content">
    <h3 id="dup-modal-title">Registro já enviado</h3>
    <p id="dup-modal-body">Este registro (OS #...) já foi enviado...</p>
    <div class="modal-actions">
      <button id="dup-modal-cancel" class="btn-secondary">Cancelar</button>
      <button id="dup-modal-confirm" class="btn-primary">Enviar mesmo assim</button>
    </div>
  </div>
</div>
```

## Dependências

- `DOM` de `dom.js`: `DOM.sidebarList`, `DOM.sidebarFilter`, `DOM.dupModal`, `DOM.dupModalTitle`, `DOM.dupModalBody`, `DOM.dupModalCancel`, `DOM.dupModalConfirm`
- `state` de `state.js`: `state.currentUUID`
- `db.js`: `getAllRecords()`, `getRecord()`, `deleteRecord()`
- `restore.js`: `applyRecord()`
- `ui.js`: `showConfirm()`
- `utils.js`: `formatDate()`
- `iniciais.js`: `renderIniciais()`
- `retornos.js`: `renderRetorno()`, `handleTipoChange()`
- `equipment.js`: `showEmptyEquip()`
- `attachments.js`: `updateFileCount()`
- `utils.js`: `captureCoordinates()`

## API Pública

| Módulo | Função | Parâmetros | Retorno | Descrição |
|--------|--------|-----------|---------|-----------|
| `sidebar.js` | `closeSidebar()` | `void` | `void` | Remove classe sidebar-open |
| `sidebar.js` | `renderSidebar(filter?)` | `string` (opc) | `Promise<void>` | Renderiza lista de registros |
| `sidebar.js` | `initSidebarFilter()` | `void` | `void` | Inicia listener de filtro |
| `duplicate.js` | `checkDuplicate()` | `void` | `Promise<boolean>` | true = pode enviar, false = bloqueado |
| `reset.js` | `resetForm()` | `void` | `void` | Limpa formulário completamente |

---

*Fim do design de sidebar.*

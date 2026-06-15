# Anexos, Design Técnico

> Gerado pelo Redator em 2026-06-15
> Cobre os módulos: `attachments.js`, `compress.js`

---

## Interface

### Funções Exportadas

| Símbolo | Assinatura | Retorno | Observação |
|---------|-----------|---------|------------|
| `handleUploadClick()` | `()` | `void` | Dispara click no input file oculto |
| `handleFileChange(e)` | `(e: Event)` | `void` | Processa FileList, limita a 12, adiciona ao state |
| `renderPreviews()` | `()` | `void` | Reconstrói grid de previews com thumbnails |
| `removeFile(index)` | `(index: number)` | `void` | Remove do state.attachments, marca dirty, re-renderiza |
| `compressAttachments(files)` | `(files: File[])` | `Promise<CompressedAttachment[]>` | Comprime imagens, retorna base64 |

### Estrutura de Dados

```typescript
// State interno
state.attachments: File[]  // Array de File objects do navegador

// Saída da compressão
interface CompressedAttachment {
  filename: string;   // "{basename}_red.jpg"
  content: string;    // Base64 sem header data:
  encoding: "base64";
}

// Store no IndexedDB
interface DBAttachment {
  id: string;         // "{uuid}_{index}"
  uuid: string;       // FK para records
  index: number;
  name: string;
  type: string;       // MIME type
  data: string;       // Base64
}
```

## Fluxo Principal

### Upload de Arquivos

1. Usuário clica na área de upload → `handleUploadClick()` → `DOM.fileInput.click()`
2. Usuário seleciona arquivos → `handleFileChange(e)`:
   a. Converte `FileList` para `Array`
   b. Se total + novos > 12: trunca para 12, loga warning
   c. Adiciona novos arquivos a `state.attachments`
   d. Chama `markAttachmentsDirty()`
   e. Chama `renderPreviews()` + `updateFileCount()` + `debouncedSave()`

### Renderização de Previews

1. `renderPreviews()`:
   a. Revoga todas as Object URLs antigas (`URL.revokeObjectURL`)
   b. Cria grid container (se não existir)
   c. Para cada arquivo em `state.attachments`:
      - Cria wrapper com thumbnail, nome do arquivo e botão ✕
      - Se for imagem: cria `<img>` com `URL.createObjectURL(file)`
      - Se não for imagem: cria ícone placeholder (📄)
      - Click na imagem → lightbox
      - Click no ✕ → `removeFile(index)`

### Compressão de Imagens

```
compressAttachments(files):
  por cada file:
    se file.size <= SKIP_SIZE (670KB) ou não é imagem:
      → apenas toBase64(file), retorna { filename, content, encoding }
    
    se é imagem e > SKIP_SIZE:
      largura = img.naturalWidth
      qualidade = 0.9
      
      para tentativa = 0..10:
        canvas = drawImage(img, 0, 0, largura)
        blob = canvas.toBlob("image/jpeg", qualidade)
        
        se blob.size <= MAX_SIZE (650KB):
          break  // sucesso
        
        se tentativa < 10:
          largura *= 0.8  // reduz 80% da largura
        senão:
          qualidade = 0.7  // fallback: reduz qualidade
        
      retorna { filename: "{basename}_red.jpg", content: blobToBase64(blob), encoding: "base64" }
```

### Remoção

1. `removeFile(index)`:
   a. `state.attachments.splice(index, 1)`
   b. `markAttachmentsDirty()`
   c. `renderPreviews()`
   d. `updateFileCount()`
   e. `debouncedSave()`

## Fluxos Alternativos

- **Arquivo não é imagem (PDF, DOCX, etc.):** bypassa compressão, apenas converte para base64
- **Falha no carregamento da imagem:** `loadImage()` rejeita → loga erro, pula compressão
- **Memory leak prevention:** `renderPreviews()` sempre revoga Object URLs antes de criar novas
- **Lightbox:** ao clicar na thumbnail, abre overlay com imagem em tamanho real. Click no fundo ou ✕ fecha

## Dependências

| Componente | Como usa |
|-----------|---------|
| `state.js` | Acessa `state.attachments`; chama `markAttachmentsDirty()`, `debouncedSave()` |
| `dom.js` | Acessa `DOM.fileInput`, `DOM.fileCount`, `DOM.previewGrid`, `DOM.fileUploadArea`, `DOM.lightbox`, `DOM.lightboxImg`, `DOM.lightboxClose` |
| `utils.js` | `toBase64()`, `blobToBase64()`, `loadImage()` |
| `ui.js` | Mostra toast para feedback |

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| Compressão no cliente (canvas API) — sem envio para servidor | `compress.js` | 🟢 |
| Compressão progressiva: itera reduzindo largura até atingir limite | `compress.js:12-49` | 🟢 |
| Skip para arquivos pequenos (≤ 670KB) | `compress.js:16` | 🟢 |
| Fallback de qualidade 0.7 na 11ª tentativa | `compress.js:34-35` | 🟢 |
| Object URL revogação entre renders | `attachments.js` | 🟢 |
| Dirty tracking para evitar re-serialização | `persistence.js:28-35` | 🟢 |

## Estado Interno

`state.attachments: File[]` — array de arquivos em memória. Persistido no IndexedDB via `_serializeAndSaveAttachments()` (conversão para base64).

## Observabilidade

- `console.error` em falha de carregamento de imagem
- Toast de warning no upload excedendo limite
- Toast no save com espaço insuficiente

## Riscos e Lacunas

- 🟢 Compressão é lossy — perda de qualidade é aceitável para OS de campo
- 🟡 Limite de 8 MB por anexo é validado apenas no backend (`send.js`) e na validação (`validation.js:178`), não no upload

---

*Fim do design de anexos.*

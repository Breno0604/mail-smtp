# Anexos, Requisitos

> Gerado pelo Redator em 2026-06-15
> Cobre os módulos: `attachments.js`, `compress.js`

---

## Visão Geral

Gerencia o upload, preview, compressão e remoção de arquivos anexados ao formulário de OS. Suporta compressão progressiva de imagens para reduzir o tamanho antes do envio por email.

## Responsabilidades

- Upload de arquivos via input file ou drag & drop
- Limitar a 12 anexos por formulário
- Renderizar preview grid com thumbnails, nome e botão remover
- Exibir lightbox para visualização ampliada de imagens
- Comprimir imagens progressivamente (JPEG, canvas) até ≤ 650KB
- Converter arquivos para base64 para persistência no IndexedDB
- Marcar dirty tracking para sincronização com o save

## Regras de Negócio

- RN01: Máximo de 12 anexos por formulário (excedente descartado com warning) 🟢
- RN02: Cada anexo no máximo 8 MB (validado no envio, não no upload) 🟢
- RN03: Imagens ≤ 670KB (SKIP_SIZE) não são comprimidas — apenas convertidas para base64 🟢
- RN04: Compressão progressiva: até 10 tentativas reduzindo largura em 80%, qualidade JPEG 0.9 🟢
- RN05: 11ª tentativa (fallback): qualidade 0.7 sem redução adicional de largura 🟢
- RN06: Anexos comprimidos são renomeados para `{basename}_red.jpg` 🟢
- RN07: Anexos com dirty tracking — `markAttachmentsDirty()` deve ser chamada após mudanças 🟢
- RN08: Object URLs antigas são revogadas antes de renderizar novos previews (memory leak prevention) 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Upload de arquivos via input file | Must | Click no botão/file area abre seletor de arquivos |
| RF-02 | Upload via drag & drop na área designada | Should | Arrastar arquivo para a área de upload adiciona ao state |
| RF-03 | Limitar a 12 anexos | Must | Ao tentar adicionar o 13º, exibe warning e descarta excesso |
| RF-04 | Renderizar preview grid com thumbnails | Must | Grid de imagens com thumbnail, nome do arquivo e botão ✕ |
| RF-05 | Remover anexo individual | Must | Click no ✕ remove o anexo e re-renderiza grid |
| RF-06 | Lightbox para visualização ampliada | Could | Click na thumbnail abre imagem em tela cheia (overlay) |
| RF-07 | Comprimir imagens > 670KB para ≤ 650KB | Must | Algoritmo progressivo reduz tamanho até limite |
| RF-08 | Fallback de compressão na 11ª tentativa | Must | Se após 10 tentativas não atingiu limite, qualidade 0.7 |
| RF-09 | Manter arquivos não-imagem inalterados | Must | PDFs, DOCX etc. não passam pelo compressor |
| RF-10 | Marcar dirty tracking ao modificar anexos | Must | `markAttachmentsDirty()` é chamada após add/remove/reset |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Performance | Compressão no cliente (canvas API) — não consome banda | `compress.js` | 🟢 |
| Performance | Dirty tracking evita re-serialização desnecessária | `persistence.js:28-35` | 🟢 |
| Memory | Revogação de Object URLs entre renders | `attachments.js` | 🟢 |

## Critérios de Aceitação

```gherkin
Dado um formulário sem anexos
Quando o usuário seleciona 3 imagens via input file
Então 3 thumbnails aparecem no preview grid
E o contador mostra "3 anexo(s)"

Dado que já existem 12 anexos
Quando o usuário tenta adicionar mais 2 arquivos
Então apenas 12 anexos permanecem
E uma mensagem de warning é exibida: "Máximo 12 anexos. 2 ignorado(s)."

Dado um anexo no preview grid
Quando o usuário clica no ✕
Então o anexo é removido do state
E o preview grid re-renderiza sem aquele anexo

Dado uma imagem JPEG de 1MB
Quando a compressão é aplicada
Então o resultado é ≤ 650KB
E o nome do arquivo termina com "_red.jpg"

Dado um arquivo PDF de 500KB
Quando a compressão é aplicada
Então o arquivo não é modificado (apenas convertido para base64)

Dado que um anexo foi adicionado
Quando o formulário é salvo
Então markAttachmentsDirty foi chamada
E o saveState serializa os anexos
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Upload de arquivos | Must | Funcionalidade principal: anexar fotos à OS |
| Limite de 12 anexos | Must | Regra de negócio validada no backend |
| Preview grid | Must | Feedback visual para o usuário |
| Compressão de imagens | Must | Necessário para envio por email (< 8MB por anexo) |
| Lightbox | Could | Conveniência, não bloqueia funcionalidade |
| Drag & drop | Could | Melhoria UX, fallback para input file |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `scripts/attachments.js` | `handleUploadClick()`, `handleFileChange()`, `renderPreviews()`, `removeFile()` | 🟢 |
| `scripts/compress.js` | `compressAttachments()` | 🟢 |

---

*Fim dos requisitos de anexos.*

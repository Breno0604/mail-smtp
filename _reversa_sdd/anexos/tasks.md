# Anexos, Tarefas de Implementação

> Gerado pelo Redator em 2026-06-15

---

## Pré-requisitos

- [ ] Módulo `state.js` com `state.attachments: File[]` e `markAttachmentsDirty()`
- [ ] Módulo `dom.js` com cache de elementos de preview e lightbox
- [ ] Módulo `utils.js` com `toBase64()`, `blobToBase64()`, `loadImage()`

## Tarefas

- [ ] T-01, Implementar `handleFileChange(e)` com limite de 12 anexos
  - Origem no legado: `scripts/attachments.js`
  - Critério de pronto: Converte FileList para Array, limita a 12, adiciona ao state, marca dirty, re-renderiza
  - Confiança: 🟢

- [ ] T-02, Implementar `renderPreviews()` com grid de thumbnails
  - Origem no legado: `scripts/attachments.js`
  - Critério de pronto: Revoga Object URLs antigas, renderiza grid com thumbnails de imagem (ou ícone para não-imagem), nome e botão remover
  - Confiança: 🟢

- [ ] T-03, Implementar `removeFile(index)` com re-renderização
  - Origem no legado: `scripts/attachments.js`
  - Critério de pronto: Remove do array, marca dirty, re-renderiza previews
  - Confiança: 🟢

- [ ] T-04, Implementar lightbox para visualização ampliada
  - Origem no legado: `scripts/attachments.js`
  - Critério de pronto: Click na imagem abre overlay com imagem em tamanho real; click fora/fechar fecha
  - Confiança: 🟢

- [ ] T-05, Implementar `compressAttachments(files)` com algoritmo progressivo
  - Origem no legado: `scripts/compress.js:12-49`
  - Critério de pronto: Imagens > 670KB comprimidas para ≤ 650KB; max 10 tentativas com redução de 80% da largura; fallback qualidade 0.7
  - Confiança: 🟢

- [ ] T-06, Implementar skip de compressão para arquivos pequenos e não-imagem
  - Origem no legado: `scripts/compress.js:16`
  - Critério de pronto: Arquivos ≤ 670KB ou não imagem: apenas toBase64()
  - Confiança: 🟢

- [ ] T-07, Garantir renomeação de arquivo comprimido para `{basename}_red.jpg`
  - Origem no legado: `scripts/compress.js:44`
  - Critério de pronto: Saída da compressão tem filename = "{basename}_red.jpg"
  - Confiança: 🟢

- [ ] T-08, Garantir dirty tracking após qualquer modificação nos anexos
  - Origem no legado: `scripts/persistence.js:34-35`
  - Critério de pronto: `markAttachmentsDirty()` chamada após add, remove e reset
  - Confiança: 🟢

## Tarefas de Teste

- [ ] TT-01, Testar upload de arquivos (limite de 12, warning no excesso)
- [ ] TT-02, Testar renderização de preview grid (imagens e não-imagens)
- [ ] TT-03, Testar remoção de anexo individual
- [ ] TT-04, Testar lightbox (abrir, fechar)
- [ ] TT-05, Testar compressão progressiva (imagem > 670KB → ≤ 650KB)
- [ ] TT-06, Testar skip para arquivos pequenos e não-imagem
- [ ] TT-07, Testar fallback de qualidade 0.7 na 11ª tentativa
- [ ] TT-08, Testar dirty tracking (flag é setada corretamente)

## Ordem Sugerida

1. T-01, T-02, T-03 (upload + preview + remove) — funcionalidade base
2. T-08 (dirty tracking) — integração com persistência
3. T-05, T-06, T-07 (compressão) — processamento de imagem
4. T-04 (lightbox) — UX, independente
5. Testes na ordem correspondente

## Lacunas Pendentes (🔴)

Nenhuma.

---

*Fim das tarefas de anexos.*

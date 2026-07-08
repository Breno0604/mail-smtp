# Mobile Android UI Fixes — Design Doc

## Visão Geral

5 melhorias de UI/UX para tornar o formulário mais adequado ao uso em celular Android.

---

## 1. Fechar teclado ao tocar fora do campo

**Problema:** Após preencher um campo, o teclado do Android persiste na tela mesmo tocando em área vazia, bloqueando a visão dos botões e campos seguintes.

**Solução:** Adicionar event listener de `pointerdown` no `document`. Se o alvo do clique não for um `input`, `select` ou `textarea`, executa `document.activeElement?.blur()`. Isso faz o teclado recolher.

**Arquivos afetados:** `scripts/app.js`

---

## 2. Não permitir zoom acidental

**Problema:** Ao tocar em campos de formulário, navegadores Android às vezes aplicam zoom na página, forçando o usuário a dar zoom out manualmente.

**Solução:** Adicionar `touch-action: manipulation` no CSS no `body` ou num container raiz. Isso desativa o duplo-toque para zoom e o pinça, sem afetar o scroll.

**Arquivos afetados:** `style.css`

---

## 3. Modo retrato obrigatório

**Problema:** Ao virar o celular de lado, o formulário longo fica distorcido e difícil de usar.

**Solução:** Adicionar media query `@media (orientation: landscape)` com overlay fixo exibindo "Gire o celular na vertical". CSS puro, sem JS. O overlay some automaticamente ao voltar para retrato. Não é possível travar orientação de verdade na web sem tela cheia (API Screen Orientation), mas o overlay educa o usuário.

**Arquivos afetados:** `index.html`, `style.css`

---

## 4. Voltar ao topo ao mudar de seção

**Problema:** Ao navegar entre seções, o scroll permanece na posição anterior. Se o usuário rolou para baixo na seção de equipamentos e foi para Retorno, a seção abre no meio.

**Solução:** Em `showSection()` em `navigation.js`, após exibir a nova seção, definir `DOM.wrapper.scrollTop = 0`.

**Arquivos afetados:** `scripts/navigation.js`

---

## 5. Textos com alto contraste

**Problema:** Cores como `text-gray-400` (#9CA3AF) e `text-gray-500` (#6B7280) sobre fundo branco têm contraste abaixo de 4.5:1, dificultando a leitura em ambientes externos (luz solar) ou brilho baixo.

**Solução:** Identificar todos os elementos de texto no HTML e CSS com contraste insuficiente e subir a cor para o próximo nível mais escuro:

- `text-gray-400` → `text-gray-600` (#4B5563)
- `text-gray-500` → `text-gray-700` (#374151) (mantendo onde já é usado para labels)
- Cores em CSS (`color: #6b7280` ou similares) → ajustar para >= #4B5563

**Arquivos afetados:** `index.html`, `style.css`

---

## Arquivos Alterados Resumo

| Arquivo                 | Mudanças                                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| `index.html`            | Viewport meta (se não existir `user-scalable=no`), overlay landscape, ajustes de classe de cor |
| `style.css`             | `touch-action: manipulation`, overlay landscape CSS, ajustes de contraste                      |
| `scripts/app.js`        | Event listener de dismiss do teclado                                                           |
| `scripts/navigation.js` | `scrollTop = 0` no `showSection`                                                               |

---

## Não Escopo

- Modo escuro / dark mode
- Salvamento de scroll position ao voltar
- Suporte a tablets
- Outras melhorias listadas no `mobile_android.md`

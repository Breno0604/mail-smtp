# Melhoria Visual — Formulário de Envio

**Data:** 08/06/2026
**Status:** Aprovado
**Projeto:** Mail MVP — Formulário de Envio de Retorno

## 1. Remover informativo global de erro ("Preencha todos os campos obrigatórios")

### O quê

Remover as chamadas `showError("Preencha todos os campos obrigatórios.")` das funções de validação em `validation.js`, pois já existem mensagens de erro inline personalizadas para cada campo.

### Onde

- `validation.js` linha 52 (`validateSection1`)
- `validation.js` linha 128 (`validateSection2`) — também remover mensagem de equipamento duplicado se for o caso
- `validation.js` linha 158 (`validateSection3`)

### Efeito

Em vez de exibir o balão global de erro, a validação falha silenciosamente e apenas os campos com problema mostram seus erros inline (via `setFieldError`).

---

## 2. Aumentar e destacar ícone de atualizar coordenadas

### O quê

Substituir o botão de refresh das coordenadas (atualmente 28×28px, fonte 16px) por um botão de 36×36px com ícone 20px, com borda, hover e sombra para parecer mais clicável.

### Onde

`scripts/iniciais.js`, função `createCoordinatesGroup`, linhas 80–97.

### Detalhes

- Largura/altura: 28px → 36px
- Ícone: font-size 16px → 20px
- Adicionar `border: 1px solid #d1d5db`
- Adicionar `border-radius: 8px`
- Hover: fundo `#eff6ff`, borda `#3b82f6`, `box-shadow` sutil
- Adicionar `box-shadow` no estado normal

---

## 3. Reforçar classe `.is-filled` em campos preenchidos

### O quê

A classe `.is-filled` já existe e é aplicada via `updateFilledClass()` em `app.js`, mas o azul (`#f0f7ff`) é muito sutil e a borda de 2px não se destaca da borda padrão de 1px.

### Onde

`style.css` linhas 97–101.

### Detalhes

```css
/* Antes */
background-color: #f0f7ff !important;
border-color: #3b82f6 !important;
border-width: 2px !important;

/* Depois */
background-color: #dbeafe !important;
border-color: #2563eb !important;
border-width: 2.5px !important;
```

### Notas

- Nenhuma mudança em JS — apenas CSS
- O mecanismo de aplicação (`updateAllFilledClasses` + event listeners) já funciona
- O `.is-filled` usa `!important` para sobrescrever as classes Tailwind dos inputs

---

## 4. Ajustes nos campos de equipamentos + remover "Pular"

### O quê

4 alterações no bloco de equipamentos:

1. Aumentar altura interna: `py-3` → `py-4` no select/input
2. Aumentar espaçamento entre rows: `mb-4` → `mb-6`
3. Aumentar texto: `text-base` → `text-lg`
4. Remover botão "Pular" e toda sua lógica

### Onde

- `index.html` linha 51: remover `<button class="btn-skip" id="btn-skip-equip"...>`
- `scripts/equipment.js` linhas 7–24: atualizar classes CSS nos elementos
- `scripts/reset.js` linha 4: remover `updateSkipBtn` do import
- `scripts/reset.js` linha 26: remover `updateSkipBtn()` do corpo
- `style.css`: remover classe `.btn-skip` se existir (ou deixar órfã)
- Test files que referenciam `btn-skip-equip`:
  - `tests/navigation.test.js` linha 58 — remover o elemento `<button id="btn-skip-equip">`
  - `tests/reset.test.js` linha 16 — remover o elemento `<button id="btn-skip-equip">`
  - `tests/setup.js` linha 55 — remover o elemento `<button id="btn-skip-equip">`
  - `tests/app-init.test.js` linha 34 — remover `'btn-skip-equip'` do array de IDs esperados

### Detalhes

```js
// addEquip — classes atualizadas
className: 'equip-row flex gap-2.5 items-center mb-6 p-3 bg-slate-50/50 ...';
// selects py-3 → py-4, text-base → text-lg
// input py-3 → py-4, text-base → text-lg
```

---

## 5. Melhorar botão "Novo formulário em branco"

### O quê

Substituir o visual simples do botão `+` por um botão azul gradiente com ícone branco e sombra destacada.

### Onde

`index.html` linha 26.

### Detalhes

```html
<!-- Antes -->
<button
  class="btn-novo-form w-10 h-10 flex items-center justify-center
  rounded-xl border border-slate-200 bg-slate-50 text-slate-600
  text-2xl font-semibold shadow-sm ..."
>
  +
</button>

<!-- Depois -->
<button
  class="btn-novo-form w-10 h-10 flex items-center justify-center
  rounded-xl border-none bg-gradient-to-br from-blue-500 to-blue-600
  text-white text-2xl font-bold shadow-lg shadow-blue-500/25
  hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 active:scale-95
  transition-all duration-200 ..."
>
  +
</button>
```

---

## 6. Aumentar texto das etapas no topo

### O quê

Aumentar `font-size` dos steps de `0.875rem` (14px) para `1rem` (16px). Ajustar padding para compensar.

### Onde

`style.css` linhas 44–75 (classe `.step`).
`style.css` linha 276 (media query mobile).

### Detalhes

```css
.step {
  font-size: 1rem; /* antes: 0.875rem */
  padding: 7px 17px; /* antes: 6.5px 15px */
}
@media (max-width: 640px) {
  .step {
    font-size: 0.85rem !important;
    padding: 6px 13px !important;
  }
}
```

---

## 7. Retorno — remover texto "Preencha as informações de retorno"

### O quê

Na seção de Retorno, exibir apenas o nome do tipo de ordem como título, sem texto antecedente.

### Onde

- `index.html` linha 56: alterar texto inicial do `#retorno-desc`
- `scripts/retornos.js` linha 14: já está correto (mostra apenas o tipoLabel), mas confirmar

### Detalhes

```html
<!-- index.html: antes -->
<p class="text-base text-gray-600 mb-5" id="retorno-desc">Preencha as informações de retorno.</p>

<!-- index.html: depois -->
<p class="text-lg font-bold text-slate-800 mb-5" id="retorno-desc">—</p>
```

O JS em `retornos.js` linha 14 já substitui o conteúdo por `<span class="text-lg font-bold text-slate-800">${tipoLabel}</span>`, então a renderização fica correta após o JS carregar.

---

## 8. Mover botões de navegação para o topo + remover rodapé

### O quê

Mover os botões "← Anterior" e "Avançar →" para logo abaixo dos steps (acima do conteúdo da seção). Remover o espaço do rodapé que antes continha os botões.

### Onde

- `index.html` linhas 86–89: mover `<div class="nav-buttons" id="nav-buttons">` para logo após `</div>` do `.progress`
- `style.css` linhas 146–152 (`#nav-buttons`): ajustar estilos
- `style.css` linhas 131–137 (`.container`): ajustar altura/overflow
- `style.css` linha 278: ajustar media query de `.nav-buttons .btn`

### Detalhes

```html
<!-- Nova ordem no index.html -->
<div class="progress sticky ...">...</div>
<div class="nav-buttons flex justify-between" id="nav-buttons">
  <!-- movido para cá -->
  <button class="btn btn-secondary" id="btn-anterior" disabled>← Anterior</button>
  <button class="btn btn-primary" id="btn-proximo">Avançar →</button>
</div>
<div class="section-wrapper relative ..." id="section-wrapper">...seções...</div>
<!-- Rodapé removido — #nav-buttons não fica mais aqui -->
```

```css
/* style.css — #nav-buttons ajustado */
#nav-buttons {
  flex-shrink: 0;
  z-index: 100;
  background: transparent;
  border-top: none;
  border-bottom: 1px solid #e5e7eb;
  padding: 8px 16px 12px;
}

/* .container — sem flex column height: 100vh, volta ao normal */
/* #section-wrapper — sem flex: 1, sem overflow-y auto */
/* Remover ou simplificar */
```

### Observação importante

A estrutura atual usa `display: flex; flex-direction: column; height: 100vh` no `.container` com `#section-wrapper { flex: 1; overflow-y: auto }`. Com os botões no topo, isso não é mais necessário. O container volta a ser um layout de fluxo normal (padding-bottom natural), e o `#section-wrapper` pode usar `min-height: 320px` sem `flex: 1`.

O rodapé vazio que antes continha os botões é removido — `#nav-buttons` não fica mais no final do container, então as regras `border-top`, `padding` e `background` associadas ao posicionamento no rodapé são removidas ou realocadas.

---

## Arquivos afetados (resumo)

| Arquivo                 | Itens                             |
| ----------------------- | --------------------------------- |
| `index.html`            | 4, 5, 7, 8                        |
| `style.css`             | 3, 6, 8                           |
| `scripts/iniciais.js`   | 2                                 |
| `scripts/equipment.js`  | 4                                 |
| `scripts/validation.js` | 1                                 |
| `scripts/reset.js`      | 4                                 |
| Test files              | 4 (remover refs a btn-skip-equip) |

Nenhum arquivo novo é criado. Apenas modificações nos arquivos existentes.

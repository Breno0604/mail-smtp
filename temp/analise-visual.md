# Análise de Padronização Visual — Projeto Mail MVP

> **Escopo:** Mapeamento completo de design tokens (cores, fontes, bordas, espaçamentos, sombras, transições) e identificação de inconsistências entre CSS customizado e Tailwind CSS.
> **Arquivos analisados:** `style.css`, `tailwind.css`, `tailwind-input.css`, `scripts/styles.js`, `index.html`, todos os módulos JS em `scripts/`.

---

## Índice

1. [Resumo Executivo](#1-resumo-executivo)
2. [Paleta de Cores](#2-paleta-de-cores)
3. [Tipografia](#3-tipografia)
4. [Bordas e Border-Radius](#4-bordas-e-border-radius)
5. [Espaçamentos](#5-espaçamentos)
6. [Sombras](#6-sombras)
7. [Transições e Animações](#7-transições-e-animações)
8. [Estados de Campo](#8-estados-de-campo)
9. [Botões](#9-botões)
10. [Modais](#10-modais)
11. [Cards e Seções](#11-cards-e-seções)
12. [Sidebar](#12-sidebar)
13. [Problemas de Inconsistência](#13-problemas-de-inconsistência)
14. [Recomendações de Design Tokens](#14-recomendações-de-design-tokens)
15. [Tabela Resumo de Padronização](#15-tabela-resumo-de-padronização)

---

## 1. Resumo Executivo

O projeto utiliza **dois sistemas de estilos paralelos**: CSS customizado (`style.css`, 755 linhas) e Tailwind CSS (classes inline no HTML e JS). Essa abordagem dual cria duplicação e risco de divergência, mas os tokens de design subjacentes são **relativamente consistentes** dentro de cada sistema.

**Subsystemas bem padronizados:**

- Estados de campo (não preenchido / preenchido / erro) — 3 estados visuais coerentes
- Modais — 4 modais com padrão HTML idêntico
- Paleta de cores — baseada em Tailwind Slate + accent colors consistentes

**Subsystemas com inconsistências:**

- Border-radius (8 valores diferentes sem hierarquia clara)
- Transições (7 timings diferentes)
- Botão de envio (`#btn-enviar`) não segue o padrão `.btn`
- Sistema dual CSS hex + Tailwind classes

---

## 2. Paleta de Cores

### 2.1 Cores base (Slate scale — usadas em fundos, bordas, texto)

| Token     | Hex       | Tailwind    | Uso                                                                  |
| --------- | --------- | ----------- | -------------------------------------------------------------------- |
| Slate-50  | `#f8fafc` | `slate-50`  | Fundo de sec-head, sidebar-item, file-upload-area                    |
| Slate-100 | `#f1f5f9` | `slate-100` | Fundo body (gradiente), btn-secondary, status-draft, hamburger       |
| Slate-200 | `#e2e8f0` | `slate-200` | Bordas de sec-head, sidebar-head, sidebar-item                       |
| Slate-300 | `#cbd5e1` | `slate-300` | Bordas de sec-card, sidebar-item:hover                               |
| Slate-400 | `#94a3b8` | `slate-400` | Texto placeholder, ret-placeholder, sidebar-empty, sidebar-item-meta |
| Slate-500 | `#64748b` | `slate-500` | Texto secundário, btn-secondary, placeholder input, file-count       |
| Slate-600 | `#475569` | `slate-600` | Texto labels, hamburger, orientation-sub, btn-secondary:hover        |
| Slate-800 | `#1f2937` | `slate-800` | Toast bg, preview-value text, equipamentos标题                       |
| Slate-900 | `#0f172a` | `slate-900` | Texto principal (sec-head, sidebar-title, headings), input text      |

**Status:** Consistente — a escala Slate é usada de forma coerente em todo o projeto.

### 2.2 Cor primária (Azul)

| Token    | Hex       | Tailwind   | Uso                                                                                  |
| -------- | --------- | ---------- | ------------------------------------------------------------------------------------ |
| Blue-500 | `#3b82f6` | `blue-500` | sec-inicio border, sec-num background, btn-new-form, hamburger:hover                 |
| Blue-600 | `#2563eb` | `blue-600` | sec-num default, input unfocused border, focus:ring, sidebar-btn-edit, coord-refresh |
| Blue-700 | `#1d4ed8` | `blue-700` | btn-primary:hover                                                                    |

**Status:** Consistente — azul é usada exclusivamente para primário/foco.

### 2.3 Cor de sucesso (Verde)

| Token       | Hex       | Tailwind      | Uso                                            |
| ----------- | --------- | ------------- | ---------------------------------------------- |
| Emerald-400 | `#34d399` | `emerald-400` | (não usado diretamente)                        |
| Emerald-500 | `#10b981` | `emerald-500` | sec-retorno border, btn-success gradient start |
| Green-500   | `#16a34a` | `green-500`   | toast.success bg, input filled border          |
| Green-600   | `#059669` | `green-600`   | btn-enviar gradient, btn-success gradient end  |
| Green-700   | `#047857` | `green-700`   | btn-success:hover gradient end                 |
| Green-800   | `#065f46` | `green-800`   | status-sent text                               |

**Problema:** Mistura de `emerald-*` e `green-*` para a mesma semantic "sucesso". Emerald-500 (#10b981) e Green-500 (#16a34a) são cores visualmente diferentes mas usadas para o mesmo propósito.

### 2.4 Cor de erro (Vermelho)

| Token   | Hex       | Tailwind  | Uso                                                                               |
| ------- | --------- | --------- | --------------------------------------------------------------------------------- |
| Red-50  | `#fef2f2` | `red-50`  | errorMsg bg, input error bg, sidebar-btn-delete:hover                             |
| Red-200 | `#fecaca` | `red-200` | errorMsg border                                                                   |
| Red-600 | `#dc2626` | `red-600` | errorMsg text, input error border, sidebar-close, sidebar-btn-delete, toast error |
| Red-700 | `#b91c1c` | `red-700` | sidebar-close:hover                                                               |

**Status:** Consistente — vermelho é exclusivamente para erro/destrutivo.

### 2.5 Cor de alerta (Âmbar)

| Token     | Hex       | Tailwind    | Uso                     |
| --------- | --------- | ----------- | ----------------------- |
| Amber-400 | `#fbbf24` | `amber-400` | (não usado diretamente) |
| Amber-500 | `#f59e0b` | `amber-500` | sec-equipamentos border |

**Status:** Consistente — âmbar é exclusivamente para equipamentos/alerta.

### 2.6 Cor de destaque (Roxo)

| Token      | Hex       | Tailwind     | Uso               |
| ---------- | --------- | ------------ | ----------------- |
| Violet-500 | `#8b5cf6` | `violet-500` | sec-anexos border |

**Status:** Consistente — roxo é exclusivamente para anexos.

### 2.7 Cores de status (Sidebar)

| Classe            | Background              | Texto                   | Uso      |
| ----------------- | ----------------------- | ----------------------- | -------- |
| `.status-draft`   | `#f1f5f9` (slate-100)   | `#64748b` (slate-500)   | Rascunho |
| `.status-sent`    | `#d1fae5` (emerald-100) | `#065f46` (emerald-800) | Enviado  |
| `.status-changed` | `#fef3c7` (amber-100)   | `#92400e` (amber-800)   | Alterado |

**Status:** Consistente — semanticamente claros.

### 2.8 Gradientes

| Componente        | Gradiente                                            | CSS                     |
| ----------------- | ---------------------------------------------------- | ----------------------- |
| sec-head          | `linear-gradient(to bottom, #f8fafc, #f1f5f9)`       | slate-50 → slate-100    |
| btn-primary       | `linear-gradient(135deg, #3b82f6, #2563eb)`          | blue-500 → blue-600     |
| btn-primary:hover | `linear-gradient(135deg, #2563eb, #1d4ed8)`          | blue-600 → blue-700     |
| btn-success       | `linear-gradient(135deg, #10b981, #059669)`          | emerald-500 → green-600 |
| btn-success:hover | `linear-gradient(135deg, #059669, #047857)`          | green-600 → green-700   |
| btn-enviar        | `linear-gradient(135deg, #059669, #047857)`          | green-600 → green-700   |
| btn-new-form      | `linear-gradient(135deg, #3b82f6, #2563eb)`          | blue-500 → blue-600     |
| body bg           | `linear-gradient(to br, from-slate-100, to-blue-50)` | Tailwind class          |

**Problema:** `btn-success` e `btn-enviar` usam o mesmo gradiente (green-600 → green-700), mas `btn-success` começa em emerald-500 enquanto `btn-enviar` começa em green-600 — efeito visual ligeiramente diferente.

---

## 3. Tipografia

### 3.1 Família de fonte

```css
/* style.css */
body {
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif !important;
}
```

- **Primária:** Inter (carregada via Google Fonts)
- **Fallback:** System font stack (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial)
- **Uso de `!important`:** Força a fonte em todo o body, sobrescrevendo qualquer Tailwind `font-sans`

### 3.2 Pesos usados

| Peso           | Tailwind        | CSS                | Onde                                     |
| -------------- | --------------- | ------------------ | ---------------------------------------- |
| 400 (regular)  | `font-normal`   | —                  | Texto base, placeholders                 |
| 500 (medium)   | `font-medium`   | —                  | file-count, labels                       |
| 600 (semibold) | `font-semibold` | `font-weight: 600` | Labels de campo, btn, sidebar-item-title |
| 700 (bold)     | `font-bold`     | `font-weight: 700` | Headings, sec-head, sec-num, btn, toasts |

### 3.3 Tamanhos usados

| Tamanho          | Tailwind            | Uso                                           |
| ---------------- | ------------------- | --------------------------------------------- |
| 0.6875rem (11px) | `text-[11px]`       | sidebar-status badge                          |
| 0.7rem (11.2px)  | `font-size: 0.7rem` | sec-num badge                                 |
| 0.75rem (12px)   | `text-xs`           | file-count, field-error, sidebar-item-meta    |
| 0.8125rem (13px) | `text-[13px]`       | sidebar-btn, equip-checkbox label             |
| 0.8rem (12.8px)  | `font-size: 0.8rem` | ret-placeholder                               |
| 0.875rem (14px)  | `text-sm`           | btn base, sidebar-item-title, orientation-sub |
| 0.9rem (14.4px)  | `font-size: 0.9rem` | sec-head                                      |
| 0.9375rem (15px) | `text-[15px]`       | inputs (INPUT_CLASS), toast, sidebar-empty    |
| 1rem (16px)      | `text-base`         | retorno-desc, modal titles, btn-enviar        |
| 1.125rem (18px)  | `text-xl`           | h1 title, sidebar-title                       |
| 1.25rem (20px)   | `text-xl`           | hamburger icon, orientation-text              |
| 1.5rem (24px)    | —                   | sidebar-close icon, ret-icon                  |
| 20px             | `text-[20px]`       | btn-new-form icon                             |
| 3rem (48px)      | `text-3xl`          | file-upload icon                              |
| 3rem (48px)      | `font-size: 3rem`   | orientation-icon                              |

**Problema:** Tamanhos misturados em `rem` e `px`, com muitos valores próximos (0.8rem vs 0.8125rem vs 0.875rem). Falta uma escala consistente de tipografia.

---

## 4. Bordas e Border-Radius

### 4.1 Valores de border-radius usados

| Valor   | Onde (CSS)                                                       | Onde (Tailwind)  | Componente                                        |
| ------- | ---------------------------------------------------------------- | ---------------- | ------------------------------------------------- |
| `6px`   | `.sec-num`                                                       | —                | Badge numérico das seções                         |
| `8px`   | `.sidebar-btn`, `.coord-refresh`                                 | `rounded-[8px]`  | Botões sidebar, refresh coords                    |
| `10px`  | `.btn`, `.toast`, `.btn-new-form`, `.hamburger`, `.sidebar-item` | `rounded-[10px]` | Botões gerais, toast, campos input, sidebar items |
| `12px`  | —                                                                | `rounded-[12px]` | Modais, file-upload-area, email-preview           |
| `14px`  | `.sec-card`                                                      | —                | Cards de seção                                    |
| `20px`  | —                                                                | `rounded-[20px]` | Container principal                               |
| `30px`  | `#btn-enviar`                                                    | —                | Botão de enviar (pill shape)                      |
| `999px` | `.sidebar-status`                                                | `rounded-full`   | Badges de status (pill)                           |

### 4.2 Bordas (largura e cor)

| Largura | Cor                     | Onde                       |
| ------- | ----------------------- | -------------------------- |
| `1px`   | `#e2e8f0` (slate-200)   | sidebar-head, sidebar-item |
| `1px`   | `#d1d5db` (gray-300)    | coord-refresh              |
| `2px`   | `#cbd5e1` (slate-300)   | sec-card default           |
| `2px`   | `#e2e8f0` (slate-200)   | sec-head bottom            |
| `2.5px` | `#2563eb` (blue-600)    | input unfocused            |
| `2.5px` | `#16a34a` (green-500)   | input filled               |
| `2.5px` | `#dc2626` (red-600)     | input error                |
| `3px`   | `#3b82f6` (blue-500)    | sec-inicio                 |
| `3px`   | `#10b981` (emerald-500) | sec-retorno                |
| `3px`   | `#8b5cf6` (violet-500)  | sec-anexos                 |
| `4px`   | `#f59e0b` (amber-500)   | sec-equipamentos           |

**Problemas:**

1. **8 valores de border-radius** sem hierarquia clara (6, 8, 10, 12, 14, 20, 30, 999)
2. `sec-equipamentos` tem borda de 4px enquanto outras seções usam 3px — sem razão visual óbvia
3. Mistura de `border-radius` em CSS e `rounded-*` em Tailwind para os mesmos valores

---

## 5. Espaçamentos

### 5.1 Margins e paddings do container

| Elemento                 | Spacing                   | Sistema  |
| ------------------------ | ------------------------- | -------- |
| Container principal      | `max-w-[640px]`, `p-0`    | Tailwind |
| Container padding-bottom | `padding-bottom: 2rem`    | CSS      |
| Header                   | `px-5 pt-3.5 pb-2.5`      | Tailwind |
| Seções (cards)           | `mx-2.5 mt-4`             | Tailwind |
| sec-body                 | `padding: 1rem 0.5rem`    | CSS      |
| sec-head                 | `padding: 0.75rem 0.5rem` | CSS      |

### 5.2 Espaçamentos de campos

| Elemento                 | Spacing                 | Sistema              |
| ------------------------ | ----------------------- | -------------------- |
| INPUT_CLASS              | `px-3.5 py-3`           | Tailwind (styles.js) |
| Labels                   | `mb-1`                  | Tailwind             |
| Grupos de campo          | `mb-4`                  | Tailwind             |
| Linha data grid          | `gap-3 mb-4`            | CSS                  |
| Grid checkboxes          | `gap-0.75rem` (0.75rem) | CSS                  |
| Grid equipamentos (HTML) | `gap-3 mb-4`            | Tailwind             |

### 5.3 Espaçamentos de botões e modais

| Elemento           | Spacing                 | Sistema  |
| ------------------ | ----------------------- | -------- |
| Botões (.btn)      | `padding: 10px 20px`    | CSS      |
| btn-enviar         | `padding: 0.85rem 3rem` | CSS      |
| Modal gap (botões) | `gap-2.5`               | Tailwind |
| Modal padding      | `p-7`                   | Tailwind |
| Sidebar inner      | `padding: 1rem`         | CSS      |
| Sidebar head       | `padding: 16px 20px`    | CSS      |
| Sidebar list       | `padding: 12px 8px`     | CSS      |

### 5.4 Grid gaps

| Contexto                   | Gap                  | Sistema  |
| -------------------------- | -------------------- | -------- |
| Linha data (date/time)     | `gap-3` (12px)       | CSS      |
| Grid checkbox equipamentos | `gap-0.75rem` (12px) | CSS      |
| Grid checkboxes HTML       | `gap-3` (12px)       | Tailwind |
| Preview grid               | `gap-2` (8px)        | Tailwind |
| Modal buttons              | `gap-2.5` (10px)     | Tailwind |
| Sidebar item actions       | `gap: 8px`           | CSS      |

**Problemas:**

1. `gap-2.5` (10px) nos modais vs `gap-3` (12px) nos grids — valores muito próximos
2. `gap-2` (8px) no preview grid vs `gap-3` (12px) em outros grids
3. Sidebar usa paddings em `px` (12px, 16px, 20px) enquanto o resto usa Tailwind rem

---

## 6. Sombras

| Componente          | Shadow                                                   | Sistema  |
| ------------------- | -------------------------------------------------------- | -------- |
| sec-card            | `0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)` | CSS      |
| Container           | `shadow-sm`                                              | Tailwind |
| btn-primary         | `0 3px 8px rgba(37,99,235,0.2)`                          | CSS      |
| btn-primary:hover   | `0 6px 16px rgba(37,99,235,0.25)`                        | CSS      |
| btn-primary:active  | `0 2px 6px rgba(37,99,235,0.15)`                         | CSS      |
| btn-success         | `0 3px 8px rgba(5,150,105,0.2)`                          | CSS      |
| btn-success:hover   | `0 6px 16px rgba(5,150,105,0.25)`                        | CSS      |
| btn-enviar          | `0 4px 14px rgba(5,150,105,0.3)`                         | CSS      |
| btn-enviar:hover    | `0 6px 20px rgba(5,150,105,0.4)`                         | CSS      |
| btn-new-form        | `0 3px 10px rgba(37,99,235,0.25)`                        | CSS      |
| btn-new-form:hover  | `0 5px 16px rgba(37,99,235,0.35)`                        | CSS      |
| Modal               | `shadow-xl`                                              | Tailwind |
| Toast               | `0 8px 32px rgba(0,0,0,0.18)`                            | CSS      |
| Sidebar             | `4px 0 24px rgba(0,0,0,0.12)`                            | CSS      |
| Input error         | `0 0 0 3px rgba(220,38,38,0.12)`                         | CSS      |
| Coord-refresh       | `0 1px 3px rgba(0,0,0,0.08)`                             | CSS      |
| Coord-refresh:hover | `0 2px 8px rgba(59,130,246,0.15)`                        | CSS      |

**Problemas:**

1. Sombras definidas em dois sistemas (CSS hex rgba + Tailwind `shadow-*`)
2. `btn-enviar` tem sombras diferentes de `btn-success` apesar de terem a mesma cor
3. `btn-new-form` tem sombras diferentes de `btn-primary` apesar de terem a mesma cor

---

## 7. Transições e Animações

### 7.1 Transições

| Componente             | Transition           | Duração | Easing                                        |
| ---------------------- | -------------------- | ------- | --------------------------------------------- |
| .btn                   | `all`                | 0.2s    | `cubic-bezier(0.4, 0, 0.2, 1)`                |
| .hamburger             | `all`                | 0.2s    | `ease` (default)                              |
| .toast                 | `all`                | 0.4s    | `ease`                                        |
| .sidebar               | `left`               | 0.3s    | `ease`                                        |
| .sidebar-item          | `border-color`       | 0.15s   | (default)                                     |
| .sidebar-close         | `color`              | 0.2s    | (default)                                     |
| .equip-section         | `opacity`            | 0.2s    | `ease`                                        |
| [data-condicional-ref] | `opacity, transform` | 0.25s   | `ease`                                        |
| .btn-new-form          | `all`                | 0.15s   | (default)                                     |
| .coord-refresh         | `all`                | 0.15s   | (default)                                     |
| .preview-item          | `all`                | 0.2s    | (default) — via `transition-all duration-200` |
| Input fields           | `all`                | 0.2s    | (default) — via `transition-all duration-200` |

### 7.2 Animações

| Animação       | Keyframe                      | Uso                                        |
| -------------- | ----------------------------- | ------------------------------------------ |
| `rotate-phone` | 0%→0deg, 50%→90deg, 100%→0deg | orientation-icon (2s ease-in-out infinite) |

**Problemas:**

1. **7 durações diferentes** (0.15s, 0.2s, 0.25s, 0.3s, 0.4s) sem padrão claro
2. **3 easing functions** misturadas (`ease`, `cubic-bezier(0.4,0,0.2,1)`, default)
3. Transições em `all` são custosas performance-wise — deveriam ser específicas (`opacity`, `transform`, `background-color`)

---

## 8. Estados de Campo

Sistema de 3 estados visuais para inputs, selects e textareas:

### 8.1 Estado: Não preenchido (empty)

```css
background-color: #eff6ff !important; /* blue-50 */
border-color: #2563eb !important; /* blue-600 */
border-width: 2.5px !important;
```

### 8.2 Estado: Preenchido (filled)

```css
background-color: #dcfce7 !important; /* green-100 */
border-color: #16a34a !important; /* green-500 */
border-width: 2.5px !important;
```

### 8.3 Estado: Erro (error)

```css
background-color: #fef2f2 !important; /* red-50 */
border-color: #dc2626 !important; /* red-600 */
border-width: 2.5px !important;
box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12) !important;
```

**Status:** PADRONIZADO — este é o subsystema mais consistente do projeto. Os 3 estados são claros, visualmente distintos, e usam `!important` para garantir precedência.

**Observação:** O estado "não preenchido" usa azul (não neutro), o que é uma escolha de design intencional para campo obrigatório — destaca o que precisa ser preenchido.

---

## 9. Botões

### 9.1 Classe base `.btn`

```css
padding: 10px 20px;
border: none;
border-radius: 10px;
font-size: 0.875rem; /* 14px */
font-weight: 600;
min-width: 120px;
min-height: 44px; /* Touch target acessível */
line-height: 1.5;
display: inline-flex;
align-items: center;
justify-content: center;
gap: 8px;
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
```

### 9.2 Variantes

| Classe           | Background                     | Texto                 | Shadow                | Hover                                    |
| ---------------- | ------------------------------ | --------------------- | --------------------- | ---------------------------------------- |
| `.btn-primary`   | gradient blue-500→600          | white                 | `0 3px 8px blue/0.2`  | gradient blue-600→700, translateY(-1px)  |
| `.btn-secondary` | `#f1f5f9` (slate-100)          | `#64748b` (slate-500) | none                  | `#e2e8f0` (slate-200), translateY(-1px)  |
| `.btn-success`   | gradient emerald-500→green-600 | white                 | `0 3px 8px green/0.2` | gradient green-600→700, translateY(-1px) |

### 9.3 Botão de envio `#btn-enviar` (fora do padrão `.btn`)

```css
background: linear-gradient(135deg, #059669, #047857); /* green-600→700 */
color: #fff;
border: none;
padding: 0.85rem 3rem; /* Diferente de .btn (10px 20px) */
border-radius: 30px; /* Diferente de .btn (10px) */
font-weight: 700; /* Diferente de .btn (600) */
font-size: 1rem; /* Diferente de .btn (0.875rem) */
box-shadow: 0 4px 14px rgba(5, 150, 105, 0.3);
```

**Problemas:**

1. `#btn-enviar` **não usa a classe `.btn`** — é um botão completamente separado com estilos próprios
2. `#btn-enviar` tem `border-radius: 30px` (pill) enquanto `.btn` tem `10px` (arredondado)
3. `#btn-enviar` tem `font-weight: 700` enquanto `.btn` tem `600`
4. `#btn-enviar` tem `font-size: 1rem` enquanto `.btn` tem `0.875rem`
5. `#btn-enviar` tem shadow diferente de `.btn-success` apesar de terem a mesma cor

### 9.4 Outros botões

| Botão            | Tamanho        | Border-radius | Background                     |
| ---------------- | -------------- | ------------- | ------------------------------ |
| `.btn-new-form`  | 36x36px        | 10px          | gradient blue                  |
| `.hamburger`     | 36x36px        | 10px          | `#f1f5f9` (flat)               |
| `.sidebar-btn`   | flex, 6px 12px | 8px           | flat (edit: blue, delete: red) |
| `.coord-refresh` | 36x36px        | 8px           | `#f9fafb` (flat)               |

---

## 10. Modais

### 10.1 Padrão HTML (4 modais)

Todos os modais seguem o mesmo padrão:

```html
<div class="modal-overlay fixed inset-0 bg-black/40 z-50 flex items-center justify-center hidden">
  <div class="modal bg-white rounded-[12px] p-7 max-w-[420px] w-[90%] shadow-xl text-center">
    <!-- conteúdo -->
    <div class="flex gap-2.5 justify-center">
      <button class="btn btn-secondary">Cancelar</button>
      <button class="btn btn-primary">Confirmar</button>
    </div>
  </div>
</div>
```

### 10.2 Modais existentes

| ID               | Uso                        | Botões                                     |
| ---------------- | -------------------------- | ------------------------------------------ |
| `#dup-modal`     | Confirmação de reenvio     | Cancelar (secondary) + Reenviar (primary)  |
| `#confirm-modal` | Confirmação genérica       | Cancelar (secondary) + Confirmar (primary) |
| `#update-modal`  | Notificação de atualização | OK (primary)                               |
| `#anexos-modal`  | Aviso de anexos            | Fechar (primary)                           |

**Status:** PADRONIZADO — padrão consistente de modais com overlay `bg-black/40`, card `rounded-[12px] p-7`, e botões `gap-2.5`.

---

## 11. Cards e Seções

### 11.1 Padrão `.sec-card`

```css
.sec-card {
  background: #ffffff;
  border: 2px solid #cbd5e1; /* slate-300 */
  border-radius: 14px;
  overflow: hidden;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.06);
}
```

### 11.2 Cores por seção

| Seção        | Border-color            | Border-width | sec-num bg |
| ------------ | ----------------------- | ------------ | ---------- |
| Início       | `#3b82f6` (blue-500)    | 3px          | `#3b82f6`  |
| Retorno      | `#10b981` (emerald-500) | 3px          | `#10b981`  |
| Equipamentos | `#f59e0b` (amber-500)   | **4px**      | `#f59e0b`  |
| Anexos       | `#8b5cf6` (violet-500)  | 3px          | `#8b5cf6`  |
| Revisão      | `#64748b` (slate-500)   | **2px**      | `#64748b`  |

**Problema:** `sec-equipamentos` usa border de **4px** enquanto todas as outras usam **3px** (ou 2px para revisão). Não há razão visual óbvia para essa diferença.

### 11.3 Cabeçalho `.sec-head`

```css
padding: 0.75rem 0.5rem;
font-weight: 700;
font-size: 0.9rem;
color: #0f172a;
border-bottom: 2px solid #e2e8f0;
background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
```

---

## 12. Sidebar

### 12.1 Estrutura

```
.sidebar (fixed, left: -100%, transition: left 0.3s)
  └── .sidebar-inner (flex column, padding: 1rem)
       ├── .sidebar-head (flex, padding: 16px 20px, border-bottom: 1px solid #e2e8f0)
       │    ├── .sidebar-title (1.125rem, 700, #0f172a)
       │    └── .sidebar-close (1.5rem, 700, #dc2626)
       ├── input#sidebar-filter (padding: 12px, border: 1px solid #e2e8f0, rounded: 10px)
       └── .sidebar-list (flex: 1, overflow-y: auto, padding: 12px 8px)
            └── .sidebar-item (padding: 10px 12px, border: 1px solid #e2e8f0, rounded: 10px, margin-bottom: 8px)
```

### 12.2 Padrão de item

```css
.sidebar-item {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-bottom: 8px;
  background: #f8fafc;
}
```

---

## 13. Problemas de Inconsistência

### Problema V1 — Sistema dual de estilos (CSS + Tailwind)

- **Localização:** Todo o projeto — `style.css` (hex hardcoded) + classes Tailwind no HTML/JS
- **Gravidade:** Média
- **Categoria:** Consistência / Manutenibilidade
- **Explicação:** Cores como `#2563eb` aparecem em `style.css` como hex E no HTML como `blue-600`. Sombras são definidas em CSS com `rgba()` E no HTML com `shadow-xl`. Dois sistemas paralelos para o mesmo efeito.
- **Impacto:** Duplicação de manutenção; mudar uma cor exige alterar dois lugares.
- **Como corrigir:** Migrar tudo para Tailwind (recomendado) ou tudo para CSS customizado — não os dois.

### Problema V2 — `#btn-enviar` não usa classe `.btn`

- **Localização:** `style.css`, `#btn-enviar` (linhas 146-161) vs `.btn` (linhas 174-191)
- **Gravidade:** Média
- **Categoria:** Consistência / Componentes
- **Explicação:** O botão de enviar tem estilos completamente próprios (border-radius 30px, padding 0.85rem 3rem, font-weight 700) sem herdar nada de `.btn`.
- **Impacto:** Alterações na classe `.btn` não afetam `#btn-enviar`, criando divergência.
- **Como corrigir:** Fazer `#btn-enviar` herdar de `.btn` e sobrescrever apenas o que é diferente.

### Problema V3 — 8 valores de border-radius sem hierarquia

- **Localização:** `style.css` + `index.html` — valores: 6, 8, 10, 12, 14, 20, 30, 999px
- **Gravidade:** Baixa
- **Categoria:** Design Tokens / Consistência
- **Explicação:** Não há escala definida. Valores como 10px e 12px são usados para elementos similares (campos vs modais).
- **Impacto:** Visualmente perceptível mas não crítico.
- **Como corrigir:** Definir escala: `sm=8px, md=10px, lg=12px, xl=14px, 2xl=20px, full=999px`.

### Problema V4 — 7 timings de transição sem padrão

- **Localização:** `style.css` — 0.15s, 0.2s, 0.25s, 0.3s, 0.4s
- **Gravidade:** Baixa
- **Categoria:** Design Tokens / Consistência
- **Explicação:** Não há escala de timing. Hover usa 0.15s ou 0.2s, sidebar usa 0.3s, toast usa 0.4s.
- **Impacto:** Micro-inconsistências perceptíveis em uso contínuo.
- **Como corrigir:** Definir escala: `fast=0.15s, normal=0.2s, slow=0.3s`.

### Problema V5 — `sec-equipamentos` com borda 4px

- **Localização:** `style.css`, `#sec-equipamentos` (linha 99)
- **Gravidade:** Baixa
- **Categoria:** Design Tokens / Consistência
- **Explicação:** Bordas de seções usam 2px (revisão), 3px (início/retorno/anexos) e 4px (equipamentos). A razão para 4px não é visualmente justificável.
- **Impacto:** Inconsistência visual sutil.
- **Como corrigir:** Padronizar todas as seções em 3px (ou usar 2px para todas).

### Problema V6 — Mix de `emerald-*` e `green-*` para "sucesso"

- **Localização:** `style.css` + `index.html`
- **Gravidade:** Baixa
- **Categoria:** Design Tokens / Cores
- **Explicação:** `btn-success` usa emerald-500→green-600, `toast.success` usa green-500, `input filled` usa green-500. Emerald e green são famílias diferentes do Tailwind com tons ligeiramente diferentes.
- **Impacto:** Micro-inconsistência de cor para "sucesso".
- **Como corrigir:** Padronizar em uma família (recomendado: green para consistência).

### Problema V7 — `gap-2.5` vs `gap-3` para espaçamento de botões

- **Localização:** Modais (`gap-2.5`) vs grids (`gap-3`)
- **Gravidade:** Baixa
- **Categoria:** Design Tokens / Espaçamento
- **Explicação:** 10px vs 12px — diferença de 2px que é visualmente imperceptível mas cria dois valores para o mesmo propósito.
- **Impacto:** Negligível visualmente, mas mantém dois tokens desnecessários.
- **Como corrigir:** Padronizar em `gap-3` (12px) para tudo.

---

## 14. Recomendações de Design Tokens

### 14.1 Escala de cores proposta

```css
:root {
  /* Base (Slate) */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8fafc;
  --color-bg-tertiary: #f1f5f9;
  --color-border-light: #e2e8f0;
  --color-border-default: #cbd5e1;
  --color-text-muted: #94a3b8;
  --color-text-secondary: #64748b;
  --color-text-default: #475569;
  --color-text-primary: #0f172a;

  /* Accent */
  --color-primary: #2563eb;
  --color-primary-light: #3b82f6;
  --color-primary-dark: #1d4ed8;
  --color-success: #16a34a;
  --color-success-light: #dcfce7;
  --color-error: #dc2626;
  --color-error-light: #fef2f2;
  --color-warning: #f59e0b;
  --color-info: #8b5cf6;
}
```

### 14.2 Escala de border-radius proposta

```css
:root {
  --radius-sm: 8px; /* sidebar-btn, coord-refresh */
  --radius-md: 10px; /* campos, botões, sidebar-item */
  --radius-lg: 12px; /* modais, upload area */
  --radius-xl: 14px; /* sec-card */
  --radius-2xl: 20px; /* container */
  --radius-full: 999px; /* badges pill */
}
```

### 14.3 Escala de transições proposta

```css
:root {
  --transition-fast: 0.15s ease;
  --transition-normal: 0.2s ease;
  --transition-slow: 0.3s ease;
}
```

### 14.4 Escala de sombras proposta

```css
:root {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.12);
  --shadow-xl: 0 8px 32px rgba(0, 0, 0, 0.18);
}
```

---

## 15. Tabela Resumo de Padronização

| Aspecto                       | Status                   | Nota | Observação                                           |
| ----------------------------- | ------------------------ | :--: | ---------------------------------------------------- |
| **Paleta de cores**           | Parcialmente padronizado | 7/10 | Cores semanticamente corretas, mas mix emerald/green |
| **Tipografia**                | Parcialmente padronizado | 6/10 | Inter consistente, mas muitos tamanhos sem escala    |
| **Border-radius**             | Inconsistente            | 5/10 | 8 valores sem hierarquia definida                    |
| **Espaçamentos**              | Parcialmente padronizado | 6/10 | Padrões existem mas com variações próximas           |
| **Sombras**                   | Inconsistente            | 5/10 | Dois sistemas (CSS + Tailwind), sem escala           |
| **Transições**                | Inconsistente            | 5/10 | 7 timings diferentes, 3 easings                      |
| **Estados de campo**          | Bem padronizado          | 9/10 | 3 estados claros e consistentes                      |
| **Botões**                    | Inconsistente            | 5/10 | `.btn` é consistente, `#btn-enviar` é isolado        |
| **Modais**                    | Bem padronizado          | 9/10 | Padrão HTML idêntico em 4 modais                     |
| **Cards/Seções**              | Parcialmente padronizado | 7/10 | Padrão consistente, mas border-width varia           |
| **Sidebar**                   | Bem padronizado          | 8/10 | Padrão claro de item e ações                         |
| **Sistema dual CSS/Tailwind** | Problemático             | 4/10 | Dois sistemas paralelos criam duplicação             |

### Nota geral de padronização visual: **6,3 / 10**

> O projeto tem uma base visual coerente (paleta Slate + accent colors semanticamente corretos), mas sofre com a ausência de design tokens formais e um sistema dual de estilos que cria duplicação. Os subsystemas de estados de campo e modais são exemplos de boa padronização que poderiam servir de modelo para o resto.

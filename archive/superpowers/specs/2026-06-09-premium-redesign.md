# Premium Redesign — Formulário "Retorno de Ordens"

> Abordagem escolhida: **SaaS Premium** (estilo Linear/Stripe)
> Nível de mudança: **Redesenho visual completo** (JS intacto, HTML/CSS reescritos)
> Foco: **Mobile-first**, visual sofisticado + experiência fluida

---

## 1. Identidade Visual

### 1.1 Paleta de Cores

| Função              | Cor       | Hex                         | Uso                              |
| ------------------- | --------- | --------------------------- | -------------------------------- |
| Texto principal     | Slate 900 | `#0f172a`                   | Títulos, valores de campos       |
| Texto secundário    | Slate 600 | `#475569`                   | Labels, descrições               |
| Placeholder / sutil | Slate 400 | `#94a3b8`                   | Placeholders, textos auxiliares  |
| Ação primária       | Blue 600  | `#2563eb`                   | Botão "Avançar", links, ativos   |
| Hover / destaque    | Blue 500  | `#3b82f6`                   | Hover de botões, foco            |
| Fundo sutil azul    | Blue 50   | `#eff6ff`                   | Background de campos preenchidos |
| Fundo de cards      | Slate 50  | `#f8fafc`                   | Cards, áreas secundárias         |
| Bordas leves        | Slate 200 | `#e2e8f0`                   | Bordas de inputs, dividers       |
| Bordas sutis        | Slate 100 | `#f1f5f9`                   | Borda inferior sticky bar        |
| Fundo externo       | Gradiente | `from-slate-100 to-blue-50` | Body gradient                    |
| Container           | Branco    | `#ffffff`                   | Card central                     |

### 1.2 Tipografia

- Família: **Inter** (já em uso via Google Fonts)
- Escala:
  - Título da página: 20px Bold
  - Subtítulo / label de seção: 14px SemiBold
  - Label de campo: 13px Medium
  - Valor de input: 15px Regular
  - Texto auxiliar / erro: 12px Regular
  - Botões: 14px SemiBold

### 1.3 Sombras e Elevação

| Elemento              | Sombra                                                 | Tailwind    |
| --------------------- | ------------------------------------------------------ | ----------- |
| Card / Input          | `0 1px 2px rgba(0,0,0,.04), 0 1px 3px rgba(0,0,0,.06)` | `shadow-sm` |
| Dropdown / Modal      | `0 4px 6px rgba(0,0,0,.06)`                            | `shadow-md` |
| Sticky bar (ao rolar) | `0 10px 15px rgba(0,0,0,.08)`                          | `shadow-lg` |
| Sidebar / Toast       | `0 20px 25px rgba(0,0,0,.1)`                           | `shadow-xl` |

### 1.4 Espaçamento

- Padding lateral do container: **20px** (unificado)
- Padding lateral do section-wrapper: **16px**
- Gap entre seções: **16px**
- Gap entre campos: **12px**
- Border-radius inputs: **10px**
- Border-radius cards: **12px**
- Border-radius container: **20px**

---

## 2. Layout da Página

### 2.1 Estrutura (mobile-first, max-width 640px)

```
body (bg-gradient from-slate-100 to-blue-50)
  └─ .container (bg-white, rounded-[20px], shadow-sm, border-slate-200/50, max-w-[640px])
       ├─ HEADER (flex, justify-between, px-5, pt-[14px], pb-[10px])
       │    ├─ ☰ hamburger (36×36, bg-slate-100, rounded-[10px])
       │    ├─ "Retorno de Ordens" (20px bold, tracking-tight)
       │    └─ + btn-novo (36×36, gradient blue, rounded-[10px], shadow)
       │
       ├─ STICKY BAR (sticky, top-0, z-10, bg-white/85, backdrop-blur, px-5, pb-3, border-b-slate-100)
       │    ├─ Step pills (flex, gap-[6px])
       │    │    └─ 5× .step-pill (flex-1, text-center, py-2, rounded-[10px])
       │    │         ├─ .active → bg-blue-600, text-white, font-bold, text-[11px] uppercase
       │    │         └─ .inactive → bg-slate-100, text-slate-500, font-semibold, text-[11px] uppercase
       │    └─ NAV BUTTONS (flex, justify-between, items-center, gap-3)
       │         ├─ #btn-anterior (btn-secondary: bg-slate-100, text-slate-500, rounded-[10px], h-[44px])
       │         ├─ #step-current-text (text-[13px], font-bold, text-blue-700, flex-1, text-center)
       │         └─ #btn-proximo (btn-primary: gradient blue, text-white, rounded-[10px], h-[44px], shadow)
       │
       ├─ ERROR MSG (bg-red-50, text-red-600, px-4, py-3, rounded-[10px], hidden)
       │
       └─ #section-wrapper (flex-1, overflow-y-auto, px-4)
            └─ 5× .section (display:none / .active → display:block)
                 ├─ #section-1 (Iniciais)
                 ├─ #section-2 (Equipamentos)
                 ├─ #section-3 (Retorno)
                 ├─ #section-4 (Anexos)
                 └─ #section-5 (Revisão)
```

### 2.2 Header

| Elemento  | Tamanho   | Fundo                                | Borda            | Sombra                           |
| --------- | --------- | ------------------------------------ | ---------------- | -------------------------------- |
| Hamburger | 36×36px   | `#f1f5f9`                            | `rounded-[10px]` | —                                |
| Título    | 20px bold | —                                    | —                | —                                |
| Botão +   | 36×36px   | `gradient(135deg, #3b82f6, #2563eb)` | `rounded-[10px]` | `0 3px 10px rgba(37,99,235,.25)` |

Os três elementos mantêm `justify-between` no header flex.

### 2.3 Sticky Bar

- **Steps**: formato pill segment (estilo iOS segmented control), 5 itens com `flex-1`.
  - Item ativo: fundo `#2563eb`, texto branco, peso 700
  - Item inativo: fundo `#f1f5f9`, texto `#64748b`, peso 600
  - Texto em **UPPERCASE**, 11px, letter-spacing `.3px`
- **Botões de navegação**: na linha abaixo dos steps.
  - "Anterior": fundo `#f1f5f9`, texto `#64748b` — `opacity: 0.4` quando disabled
  - "Avançar": gradiente azul, texto branco — sombra sutil
  - Texto do passo atual: 13px bold, `#1d4ed8`, centralizado
- Sombra só aparece ao rolar (controle via JS/IntersectionObserver).

### 2.4 Section Wrapper

- `flex: 1; overflow-y: auto; min-height: 0; padding: 0 16px`
- Transições de seção mantidas (slideOutLeft, slideOutRight, enterFromRight, enterFromLeft — 0.25s ease)

### 2.5 Responsivo

- **Mobile-first**: estilos base = mobile (< 640px). Media queries com `min-width: 640px` para ajustes.
- Breakpoint único: `@media (min-width: 640px)` — padding mais generoso, grid de 4 colunas no preview.

---

## 3. Componentes

### 3.1 Botões

- Alvo de toque mínimo: **44px altura** (Apple HIG / WCAG)
- `border-radius: 10px`, `font-size: 14px`, `font-weight: 600`
- Transição: `0.2s cubic-bezier(0.4, 0, 0.2, 1)`
- Hover: `translateY(-1px)` + sombra elevada
- Active (mobile): `translateY(1px)` (feedback tátil sem hover)
- Disabled: `opacity: 0.4`, `cursor: not-allowed`
- Variantes:
  - `.btn-primary`: gradiente blue 135deg, texto branco
  - `.btn-secondary`: fundo `#f1f5f9` / borda `#e2e8f0`, texto `#475569`
  - `.btn-success` (manter): gradiente green, texto branco

### 3.2 Inputs e Selects

- `min-height: 44px`, `padding: 12px 14px`, `border-radius: 10px`
- Borda: `1.5px solid #e2e8f0` (mais visível que 1px)
- Foco: `box-shadow: 0 0 0 4px rgba(37,99,235,.1)`, `border-color: #3b82f6`
- Label sempre **acima** do campo (nunca como placeholder), 13px Medium
- Estado `.is-filled`: fundo `#eff6ff`, borda `#2563eb` 2.5px
- Estado `.error`: borda `#dc2626`, `box-shadow: 0 0 0 3px rgba(220,38,38,.12)`

### 3.3 Upload de Imagens (Section 4)

- Área de upload: `border: 2px dashed #e2e8f0`, `border-radius: 12px`, `min-height: 120px`
- Hover: `border-color: #3b82f6`, fundo `#eff6ff`
- Preview grid: `grid-cols-2` (mobile), `grid-cols-4` (640px+) com `gap: 8px`

### 3.4 Step Indicators (Pill Segments)

- Cada step é um `<div>` com `flex-1`, `text-align: center`, `padding: 8px 0`
- Estado ativo: `background: #2563eb`, `color: #fff`, `font-weight: 700`, `border-radius: 10px`
- Estado inativo: `background: #f1f5f9`, `color: #64748b`, `font-weight: 600`
- Transição de cor entre steps: `0.2s ease`

### 3.5 Toast

- Mantido: fixo no bottom, `#1f2937`, `border-radius: 8px`
- Slide-up com `0.4s ease`
- Variante `.success`: fundo `#16a34a`

### 3.6 Modais

- Backdrop: `bg-black/40`, `z-50`
- Card: `bg-white`, `rounded-xl`, `max-w-[420px]`, `p-7`
- Animações: fade + scale (0.2s) - mantidas

---

## 4. Micro-interações e Animações

| Elemento           | Comportamento                      | Duração |
| ------------------ | ---------------------------------- | ------- |
| Transição de seção | Slide horizontal (já implementado) | 0.25s   |
| Hover botão        | `translateY(-1px)` + sombra        | 0.2s    |
| Active/tap botão   | `translateY(1px)`                  | 0.1s    |
| Foco input         | Ring azul + borda azul             | 0.15s   |
| Toast              | Slide-up do bottom                 | 0.4s    |
| Step pill ativo    | Troca de cor                       | 0.2s    |
| Sticky bar shadow  | Aparece ao rolar                   | 0.2s    |

---

## 5. O que NÃO muda (mantido do original)

- Toda a lógica JavaScript em `scripts/` (app.js, state.js, validation.js, etc.)
- Estrutura de módulos ES6
- Sistema de IndexedDB (`db.js`)
- Funcionalidade de PWA (sw.js, manifest.json)
- Imagem compression (compress.js, utils.js)
- Fluxo de 5 seções
- Navegação via `sectionManager.js`
- Persistência automática em localStorage
- Envio via `netlify/functions/send.js`
- Tema de cores nos modais e sidebar (apenas ajustes pontuais)

---

## 6. Arquivos a modificar

| Arquivo          | Tipo de mudança                                                        |
| ---------------- | ---------------------------------------------------------------------- |
| `index.html`     | Reescrever estrutura HTML (classes Tailwind, novo layout)              |
| `style.css`      | Reescrever regras CSS: cores, botões, inputs, steps, container, header |
| `tailwind.css`   | Regenerar via `npm run build:css` se houver novas classes              |
| `sw.js`          | Incrementar `CACHE_NAME` (PWA update)                                  |
| `scripts/dom.js` | Se houver novos seletores de DOM                                       |
| `scripts/ui.js`  | Se houver novos padrões de erro/toast                                  |

---

## 7. Critérios de sucesso

1. Visual premium e profissional (aprovado visualmente)
2. Mobile-first: usável em telas de 320px a 640px+ sem quebras
3. Alvo de toque mínimo 44px em todos os elementos interativos
4. Todas as funcionalidades JS intactas (nenhuma regressão)
5. Transições suaves e consistentes (0.2s-0.25s)
6. Código CSS limpo, sem duplicação, seguindo o sistema de design acima

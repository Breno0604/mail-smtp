# Plano: Análise de Padronização Visual (Cores, Fontes, Campos, Bordas, Espaçamentos)

## Contexto

O usuário quer uma análise detalhada da padronização de design tokens: cores, fontes, campos, bordas, espaçamentos, sombras, transições e padrões visuais do projeto.

## Análise já realizada (leitura de todos os arquivos de estilo)

### Arquivos analisados

- `style.css` (755 linhas) — CSS customizado principal
- `tailwind-input.css` (3 linhas) — Entry point do Tailwind
- `tailwind.css` — Tailwind compilado (estático)
- `scripts/styles.js` (8 linhas) — Constantes de classes compartilhadas
- `index.html` — Classes Tailwind inline (92 ocorrências de `class=`)
- Todos os arquivos JS em `scripts/` — 76 ocorrências de `className`/`classList`/`.style`

### Achados principais identificados

**CORES:**

- Paleta Tailwind Slate como base (#f8fafc, #f1f5f9, #e2e8f0, #cbd5e1, #94a3b8, #64748b, #475569, #0f172a)
- Azul primário: #2563eb, #3b82f6 (Tailwind blue-600/500)
- Verde sucesso: #059669, #10b981, #16a34a (emerald/green)
- Vermelho erro: #dc2626, #b91c1c (red-600/700)
- Âmbar alerta: #f59e0b (amber-500)
- Roxo anexos: #8b5cf6 (violet-500)
- INCONSISTÊNCIA: Cores definidas em `style.css` como hex hardcoded E em `index.html` como classes Tailwind — dois sistemas paralelos

**FONTES:**

- Inter (Google Fonts) como família primária, com fallback stack
- Pesos usados: 400, 500, 600, 700
- INCONSISTÊNCIA: `font-weight: 700` hardcodado no CSS E classes Tailwind `font-bold`/`font-semibold` no HTML

**BORDAS (border-radius):**

- Usados: 6px, 8px, 10px, 12px, 14px, 20px, 30px, 999px
- INCONSISTÊNCIA: `rounded-[10px]` no Tailwind E `border-radius: 10px` no CSS — mesmo valor, dois sistemas
- `rounded-[12px]` em modais/upload, `rounded-[10px]` em campos, `rounded-[20px]` no container — valores inconsistentes para elementos similares

**ESPAÇAMENTOS:**

- `mx-2.5 mt-4` (10px horizontal, 16px top) nas seções
- `px-5 pt-3.5 pb-2.5` no header
- `px-3.5 py-3` nos campos (INPUT_CLASS)
- `gap-3` em grids, `gap-2.5` em botões de modal
- INCONSISTÊNCIA: `gap-3` vs `gap-2.5` — valores muito próximos mas diferentes

**SOMBRAS:**

- Cards: `0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)` (style.css)
- Container: `shadow-sm` (Tailwind)
- Botões: `0 3px 8px rgba(37,99,235,0.2)` (primário)
- Modais: `shadow-xl` (Tailwind)
- INCONSISTÊNCIA: Sombras definidas em dois sistemas

**TRANSIÇÕES:**

- `transition: all 0.2s` (botões, hamburger)
- `transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)` (.btn)
- `transition: all 0.4s ease` (toast)
- `transition: left 0.3s ease` (sidebar)
- `transition: opacity 0.25s ease, transform 0.25s ease` (campos condicionais)
- `transition: border-color 0.15s` (sidebar items)
- `transition: all 0.15s` (btn-new-form, coord-refresh)
- INCONSISTÊNCIA: Timing functions e durações variam entre 0.15s e 0.4s sem padrão claro

**ESTADOS DE CAMPO (3 estados visuais):**

- Não preenchido: bg #eff6ff, border #2563eb, width 2.5px
- Preenchido: bg #dcfce7, border #16a34a, width 2.5px
- Erro: bg #fef2f2, border #dc2626, width 2.5px + box-shadow
- PADRONIZADO ✓ — sistema consistente de 3 estados

**BOTÕES:**

- `.btn` base: padding 10px 20px, border-radius 10px, min-height 44px
- `.btn-primary`: gradient blue
- `.btn-secondary`: flat #f1f5f9
- `.btn-success`: gradient green
- `#btn-enviar`: override separado com border-radius 30px, padding 0.85rem 3rem
- INCONSISTÊNCIA: `#btn-enviar` não usa classe `.btn`, tem border-radius 30px vs 10px dos outros

**MODAIS:**

- 4 modais no HTML com classes idênticas
- PADRONIZADO ✓ — padrão consistente de modais

**PROBLEMA PRINCIPAL: SISTEMA DUAL DE ESTILOS**

- Metade do estilo em `style.css` (CSS customizado com hex colors)
- Metade em classes Tailwind inline no HTML e JS
- Dois sistemas paralelos criam duplicação e risco de divergência

## Arquivo a ser criado

- `C:\web-projects\mail\analise-visual.md` — Análise completa de padronização visual

## Estrutura do documento

1. Resumo executivo
2. Paleta de cores (mapeamento completo)
3. Tipografia
4. Bordas e border-radius
5. Espaçamentos
6. Sombras
7. Transições e animações
8. Estados de campo
9. Botões
10. Modais
11. Cards/Seções
12. Problemas de inconsistência (cada um com localização, gravidade, correção)
13. Recomendações de Design Tokens
14. Tabela resumo de padronização

## Verificação

- Documento deve mapear CADA cor, fonte, border-radius, spacing e shadow usados no projeto
- Identificar todas as inconsistências entre CSS customizado e Tailwind
- Propor design tokens para unificar o sistema

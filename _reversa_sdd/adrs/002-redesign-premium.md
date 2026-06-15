# ADR 002: Redesign Visual SaaS Premium

**Data:** 2026-06-09
**Confiança:** 🟢 CONFIRMADO

## Contexto

O sistema precisava de uma reformulação visual para se adequar a um padrão "SaaS Premium" — mais moderno, com melhor contraste, tipografia refinada e micro-interações.

## Decisão

Adotar um redesign completo com:
- Paleta de cores azul corporativo
- Cards com bordas suaves e sombras
- Tipografia mais refinada (text-[13px], font-semibold)
- Botões com gradientes e bordas arredondadas
- Microanimações de hover/focus em elementos interativos
- Classes CSS via Tailwind + custom CSS para estados de campo (preenchido, erro, foco)

## Alternativas Consideradas

- **Manter design original**: Rejeitado — interface parecia amadora
- **Framework CSS completo (Bootstrap)**: Rejeitado para não adicionar dependência; Tailwind já era usado

## Consequências

- Positivas:
  - Interface mais profissional e agradável
  - Estados de campo claros: azul (preenchido), verde (foco), vermelho (erro)
  - Botão "Novo Formulário" com gradiente azul destaca ação principal
  - Live preview do email integrado ao layout
- Negativas:
  - Múltiplos bumps de cache do Service Worker (v40→v41→v42→v45→v46→v47→v48→v49)
  - Constantes ajustes de padding/margin (pelo menos 10 commits de refinamento)
  - Tailwind purge removia classes dinâmicas — exigiu inline styles (ex: `padding-top: 120px`)

## Commits Relacionados

- `7ad578d` feat: SaaS Premium redesign — visual overhaul (closes #premium-redesign)
- `e9fcba3` feat: redesign index.html with SaaS Premium layout
- `14010b9` style: rewrite style.css with SaaS Premium design system
- `f6ede3a` style: update JS module CSS classes for premium design
- Múltiplos commits de refinamento de spacing (05b4bc6, 2123faa, 6162092, etc.)

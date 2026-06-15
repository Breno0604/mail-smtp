# ADR 001: Migração de Wizard Multietapas para Layout Single-Page

**Data:** 2026-06-09
**Confiança:** 🟢 CONFIRMADO (extraído do git log e mudanças nos fontes)

## Contexto

Originalmente, o formulário era dividido em etapas (wizard) com navegação "Anterior/Próximo/Pular", utilizando `animator.js` e `sectionManager.js`. Cada etapa era uma "seção" do formulário que aparecia/desaparecia com animações. O estado do wizard incluía `currentSection`, `animating`, e `visitedRetorno`.

## Decisão

Substituir o wizard por um layout **single-page** onde todas as 5 seções (Início, Retorno, Equipamentos, Anexos, Revisão) são exibidas simultaneamente em cards verticais.

## Alternativas Consideradas

- **Manter wizard**: Rejeitado porque a navegação entre etapas era confusa para usuários de campo
- **Single-page com abas**: Rejeitado porque abas escondem conteúdo; o requisito era visibilidade total

## Consequências

- Positivas:
  - Fim da lógica de navegação com estado complexo (`currentSection`, `animating`)
  - Live preview do email sempre visível — usuário vê o email sendo montado em tempo real
  - Código mais simples: `sectionManager.js` e `animator.js` removidos
  - Rolagem suave para primeiro erro na validação
- Negativas:
  - Formulário mais longo verticalmente — requer rolagem em dispositivos móveis
  - Perdeu-se a barra de progresso passo-a-passo

## Commits Relacionados

- `e269d61` feat: replace wizard with single-page section layout
- `c3b814a` chore: remove obsolete wizard modules (sectionManager, animator)
- `6053d2a` refactor: remove wizard state (currentSection, animating, visitedRetorno)
- `01b1a3a` feat: rewrite app.js for single-page layout with live preview
- `5001539` feat: email.js uses dynamic retorno fields, add live preview

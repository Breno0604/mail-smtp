---
schemaVersion: 1
generatedAt: 2026-06-15T17:25:00-03:00
reversa:
  version: "1.2.43"
kind: migration_brief
producedBy: orchestrator
hash: "sha256:eb8e2f4a7d42c23e7b891f8d8e45f6d8e3b2c1a9f7e6d5c4b3a2f1e0d9c8b7a"
---

# Migration Brief

> Documento de critério de migração coletado em entrevista no início do `/reversa-migrate`.
> Consumido pelos seis agentes do Time de Migração.

## Objetivo da migração

Permitir a adição de novas páginas e funcionalidades futuras (especialmente novos campos) que a stack atual (Vanilla JS ES6 modules) limita em escalabilidade e manutenibilidade. A migração para Vue 3 + Vite + TypeScript viabiliza o crescimento do sistema sem aumentar a dívida técnica.

## Métricas de sucesso

- **Funcionalidades**: 100% das funcionalidades existentes preservadas sem regressão
- **Performance**: tempo de carregamento e interação igual ou melhor que o legado
- **Visual**: mesma aparência — o usuário não deve notar diferença visual
- **Cobertura de testes**: mínimo 334 testes mantidos (atuais), preferencialmente expandidos
- **Paridade de comportamento**: usuário final não percebe que a stack mudou

## Restrições

- **Prazo**: sem prazo fixo definido
- **Orçamento**: sem restrição financeira declarada
- **Técnicas**: versões de frameworks devem ser estáveis e compatíveis entre si (evitar bleeding edge); manter IndexedDB como fonte de verdade local (sem Supabase)
- **Operacionais**: sem janelas de manutenção definidas

## Fatores de risco conhecidos

- **Versões de frameworks**: escolher versões estáveis (não as mais recentes) e garantir compatibilidade entre Vue 3, Vite, TypeScript e demais dependências
- **Curva de aprendizado**: sem impacto (único desenvolvedor)

## Stakeholders

| Nome / papel | Responsabilidade na migração |
|---|---|
| Breno (único desenvolvedor) | Decisor, implementador, revisor |

## Stack alvo

- **Linguagem**: TypeScript strict
- **Framework**: Vue 3 (Composition API) + Vite
- **CSS**: Tailwind CSS (via PostCSS, não CDN)
- **Testes**: Vitest + @testing-library/vue
- **Persistência**: IndexedDB (mantido, sem Supabase)
- **Estado**: Pinia
- **Backend**: Netlify Functions (Node.js + nodemailer, mantido)
- **PWA**: vite-plugin-pwa + Workbox (substitui sw.js manual)
- **Roteamento**: Vue Router
- **Deploy**: Netlify (mantido)

## Escopo declarado

- **Incluído**: todos os 23 módulos frontend (`scripts/`) + 1 função backend (`netlify/functions/send.js`)
- **Excluído**: Supabase (não faz parte do escopo atual do projeto)

## Notas livres

- O projeto legado tem 1.889 LOC, 0 ciclos de dependência, 84 arestas de importação
- O schema do IndexedDB é v3 com dois stores: `records` (keyPath: uuid) e `attachments` (keyPath: id, índice em uuid)
- O Service Worker atual usa `CACHE_NAME` manual que precisa ser bumpado em mudanças de static assets
- 334 testes existentes com Vitest + jsdom
- Complexidade máxima no módulo `validation.js` (8.4)

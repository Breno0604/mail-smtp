# ADR 006: Estratégia de Cache do Service Worker (Cache-First)

**Data:** Desde o início do projeto (junho 2026)
**Confiança:** 🟢 CONFIRMADO

## Contexto

A aplicação é um SPA (Single Page Application) que precisa funcionar offline em campo, onde técnicos podem não ter conectividade de rede. O Service Worker gerencia o cache de assets estáticos.

## Decisão

Adotar estratégia **cache-first** para todos os assets estáticos (HTML, CSS, JS, imagens, fontes):
1. Service Worker intercepta fetch requests
2. Primeiro tenta servir do cache (`CACHE_NAME`)
3. Se não encontrado no cache, busca na rede e armazena para próximas requisições
4. `CACHE_NAME` versionado manualmente: `retorno-v{n}`

## Alternativas Consideradas

- **Network-first**: Rejeitado — app precisa funcionar offline, prioridade é disponibilidade
- **Stale-while-revalidate**: Rejeitado — assets estáticos não mudam com frequência suficiente para justificar revalidação
- **Apenas cache de navegador**: Rejeitado — sem controle fino sobre o que fica disponível offline

## Consequências

- Positivas:
  - App funcional offline — técnicos podem preencher OS sem internet
  - Atualizações controladas pelo versionamento do cache
  - Modal de atualização via `sw-update.js` quando novo SW detectado
- Negativas:
  - Bump manual do `CACHE_NAME` para cada alteração em assets estáticos (~20 bumps no histórico)
  - Esquecer de bumpar o cache = usuários com versão desatualizada
  - Tailwind purge removia classes dinâmicas — exigiu workaround com inline styles

## Histórico de Bumps no Git

| Cache | Commit | Motivo |
|-------|--------|--------|
| v16→v21 | 6506af4 | Layout changes + implementers |
| v21→v22 | 91452ba | Static asset changes |
| v22→v35 | 9b2f63b | Múltiplas mudanças de layout |
| v35→v36 | d31f51d | Inline style and tailwind rebuild |
| v36→v40 | a100879 | Premium redesign |
| v40→v41 | a100879 | Premium redesign (continuado) |
| v41→v42 | 7aab929 | Static files changed |
| v42→v45 | 7c5d826 | Single-page UI |
| v45→v46 | 7c5d826 | Single-page UI (continuado) |
| v46→v47 | bcfb4b8 | CSS spacing changes |
| v47→v48 | 737daa5 | Section padding (12px) |
| v48→v49 | 6849b16 | Section padding (8px) |
| v49→v60 | aa0c2cd | Múltiplas mudanças recentes |

## Commits Relacionados

- `sw.js` — Definição do cache
- `scripts/sw-update.js` — Gerenciamento de atualização
- Múltiplos commits de bump (ver tabela acima)

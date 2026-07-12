# Correções Críticas (Itens 2–10) — Plano de Implementação

> **Para agentes:** Use superpowers:executing-plans para implementar este plano tarefa-por-tarefa. Steps usam checkbox (- [ ]) para tracking.

**Meta:** Corrigir as 9 vulnerabilidades críticas do relatório de análise (excluindo rejectUnauthorized: false, que requer verificação prévia de infraestrutura SMTP).

**Arquitetura:** Correções pontuais em arquivos existentes:

- netlify/functions/send.js — backend (itens 2, 3, 4)
- scripts/send.js — frontend (item 4)
- sw.js — service worker (itens 8, 9)
- index.html — acessibilidade (item 5)
- style.css — CSS (item 6)
- package.json — dependências (item 10)
- tests/ — infraestrutura de testes (item 7)

**Tech Stack:** Node.js (Netlify Functions), vanilla JS ES6 modules, Tailwind CSS 3, Vitest + jsdom

---

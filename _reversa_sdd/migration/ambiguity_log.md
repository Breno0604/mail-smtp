---
schemaVersion: 1
generatedAt: 2026-06-15T17:35:00-03:00
reversa:
  version: "1.2.43"
kind: ambiguity_log
producedBy: curator
hash: "sha256:e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5"
---

# Ambiguity Log

> Registro de itens ambíguos, pendentes ou que precisaram de decisão humana.
> Atualizado por cada agente do Time de Migração.

## PENDENTES

### BR-HUMANA-001 — Autenticação no Service Worker
- **Origem**: `_reversa_sdd/gaps.md` § Lacuna 1
- **Decisão necessária**: O Service Worker atual não tem autenticação. O legado é single-user. Adicionar auth agora ou manter sem?
- **Opções**: (A) Manter single-user sem auth / (B) Adicionar auth preparando multi-usuário
- **Recomendação do Curator**: (A)
- **Responsável**: Breno

### BR-HUMANA-002 — Testes de backend (send.js)
- **Origem**: `_reversa_sdd/gaps.md` § Lacuna 3
- **Decisão necessária**: Como tratar a falta de testes na função de envio de email?
- **Opções**: (A) Manter sem testes / (B) Mock nodemailer / (C) Extrair composição de email como função pura testável
- **Recomendação do Curator**: (C)
- **Responsável**: Breno

## RESOLVIDOS COM DECISÃO HUMANA

### BR-HUMANA-001 — Autenticação no Service Worker
- **Decisão**: (A) Manter single-user sem autenticação (igual ao legado)
- **Decisor**: Breno
- **Data**: 2026-06-15
- **Impacto**: vite-plugin-pwa configurado sem autenticação; cache-first com fallback de rede

### BR-HUMANA-002 — Testes de backend (send.js)
- **Decisão**: (C) Extrair `comporEmail()` como função pura TypeScript testável; transporte SMTP permanece sem teste de integração
- **Decisor**: Breno
- **Data**: 2026-06-15
- **Impacto**: `send.ts` terá duas camadas: `comporEmail()` (pura, testável) + `enviarEmail()` (transporte)

## REFERIDOS À CODIFICAÇÃO

*(Nenhum ainda)*

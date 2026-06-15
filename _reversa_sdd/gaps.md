# Lacunas — mail-mvp

> Gerado pelo Revisor em 2026-06-15
> Categorização por severidade: 🔴 Crítico | 🟡 Moderado | 🟢 Cosmético

---

## 🔴 Críticas

Nenhuma lacuna crítica identificada. Todas as regras de negócio foram confirmadas diretamente no código.

---

## 🟡 Moderadas

### NM-01: Netlify Function sem autenticação

**Arquivo:** `netlify/functions/send.js`
**Problema:** A função aceita POST de qualquer origem sem qualquer validação de token, API key ou origem.
**Impacto:** Qualquer pessoa pode disparar emails pelo relay SMTP se descobrir a URL da função.
**Sugestão:** Adicionar validação de header `X-API-Key` ou token JWT.

### NM-02: CACHE_NAME do SW versionado manualmente

**Arquivo:** `sw.js:1`
**Problema:** `const CACHE_NAME = 'retorno-v60'` — o número é incrementado manualmente. Risco de esquecer ao modificar assets.
**Impacto:** Usuários podem ficar com cache desatualizado (assets velhos) se CACHE_NAME não for bumpado.
**Sugestão:** Automatizar via build script (ex: gerar hash dos assets e incluir no nome do cache).

### NM-03: Backend send.js sem cobertura de testes

**Arquivo:** `netlify/functions/send.js`
**Problema:** A Netlify Function não é testada em CI porque SMTP não está disponível. Testes existentes cobrem apenas frontend.
**Impacto:** Mudanças no backend podem quebrar o envio sem detecção.
**Sugestão:** Adicionar mock do nodemailer + vitest para testar validações e fluxos de erro.

---

## 🟢 Cosméticas

### NC-01: Definição de campos em JS puro

**Arquivo:** `scripts/fields.js`
**Problema:** Schema dos 41 tipos de ordem é definido como objeto JS literal, sem validação de tipo estática.
**Sugestão:** Considerar TypeScript ou schema validator (zod, yup) para validar a estrutura dos field definitions.

### NC-02: Sem concorrência no IndexedDB

**Arquivo:** `scripts/db.js`
**Problema:** Operações do IndexedDB não gerenciam concorrência (múltiplas abas podem conflitar).
**Sugestão:** Usar `versionchange` event ou BroadcastChannel para sincronizar entre abas.

---

*Fim do relatório de lacunas.*

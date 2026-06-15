---
schemaVersion: 1
generatedAt: 2026-06-15T17:40:00-03:00
reversa:
  version: "1.2.43"
kind: risk_register
producedBy: strategist
hash: "sha256:b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"
---

# Risk Register

> Registro de riscos da migração com probabilidade, impacto, mitigação e responsável.

---

## Riscos

### RISK-001 — Regressão de funcionalidade no Big Bang
- **Descrição**: Ao substituir todo o código de uma vez, alguma funcionalidade existente pode ser perdida ou comportar-se diferente
- **Categoria**: técnico
- **Probabilidade**: média
- **Impacto**: alto
- **Severidade combinada**: alta
- **Trigger / sinal de alerta**: Testes de regressão falham; usuário reporta diferença
- **Mitigação**: Manter os 334 testes existentes como baseline; migrar testes em paralelo com o código; usar deploy preview do Netlify para validação antes do corte; criar parity_specs.md (Inspector)
- **Plano de contingência**: Rollback no Netlify (1 clique); corrigir e tentar novamente
- **Owner**: Breno
- **Status**: mitigando

### RISK-002 — Incompatibilidade de versões de framework
- **Descrição**: Vue 3, Vite, TypeScript, Pinia e dependências podem ter versões incompatíveis entre si
- **Categoria**: técnico
- **Probabilidade**: baixa
- **Impacto**: alto
- **Severidade combinada**: média
- **Trigger / sinal de alerta**: `npm install` falha; erros de tipo em tempo de compilação
- **Mitigação**: Usar versões LTS/estáveis de cada framework (Vue 3.3+, Vite 5, TypeScript 5.4, Pinia 2); verificar compatibilidade no `package.json` antes de começar
- **Plano de contingência**: Atualizar/downgrade de dependências com base em erro específico
- **Owner**: Breno
- **Status**: mitigando

### RISK-003 — Perda de dados no IndexedDB durante migração de schema
- **Descrição**: O schema do IndexedDB pode precisar de ajustes (ex: novos stores, campos adicionais). Migração pode corromper dados existentes.
- **Categoria**: técnico
- **Probabilidade**: baixa
- **Impacto**: crítico (perda de registros de OS)
- **Severidade combinada**: alta
- **Trigger / sinal de alerta**: `onupgradeneeded` falha; registros somem após abrir nova versão
- **Mitigação**: Testar migração de schema em staging com réplica dos dados; manter backup em localStorage como fallback (já existe no legado); versionamento semântico de schema
- **Plano de contingência**: Restaurar de backup; pular versão de schema problemática
- **Owner**: Breno
- **Status**: mitigando

### RISK-004 — Curva de aprendizado da nova stack
- **Descrição**: TypeScript + Vue 3 Composition API + Pinia + Vite podem exigir tempo de aprendizado, atrasando a migração
- **Categoria**: organizacional
- **Probabilidade**: baixa (único desenvolvedor, já optou pela stack)
- **Impacto**: médio (atraso no cronograma)
- **Severidade combinada**: baixa
- **Trigger / sinal de alerta**: Primeiras tarefas demoram mais que o estimado
- **Mitigação**: Fase 1 do roadmap (scaffold) serve como aprendizado; começar com componentes simples
- **Plano de contingência**: Sem prazo fixo — não há urgência
- **Owner**: Breno
- **Status**: aceito

### RISK-005 — Service Worker com cache de versões antigas
- **Descrição**: O Service Worker atual tem CACHE_NAME manual. O novo (vite-plugin-pwa) precisa substituir corretamente sem servir HTML/JS antigo.
- **Categoria**: técnico
- **Probabilidade**: média
- **Impacto**: médio (usuário vê versão antiga após deploy)
- **Severidade combinada**: média
- **Trigger / sinal de alerta**: Usuário reporta tela "presa" na versão antiga
- **Mitigação**: Configurar `skipWaiting: true` + `clientsClaim: true` no vite-plugin-pwa; testar em deploy preview antes do corte
- **Plano de contingência**: Usuário limpar cache do navegador; instrução documentada
- **Owner**: Breno
- **Status**: mitigando

### RISK-006 — Envio de email quebra na nova função Netlify
- **Descrição**: A migração da Netlify Function `send.js` para TypeScript pode introduzir erro de configuração SMTP
- **Categoria**: técnico
- **Probabilidade**: média
- **Impacto**: alto (OS sem envio de email)
- **Severidade combinada**: alta
- **Trigger / sinal de alerta**: Logs da Netlify Function mostram erro de conexão SMTP; email não chega
- **Mitigação**: Extrair `comporEmail()` como função pura testável (decisão BR-HUMANA-002); manter `send.js` original como fallback; testar com nodemailer real em staging
- **Plano de contingência**: Reverter `send.ts` para `send.js` original; debug da configuração SMTP
- **Owner**: Breno
- **Status**: mitigando

---

## Resumo por severidade

| Severidade | Quantidade | IDs |
|---|---|---|
| Crítica | 0 | — |
| Alta | 3 | RISK-001, RISK-003, RISK-006 |
| Média | 2 | RISK-002, RISK-005 |
| Baixa | 1 | RISK-004 |

---

## Riscos relacionados ao paradigma alvo

| ID | Descrição | Origem no gap de paradigma |
|---|---|---|
| RISK-001 | Regressão de funcionalidade | A mudança de manipulação DOM manual para templates reativos pode esconder bugs de renderização |
| RISK-005 | Cache do Service Worker | A substituição do sw.js manual pelo vite-plugin-pwa + Workbox pode causar conflito de versionamento |
| RISK-006 | Quebra no envio de email | A separação de `comporEmail()` + `enviarEmail()` é uma consequência direta da decisão de extrair lógica pura (paradigma funcional leve) |

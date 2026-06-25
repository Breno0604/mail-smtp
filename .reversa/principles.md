# Princípios do Projeto — Mail MVP

> Estabelecidos em 2026-06-16.
> Princípios são regras duradouras que orientam todas as decisões de design, arquitetura e implementação.
> Mudam raramente e influenciam todos os artefatos do projeto.

---

## Princípios Ativos

### I — Preservação de Dados

**Descrição:**
Nenhum dado preenchido pelo usuário é perdido, mesmo em caso de fechamento acidental, queda de energia ou troca de aba. O salvamento é automático (debounced a 1s) em IndexedDB com backup em localStorage, e a restauração é transparente ao reabrir a página. Registros enviados são preservados com status "enviado" — nunca sobrescritos. A exclusão só acontece com ação explícita do usuário.

**Exemplo concreto:**
Um inspetor preenche o formulário por 20 minutos, anexa 3 fotos, o navegador fecha sem querer. Ao reabrir a página, todos os campos, anexos e o tipo de ordem estão exatamente como antes.

**Criado em:** 2026-06-16

---

### II — Resiliência Offline

**Descrição:**
Todas as funções críticas — preenchimento, salvamento, edição, visualização e exclusão de registros — operam sem qualquer dependência de rede. O Service Worker (cache-first) garante que o app carregue mesmo offline. A única operação que requer internet é o envio do e-mail. O estado do formulário nunca depende de uma resposta do servidor.

**Exemplo concreto:**
Um técnico em campo sem sinal de celular abre o app (já carregado antes), preenche um RO de Ligação Nova com 5 fotos, salva e fecha. Ao chegar no escritório com Wi-Fi, o registro está lá para ser enviado.

**Criado em:** 2026-06-16

---

### III — Simplicidade

**Descrição:**
O stack é deliberadamente minimalista: HTML semântico, CSS com Tailwind estático (pré-compilado, sem bundler), JavaScript vanilla em ES6 modules. Zero frameworks reativos, zero bundlers, zero transpiladores, zero dependências de build. Testes com Vitest + jsdom sem configuração adicional. Deploy é `git push` para Netlify. Qualquer proposta de nova dependência ou ferramenta de build precisa ser justificada por uma necessidade concreta que o stack atual não atende.

**Exemplo concreto:**
Um desenvolvedor novo baixa o repositório, roda `npm install`, `npx netlify dev`, e em 30 segundos está editando código. Para adicionar um campo de retorno, edita um array em `fields.js` — sem migração, sem rebuild, sem configurar rota.

**Criado em:** 2026-06-16

---

## Impacto

Os princípios acima influenciam os seguintes templates do pipeline Reversa:

| Template | Justificativa |
|---|---|
| `requirements-template.md` | Toda nova feature deve ser avaliada contra os 3 princípios — especialmente se propõe nova dependência (III), depende de rede (II), ou pode causar perda de dado (I) |
| `roadmap-template.md` | O roadmap deve priorizar features que fortalecem ou não violam os princípios |
| `actions-template.md` | Tasks que introduzem risco a qualquer princípio devem ser explicitamente identificadas com selo de impacto |

---

## Histórico de Alterações

| Data | Operação | Detalhes |
|---|---|---|
| 2026-06-16 | Criação | Princípios I, II e III estabelecidos |

# Email, Tarefas de Implementação

> Gerado pelo Redator em 2026-06-15

---

## Pré-requisitos

- [ ] Módulo `fields.js` com `iniciaisFields` e `getRetornoFields()`
- [ ] Módulo `iniciais.js` com `getIniciaisData()`
- [ ] Módulo `retornos.js` com `getRetornoData()`
- [ ] Módulo `dom.js` com `DOM.previewCorpo`
- [ ] Módulo `state.js` com `state.equipamentos`
- [ ] `nodemailer` instalado (`npm install nodemailer`)

## Tarefas

- [ ] T-01, Implementar `normalizeText(str)`
  - Origem no legado: `scripts/email.js:10-18`
  - Critério de pronto: Aplica NFD, remove diacríticos, substitui ç→c, uppercase
  - Confiança: 🟢

- [ ] T-02, Implementar `composeEmail(data)`
  - Origem no legado: `scripts/email.js:20-49`
  - Critério de pronto: Gera corpo com iniciais (data invertida DD-MM-YYYY), equipamentos, campos de retorno (apenas se existentes)
  - Confiança: 🟢

- [ ] T-03, Implementar `updateLivePreview()`
  - Origem no legado: `scripts/email.js:51-58`
  - Critério de pronto: Coleta dados atuais, compõe email, atualiza `DOM.previewCorpo.textContent`
  - Confiança: 🟢

- [ ] T-04, Implementar rotas da Netlify Function (`netlify/functions/send.js`)
  - Origem no legado: `netlify/functions/send.js`
  - Critério de pronto: Handler POST com validações de subject, text, SMTP vars, anexos. Despacha via nodemailer.
  - Confiança: 🟢

- [ ] T-05, Configurar 6 env vars no netlify.toml / Netlify UI
  - Origem no legado: `netlify/functions/send.js:23,32,59-66`
  - Critério de pronto: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_TO` configurados
  - Confiança: 🟢

- [ ] T-06, Implementar validação de SMTP_FROM no backend
  - Origem no legado: `send.js:24-29`
  - Critério de pronto: Regex de email, retorna 500 se inválido
  - Confiança: 🟢

- [ ] T-07, Implementar validação de anexos no backend (max 12, max 8MB)
  - Origem no legado: `send.js:46-57`
  - Critério de pronto: Retorna 400 se exceder limites
  - Confiança: 🟢

- [ ] T-08, Garantir TLS `rejectUnauthorized: false`
  - Origem no legado: `send.js:67`
  - Critério de pronto: Opção setada no transport config
  - Confiança: 🟢

## Tarefas de Teste

- [ ] TT-01, Testar `normalizeText()` com acentos, ç, maiúsculas
- [ ] TT-02, Testar `composeEmail()` inverte datas
- [ ] TT-03, Testar `composeEmail()` pula campos de retorno não existentes
- [ ] TT-04, Testar `composeEmail()` omite seção EQUIPAMENTOS se vazia
- [ ] TT-05, Testar `updateLivePreview()` atualiza DOM

> Nota: `send.js` não é testado em CI (SMTP indisponível). Testes do backend são manuais.

## Ordem Sugerida

1. T-01 (normalizeText) — utilidade base
2. T-02 (composeEmail) — composição
3. T-03 (updateLivePreview) — preview
4. T-04, T-06, T-07, T-08 (send.js) — backend
5. T-05 (env vars) — configuração
6. Testes frontend na ordem

## Lacunas Pendentes (🔴)

Nenhuma.

---

*Fim das tarefas de email.*

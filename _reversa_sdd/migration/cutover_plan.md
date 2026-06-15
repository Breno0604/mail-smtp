---
schemaVersion: 1
generatedAt: 2026-06-15T17:40:00-03:00
reversa:
  version: "1.2.43"
kind: cutover_plan
producedBy: strategist
hash: "sha256:c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3"
---

# Cutover Plan

> Plano de corte do legado para o sistema novo, alinhado à estratégia recomendada (Big Bang com Parallel Run opcional).

---

## Estratégia base

- **Estratégia recomendada**: A — Big Bang
- **Fase de validação**: Deploy preview do Netlify para Parallel Run opcional antes do corte

---

## Pré-requisitos

- [ ] Paridade comportamental validada via testes automatizados (Inspector — `parity_specs.md`)
- [ ] Deploy preview do Netlify disponível e acessível para validação manual
- [ ] Todos os 334+ testes passando no novo sistema (`npm test`)
- [ ] Envio de email testado com SMTP real no deploy preview
- [ ] Migração de schema IndexedDB v3 testada com dados reais (exportar/importar)
- [ ] CACHE_NAME do Service Worker antigo invalidado

---

## Janela de cutover

- **Data alvo**: A definir (após conclusão das 9 fases do roadmap)
- **Duração estimada**: 30 minutos (deploy + smoke test + rollback se necessário)
- **Ambiente afetado**: Produção (Netlify)
- **Comunicação prévia**: Apenas Breno (usuário único)

---

## Passos do cutover

| # | Passo | Owner | Duração | Reversível? |
|---|---|---|---|---|
| 1 | Fazer deploy do preview branch no Netlify (`git push origin preview`) | Breno | 2 min | Sim |
| 2 | Validar funcionalidades críticas no preview (formulário, anexos, email, sidebar) | Breno | 15 min | Sim |
| 3 | Executar suite de testes automatizados no CI do preview | Breno | 3 min | Sim |
| 4 | Se preview OK, fazer deploy na branch de produção (`git push origin main`) | Breno | 2 min | Sim |
| 5 | Smoke test rápido em produção (abrir, criar OS, enviar email) | Breno | 5 min | Sim |
| 6 | Monitorar logs da Netlify Function por 30 min | Breno | — | N/A |
| 7 | Marcar migração como completa | Breno | 1 min | N/A |

---

## Plano de rollback

- **Critérios de acionamento**:
  - Erro crítico no formulário que impede criar ou salvar OS
  - Envio de email falha (erro de conexão SMTP, timeout)
  - Dados de registros anteriores não carregam
  - Performance degradada (carregamento > 5s)

- **Passos**:
  1. Acessar dashboard do Netlify → Deploys → "Published deploy" do legado anterior
  2. Clicar "Publish deploy" (rollback instantâneo)
  3. Verificar que o legado voltou a funcionar
  4. Abrir issue/documentar o problema encontrado

- **Tempo máximo aceitável até rollback**: 10 minutos
- **Owner do rollback**: Breno

---

## Critérios de go / no-go

- **Go**:
  - Preview deploy testado e aprovado por Breno
  - Suite de testes passa (334+ testes, 0 falhas)
  - Envio de email funcional no preview
  - Dados do IndexedDB migrados corretamente
  - Interface visualmente idêntica ao legado (checklist visual)

- **No-go**:
  - Qualquer falha crítica nos testes
  - Envio de email não funcional
  - Regressão visual que afeta a usabilidade
  - Perda de dados de registros existentes

---

## Pós-cutover

- [ ] Monitoramento estendido por 7 dias (logs Netlify Function, reports de erro)
- [ ] Validação de paridade conforme `parity_specs.md` (Inspector)
- [ ] Descomissionamento do deploy legado após 14 dias sem rollback
- [ ] Limpeza de branches temporárias de preview

---

## Notas

- Como o IndexedDB fica no navegador, não há migração de banco centralizada. O schema v3 já é o mesmo. Basta abrir a nova URL e os dados estarão lá.
- O preview deploy do Netlify permite Breno usar o novo sistema em paralelo (outra aba) sem afetar o legado.
- O rollback no Netlify é instantâneo e não afeta o IndexedDB (já que ele fica no browser). Após rollback, o usuário recarrega e vê o legado com os mesmos dados.

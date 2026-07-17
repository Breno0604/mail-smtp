# Plano: Criar `analise.md` — Análise Rigorosa do Projeto Mail MVP

## Contexto

O usuário solicitou (via `nota.md`) uma análise extremamente rigorosa e criteriosa do projeto em 15 áreas, gerando um arquivo `analise.md` com problemas detalhados, pontuação, plano de melhorias e roadmap.

Já existe um `analise_projeto.md` anterior, mas muitos dos problemas nele identificados já foram corrigidos no código atual. A nova análise deve refletir o estado **atual** do projeto.

## O que já foi feito (exploração completa)

- Li todos os 24+ arquivos JS em `scripts/`
- Li `index.html`, `style.css`, `sw.js`, `manifest.json`
- Li `netlify/functions/send.js`
- Li `package.json`, `eslint.config.js`, `vitest.config.js`
- Li os testes existentes
- Li o `analise_projeto.md` existente (804 linhas) para comparar com o estado atual

## Mudanças já implementadas desde a última análise

| Achado anterior                   | Status atual                                                                                       |
| --------------------------------- | -------------------------------------------------------------------------------------------------- |
| A1 (dependência circular)         | **CORRIGIDO** — `filled-state.js` existe e é importado por `app.js` e `restore.js`                 |
| S2 (endpoint sem autenticação)    | **PARCIALMENTE CORRIGIDO** — `netlify/functions/send.js` agora tem verificação de `ALLOWED_ORIGIN` |
| Q2 (filename undefined)           | **CORRIGIDO** — validação `att.filename` agora existe antes do `.replace()`                        |
| E1 (erros silenciosos na sidebar) | **CORRIGIDO** — `sidebar.js` agora tem `console.error` + `showToast` nos catches                   |
| K2 (coverage-v8 ausente)          | **CORRIGIDO** — `@vitest/coverage-v8` está em `devDependencies`                                    |
| K1 (sem testes backend)           | **CORRIGIDO** — `tests/send-function.test.js` existe agora                                         |
| S3 (validação server-side)        | **CORRIGIDO** — `netlify/functions/send.js` agora valida subject, text, attachments, emails        |

## Estrutura do `analise.md` a ser criado

Seguir exatamente a estrutura solicitada em `nota.md`:

1. **Arquitetura** — organização, separação, escalabilidade, acoplamento, coesão
2. **Qualidade do código** — modularidade, legibilidade, DRY, complexidade
3. **Boas práticas** — SOLID, Clean Code, KISS, YAGNI
4. **Manutenibilidade** — facilidade de manutenção e evolução
5. **Performance** — redundância, loops, renderizações, memória
6. **Segurança** — validação, sanitização, vulnerabilidades, segredos
7. **Tratamento de erros** — robustez, logs, mensagens
8. **Consistência** — padronização, convenções, estilo
9. **Reutilização** — componentes, funções, código duplicado
10. **Escalabilidade** — crescimento, limitações, gargalos futuros
11. **Testabilidade** — facilidade de testar, mocks, acoplamento
12. **Interface** — responsividade, acessibilidade, UX
13. **Documentação** — README, comentários, instalação
14. **Dependências** — bibliotecas desnecessárias, desatualizadas
15. **Organização geral** — diretórios, configurações

Para cada problema: localização, gravidade, categoria, explicação, motivo técnico, impacto atual/futuro, como corrigir, exemplo, benefícios.

Ao final: pontuação (0-10), plano de melhorias (🔴/🟠/🟡/🟢), roadmap, conclusão.

## Abordagem de implementação

1. Criar o arquivo `analise.md` na raiz do projeto
2. Escrever seção por seção, baseando-me exclusivamente no código atual lido
3. Verificar quais problemas do `analise_projeto.md` ainda persistem vs. quais foram corrigidos
4. Identificar novos problemas que possam ter surgido
5. Gerar pontuação justa baseada no estado atual

## Arquivos a serem criados

- `C:\web-projects\mail\analise.md` — o relatório completo

## Verificação

- O arquivo deve conter todas as 15 seções solicitadas em `nota.md`
- Cada problema deve ter os 10 campos obrigatórios
- Pontuação, plano de melhorias, roadmap e conclusão devem estar presentes
- Markdown bem estruturado com índice, tabelas e blocos de código

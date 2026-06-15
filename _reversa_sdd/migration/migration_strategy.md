---
schemaVersion: 1
generatedAt: 2026-06-15T17:40:00-03:00
reversa:
  version: "1.2.43"
kind: migration_strategy
producedBy: strategist
hash: "sha256:a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1"
---

# Migration Strategy

> Estratégias de migração avaliadas com trade-offs explícitos.
> A decisão final é humana.

## Contexto

| Variável | Valor |
|---|---|
| Tamanho do legado | 1.889 LOC, 24 módulos, 0 ciclos |
| Apetite derivado | Transformational |
| Gap de paradigma | Médio (Procedural → Component-based reativo) |
| Prazo | Indefinido |
| Integrações regulatórias | Nenhuma |
| Banco de dados | IndexedDB local (browser) |
| Deploy | Netlify (git push → auto-deploy, rollback 1-click) |
| Desenvolvedor | 1 (Breno) |

---

## Estratégias avaliadas

### Estratégia A: Big Bang
- **Descrição**: Desenvolver o sistema completo na nova stack em paralelo, depois substituir o deploy do legado pelo novo em um único corte. O legado permanece no ar até o corte.
- **Quando aplica**: sistema pequeno (< 5K LOC), apetite transformacional, poucas integrações, janela tolerada
- **Custo**: baixo
- **Risco**: médio
- **Tempo**: curto (~21 dias úteis)
- **Adequação ao apetite derivado** (`transformational`): ✅ alta
- **Trade-offs**:
  - Prós: desenvolvimento isolado sem afetar produção; código novo 100% limpo; sem co-existência de duas stacks; rollback no Netlify é instantâneo (1 clique)
  - Contras: risco de surpresa na integração final; se algo crítico escapar, impacta todos os usuários de uma vez

### Estratégia B: Strangler Fig
- **Descrição**: Migrar por partes, substituindo módulos do legado gradualmente. Roteamento condicional decide qual stack atende.
- **Quando aplica**: sistema em produção que não pode parar, necessidade de incrementalidade
- **Custo**: médio
- **Risco**: baixo
- **Tempo**: longo
- **Adequação ao apetite derivado** (`transformational`): 🔴 baixa — apetite transformacional prefere entrega rápida
- **Trade-offs**:
  - Prós: risco mínimo a cada deploy parcial; equipe aprende a stack gradualmente
  - Contras: co-existência de duas stacks (complexidade); super-engenharia para 1.889 LOC; prazo mais longo; o "gás" da migração se perde

### Estratégia C: Parallel Run (parcial)
- **Descrição**: Ambos os sistemas rodam simultaneamente por um período. Usuário pode acessar o novo via deploy preview do Netlify para validar paridade antes do corte.
- **Quando aplica**: lógica crítica que precisa de prova de equivalência
- **Custo**: alto (manter dois sistemas)
- **Risco**: médio
- **Tempo**: médio
- **Adequação ao apetite derivado** (`transformational`): ⚠️ média — útil como fase de validação, não como estratégia principal
- **Trade-offs**:
  - Prós: validação de paridade antes do corte; confiança para o Big Bang
  - Contras: custo alto de manter dois sistemas funcionais; dados em IndexedDB não sincronizam entre eles (cada aba/browser tem seu próprio banco)

---

## Comparativo

| Critério | A — Big Bang | B — Strangler Fig | C — Parallel Run |
|---|---|---|---|
| Custo | Baixo | Médio | Alto |
| Risco | Médio | Baixo | Médio |
| Tempo | Curto (~21 dias) | Longo (~45+ dias) | Médio (~35 dias) |
| Aderência ao apetite | Alta | Baixa | Média |
| Compatibilidade c/ mudança de paradigma | Alta (código 100% novo) | Média (coexistência confusa) | Alta (valida antes) |

---

## Recomendação do Strategist

- **Estratégia recomendada**: **A — Big Bang com fase Parallel Run opcional**
- **Justificativa**:

  1. **Tamanho**: 1.889 LOC é pequeno o suficiente para ser reescrito de uma vez. Tentar um Strangler Fig para esse porte é como usar um caminhão para mudar uma caixa de sapatos.

  2. **IndexedDB local**: Os dados ficam no browser do usuário. Não há um banco central para migrar — o schema v3 do IndexedDB já é o final. O usuário simplesmente abre o novo sistema e seus registros estão lá (mesmo banco, mesmo schema).

  3. **Netlify simplifica o corte**: `git push` para uma branch de produção. Rollback é um clique no dashboard do Netlify. Não há DNS para propagar, servidores para configurar, ou SSL para renovar.

  4. **Desenvolvedor único**: Sem coordenação de time. Sem branches conflitantes. Sem PRs para revisar. O custo de coordenação do Strangler Fig não compensa.

  5. **Fase Parallel Run opcional**: Antes do corte final, usar um deploy preview do Netlify (URL temporária) para validação de paridade. O usuário pode abrir ambos os sistemas em abas separadas e comparar.

---

## Decisão humana

- **Estratégia escolhida**: A — Big Bang com Parallel Run opcional
- **Quem decidiu**: Breno
- **Quando**: 2026-06-15
- **Justificativa do decisor**: Sistema pequeno, apetite transformacional, rollback simples no Netlify

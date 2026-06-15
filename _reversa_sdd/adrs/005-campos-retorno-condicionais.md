# ADR 005: Campos de Retorno por Tipo de Ordem com Suporte Condicional

**Data:** 2026-06-09
**Confiança:** 🟢 CONFIRMADO

## Contexto

O sistema precisava suportar 41 tipos de ordem, cada um com seu próprio conjunto de campos de retorno. Alguns campos só faziam sentido se outros tivessem determinado valor (ex: campo "TOI" só aparece se "Aplicado TOI = SIM").

## Decisão

Implementar:
1. **Mapa `retornoFieldsByTipo`**: um array de definição de campos para cada tipo de ordem
2. **Campos condicionais**: propriedade `condicional: { campoRef, valor, negado }` nos fields
3. **Renderização dinâmica**: `renderRetorno()` reconstrói o DOM ao mudar o tipo
4. **Cascata**: `updateConditionalFields()` avalia todos os condicionais sempre que um campo mestre muda
5. **Campo `FIELD_DESCRICAO`**: textarea de descrição livre, presente na maioria (mas não todos) dos tipos

## Alternativas Consideradas

- **Um formulário diferente por tipo**: Rejeitado — 41 páginas HTML diferentes seria insustentável
- **Campos fixos com show/hide genérico**: Rejeitado — cada tipo tem campos muito diferentes
- **JSON remoto de definição de campos**: Rejeitado — sem backend, tudo no frontend

## Consequências

- Positivas:
  - Fácil adicionar novo tipo de ordem: basta adicionar entry no map
  - Condicionais flexíveis: suporta string, array (any match) e negação
  - Campos ocultos automaticamente excluídos do email e validação
  - Mudança de tipo descarta dados anteriores (`state.retorno = {}`)
- Negativas:
  - Definições de campo no JS, não em config — requer deploy para alterar
  - Ordem dos campos importa: pais devem vir antes dos filhos no array
  - Complexidade de teste: 41 tipos × combinações de condicionais

## Commits Relacionados

- `bb7dd00` feat: add retornoFieldsByTipo map with conditional field support
- `8d0426e` feat: rewrite retornos.js with dynamic fields, remove modal
- `9d03c5a` feat: add UC Cortada (I15/I30/I90/I180) fields with side-by-side layout
- `7015195` feat: implementar campos de retorno da aba corte
- `c68d169` fix: ligacao e tombamento tambem aparecem em VISTORIA + LIGACAO
- `970ad72` fix: campos ocultos nao aparecem na revisao nem no email

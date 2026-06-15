# Equipamentos, Requisitos

> Gerado pelo Redator em 2026-06-15
> Cobre o módulo: `equipment.js`

---

## Visão Geral

Gerencia a adição, remoção e coleta de equipamentos instalados ou retirados durante a ordem de serviço. Cada equipamento possui tipo (Instalado/Retirado), categoria e número de série.

## Responsabilidades

- Adicionar linhas de equipamento ao formulário
- Renderizar/restaurar lista de equipamentos no DOM
- Coletar dados de equipamentos do DOM para o state
- Gerenciar mensagem "Nenhum equipamento adicionado" (empty state)

## Regras de Negócio

- RN01: Cada equipamento tem 3 campos: status (Instalado/Retirado), categoria (Medidor/Display/Conjunto/TC/TP) e número 🟢
- RN02: Número de equipamento não pode ser duplicado (validado externamente em `validation.js`) 🟢
- RN03: Seção de equipamentos é opcional — formulário pode ser enviado sem equipamentos 🟢
- RN04: Ao restaurar um registro, equipamentos são re-renderizados no DOM 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Adicionar linha de equipamento com 3 campos | Must | Click "+Equipamento" cria row com selects (Tipo, Categoria) + input (Número) + botão ✕ |
| RF-02 | Remover equipamento individual | Must | Click no ✕ remove a linha e atualiza state |
| RF-03 | Coletar dados de equipamentos do DOM para o state | Must | `collectEquipamentos()` lê todas as rows e atualiza `state.equipamentos[]` |
| RF-04 | Exibir mensagem "Nenhum equipamento adicionado" quando vazio | Must | Estado vazio mostra mensagem cinza centralizada |
| RF-05 | Esconder mensagem vazia quando há equipamentos | Must | Ao adicionar o primeiro, mensagem some |
| RF-06 | Restaurar equipamentos ao carregar registro | Must | `renderEquipamentos()` reconstrói rows a partir do state |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Manutenibilidade | Código em único arquivo (`equipment.js`) | `equipment.js` | 🟢 |

## Critérios de Aceitação

```gherkin
Dado um formulário sem equipamentos
Quando o usuário clica em "+Equipamento"
Então uma nova linha aparece com selects Tipo, Categoria e input Número
E a mensagem "Nenhum equipamento adicionado" desaparece

Dado uma linha de equipamento preenchida
Quando o usuário clica no ✕
Então a linha é removida
E se era o único, a mensagem vazia reaparece

Dado que há equipamentos no state
Quando `renderEquipamentos()` é chamado
Então as linhas são reconstruídas com os valores salvos
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Adicionar/Remover equipamentos | Must | Funcionalidade principal |
| Coletar dados para o state | Must | Necessário para persistência e email |
| Estado vazio | Should | UX, não bloqueia funcionalidade |
| Restaurar equipamentos | Must | Necessário para carregar registros salvos |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `scripts/equipment.js` | `addEquip()`, `collectEquipamentos()`, `renderEquipamentos()`, `showEmptyEquip()`, `hideEmptyEquip()` | 🟢 |

---

*Fim dos requisitos de equipamentos.*

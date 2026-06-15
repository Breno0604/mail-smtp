# Sidebar, Requisitos

> Gerado pelo Redator em 2026-06-15
> Cobre os módulos: `scripts/sidebar.js`, `scripts/duplicate.js`, `scripts/reset.js`

---

## Visão Geral

A sidebar lista todos os registros salvos no IndexedDB (rascunhos e enviados), permitindo editar ou excluir. Inclui proteção contra reenvio de registros já enviados (modal de confirmação) e reset completo do formulário.

## Responsabilidades

- Listar registros ordenados por `updatedAt` (mais recente primeiro)
- Exibir resumo (UC-OS-TipoOrdem) com badge de status (rascunho/enviado)
- Filtrar registros por UC, OS ou tipo de ordem (input de texto)
- Carregar registro no formulário ao clicar "Editar"
- Excluir registro com confirmação (modal)
- Limpar UUID ativo se registro excluído for o atual
- Proteger contra reenvio de registros já enviados (duplicate.js)
- Reset completo do formulário (reset.js)

## Regras de Negócio

- RN01: Registros ordenados por `updatedAt` decrescente 🟢
- RN02: Filtro busca em UC, OS e tipoOrdem (case-insensitive) 🟢
- RN03: Ao editar, registro completo é buscado via `getRecord()` (sidebar só tem summary) 🟢
- RN04: Ao excluir registro atual, UUID é limpo (state + localStorage) 🟢
- RN05: Reenvio de registro já enviado exige confirmação via modal 🟢
- RN06: Registro em status "sent" não pode ser reenviado sem confirmação explícita 🟢
- RN07: Reset do formulário limpa todo state, UUID, localStorage, DOM sections 🟢
- RN08: Reset chama `markAttachmentsDirty()` para forçar re-save vazio 🟢
- RN09: Após reset, `captureCoordinates()` é chamado (para recapturar localização) 🟢
- RN10: Ao resetar, event listener de tipoOrdem é re-attachado 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Listar registros na sidebar | Must | `renderSidebar()` exibe todos os records ordenados por updatedAt |
| RF-02 | Exibir resumo do registro (UC-OS-Tipo) | Must | `getRecordSummary()` gera string `<UC>-<OS>-<Tipo>` |
| RF-03 | Filtrar registros via input | Must | `initSidebarFilter()` re-renderiza a cada input |
| RF-04 | Carregar registro no formulário | Must | Click "Editar" busca registro completo + `applyRecord()` |
| RF-05 | Excluir registro com confirmação | Must | Click "Excluir" → `showConfirm()` → `deleteRecord()` |
| RF-06 | Proteger reenvio de registro enviado | Should | `checkDuplicate()` exibe modal se status === "sent" |
| RF-07 | Reset completo do formulário | Must | `resetForm()` limpa state, DOM, UUID, recaptura coordenadas |
| RF-08 | Sidebar fechar | Must | `closeSidebar()` remove classe `sidebar-open` do body |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência | Confiança |
|------|--------------------|-----------|-----------|
| UX | Empty state da sidebar (sem registros) | `sidebar.js:35-38` | 🟢 |
| UX | Empty state do filtro (sem match) | `sidebar.js:50-53` | 🟢 |
| UX | Erro ao carregar registros | `sidebar.js:30-33` | 🟢 |

## Critérios de Aceitação

```gherkin
Dado que há 3 registros no IndexedDB
Quando `renderSidebar()` é chamado
Então 3 itens são exibidos ordenados por updatedAt (mais recente primeiro)

Dado que há registros com UC "123"
Quando o filtro é "123"
Então apenas registros com UC, OS ou tipoOrdem contendo "123" são exibidos

Dado um registro em status "draft"
Quando click "Editar"
Então formulário é preenchido e sidebar fechada

Dado um registro em status "sent"
Quando o usuário tenta reenviar
Então modal "Registro já enviado" aparece com confirmação

Dado que o formulário está preenchido
Quando `resetForm()` é chamado
Então todos os campos são limpos, UUID removido, coordenadas recapturadas
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Listar/filtrar registros | Must | Navegação entre rascunhos |
| Editar registro | Must | Funcionalidade principal |
| Excluir registro | Must | Gestão de dados |
| Proteção de reenvio | Should | Segurança, evita duplicatas |
| Reset do formulário | Must | UX para novo registro |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `scripts/sidebar.js` | `closeSidebar()`, `getRecordSummary()`, `renderSidebar()`, `loadRecord()`, `initSidebarFilter()` | 🟢 |
| `scripts/duplicate.js` | `checkDuplicate()` | 🟢 |
| `scripts/reset.js` | `resetForm()` | 🟢 |

---

*Fim dos requisitos de sidebar.*

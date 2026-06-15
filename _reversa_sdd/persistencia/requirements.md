# Persistência, Requisitos

> Gerado pelo Redator em 2026-06-15
> Cobre os módulos: `scripts/persistence.js`, `scripts/db.js`, `scripts/storage.js`, `scripts/state.js`, `scripts/restore.js`

---

## Visão Geral

Sistema de persistência em duas camadas: localStorage (para UUID ativo e backup de estado) e IndexedDB (para registros completos e anexos). A persistência é automática (debounced) e reage a mudanças no formulário.

## Responsabilidades

- Persistir automaticamente o estado do formulário como "draft" no IndexedDB
- Gerenciar UUID ativo (localStorage + state)
- Separar anexos em store próprio do IndexedDB (desde v3)
- Suportar migração de v2 (anexos inline) para v3 (anexos em store separado)
- Restaurar registro completo no formulário
- Marcar anexos como "dirty" para evitar re-serialização desnecessária
- Debounce de 1s para salvar
- Não salvar se `iniciaisValido` for false ou se não houver dados
- Exibir toast de erro se IndexedDB estourar cota

## Regras de Negócio

- RN01: Salvamento automático só ocorre se `state.iniciaisValido === true` 🟢 (`persistence.js:41`)
- RN02: Salvamento não ocorre se não houver dados (UUID vazio, sem iniciais, sem equipamentos, sem attachments) 🟢
- RN03: Anexos são salvos em store separado (`attachments`) com chave composta `{uuid}_{index}` 🟢
- RN04: `markAttachmentsDirty()` evita re-serialização quando anexos não mudaram 🟢
- RN05: Se falha ao salvar anexos, `attachmentsDirty` retorna a `true` para retry 🟢
- RN06: Save é debounced em 1000ms 🟢
- RN07: Ao restaurar, migração de v2→v3 é transparente: se `record.attachments` inline existir, usa ele; senão, busca do store separado 🟢
- RN08: `state.js` re-exporta de `persistence.js` — ciclo de importação quebrado via `storage.js` 🟢
- RN09: UUID é gerado via `crypto.randomUUID()` com fallback para `Date.now() + Math.random()` 🟢
- RN10: Registros são keyPath `uuid` no store `records`; anexos são keyPath `id` com index em `uuid` 🟢
- RN11: Ao deletar um registro, também deleta seus anexos na mesma transação atômica 🟢
- RN12: QuotaExceededError dispara toast de erro 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Salvar estado automaticamente (debounced) | Must | Após 1s de inatividade, `saveState()` persiste no IndexedDB |
| RF-02 | Gerar UUID único | Must | `_ensureUUID()` gera via crypto.randomUUID() ou fallback |
| RF-03 | Marcar anexos como dirty | Must | `markAttachmentsDirty()` seta flag; `saveState()` só re-serializa se dirty |
| RF-04 | Restaurar registro completo | Must | `applyRecord()` preenche formulário com dados do registro |
| RF-05 | Migrar anexos v2→v3 transparentemente | Must | Ao restaurar registro v2, anexos inline são convertidos a File[] |
| RF-06 | Deletar registro + anexos atomicamente | Must | `deleteRecord()` remove em transação com 2 stores |
| RF-07 | Atualizar status para "sent" após envio | Must | `updateRecordStatus()` muda status draft→sent e registra sentData |
| RF-08 | Exibir toast de erro em QuotaExceededError | Should | UI mostra aviso de espaço insuficiente |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência | Confiança |
|------|--------------------|-----------|-----------|
| Performance | Attachments têm dirty tracking | `persistence.js:28-36` | 🟢 |
| Performance | Save debounced (1s) | `persistence.js:87-90` | 🟢 |
| Confiabilidade | Fallback UUID sem crypto | `persistence.js:97-99` | 🟢 |
| Confiabilidade | Retry de anexos se falhar | `persistence.js:82` | 🟢 |
| Manutenibilidade | storage.js quebra ciclo state→persistence→state | `storage.js:1` | 🟢 |
| Compatibilidade | Suporte a v2 e v3 na restauração | `restore.js:27-47` | 🟢 |

## Critérios de Aceitação

```gherkin
Dado um formulário com UC/OS preenchidos (iniciaisValido = true)
Quando o usuário modifica qualquer campo
E aguarda 1 segundo
Então o estado é salvo no IndexedDB

Dado que o formulário está sendo salvo
E houve QuotaExceededError
Então um toast "Espaço insuficiente" é exibido

Dado um registro v2 com anexos inline
Quando `applyRecord()` é chamado
Então anexos são convertidos a File[]
E `markAttachmentsDirty()` é chamado

Dado um registro com anexos
Quando `deleteRecord()` é chamado
Então o registro e todos seus anexos são removidos
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Salvamento automático | Must | Funcionalidade principal |
| Restauração de registro | Must | Necessário para carregar rascunhos |
| Deleção atômica | Must | Integridade dos dados |
| Migração v2→v3 | Must | Compatibilidade retroativa |
| Toast de cota excedida | Should | UX |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `scripts/persistence.js` | `saveState()`, `debouncedSave()`, `markAttachmentsDirty()`, `getCurrentUUID()`, `setCurrentUUID()`, `clearCurrentUUID()` | 🟢 |
| `scripts/db.js` | `openDB()`, `saveDraft()`, `getRecord()`, `getAllRecords()`, `deleteRecord()`, `updateRecordStatus()`, `saveAttachments()`, `getAttachmentsByUuid()`, `deleteAttachmentsByUuid()` | 🟢 |
| `scripts/storage.js` | `getRawUUID()`, `storeUUID()`, `removeUUID()` | 🟢 |
| `scripts/state.js` | `state` object, re-exports de persistence.js | 🟢 |
| `scripts/restore.js` | `applyRecord()` | 🟢 |

---

*Fim dos requisitos de persistência.*

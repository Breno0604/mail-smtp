# Spec Impact Matrix — mail-mvp

> Gerado pelo Arquiteto em 2026-06-15
> Legenda: 🔴 Alto | 🟡 Médio | 🟢 Baixo | — Sem impacto

---

## Matriz Componente × Componente

| Componente | app | iniciais | retornos | fields | validation | email | send | attachments | compress | equipment | persistence | db | state | storage | sidebar | restore | duplicate | ui | utils |
|-----------|:---:|:--------:|:--------:|:-----:|:----------:|:-----:|:----:|:-----------:|:--------:|:---------:|:-----------:|:--:|:-----:|:-------:|:-------:|:-------:|:---------:|:--:|:-----:|
| **app.js** | — | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🔴 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 |
| **iniciais.js** | 🔴 | — | 🟢 | 🔴 | 🔴 | 🟢 | 🟡 | 🟢 | 🟢 | 🟢 | 🔴 | 🟢 | 🔴 | 🟢 | 🟢 | 🔴 | 🟢 | 🟡 | 🟢 |
| **retornos.js** | 🔴 | 🟢 | — | 🔴 | 🔴 | 🔴 | 🟡 | 🟢 | 🟢 | 🟢 | 🔴 | 🟢 | 🔴 | 🟢 | 🟢 | 🔴 | 🟢 | 🟢 | 🟢 |
| **fields.js** | 🟡 | 🔴 | 🔴 | — | 🟡 | 🔴 | 🟡 | 🟢 | 🟢 | 🟢 | 🟡 | 🟢 | 🟢 | 🟢 | 🟢 | 🟡 | 🟢 | 🟢 | 🟢 |
| **validation.js** | 🔴 | 🔴 | 🔴 | 🟡 | — | 🟢 | 🔴 | 🟢 | 🟢 | 🔴 | 🟡 | 🟢 | 🟡 | 🟢 | 🟢 | 🟢 | 🟢 | 🔴 | 🟢 |
| **email.js** | 🟡 | 🔴 | 🔴 | 🔴 | 🟢 | — | 🔴 | 🟢 | 🟢 | 🟢 | 🟡 | 🟢 | 🔴 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 |
| **send.js** | 🔴 | 🟡 | 🟡 | 🟡 | 🔴 | 🔴 | — | 🟡 | 🔴 | 🟡 | 🔴 | 🔴 | 🔴 | 🟢 | 🟢 | 🟢 | 🔴 | 🟡 | 🟡 |
| **attachments.js** | 🟡 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟡 | — | 🟡 | 🟢 | 🔴 | 🟢 | 🔴 | 🟢 | 🟢 | 🟢 | 🟢 | 🟡 | 🟡 |
| **compress.js** | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🔴 | 🟡 | — | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🔴 |
| **equipment.js** | 🟡 | 🟢 | 🟢 | 🟢 | 🔴 | 🟢 | 🟡 | 🟢 | 🟢 | — | 🔴 | 🟢 | 🔴 | 🟢 | 🟢 | 🟢 | 🟢 | 🟡 | 🟢 |
| **persistence.js** | 🔴 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🔴 | 🟢 | 🔴 | — | 🔴 | 🔴 | 🔴 | 🟢 | 🔴 | 🟢 | 🟡 | 🔴 |
| **db.js** | 🟡 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🔴 | 🟢 | 🟢 | 🟢 | 🔴 | — | 🟢 | 🟢 | 🔴 | 🔴 | 🔴 | 🟢 | 🟢 |
| **state.js** | 🔴 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🔴 | 🟡 | 🟢 | 🟡 | 🔴 | 🟢 | — | 🔴 | 🟡 | 🟢 | 🟡 | 🟢 | 🟢 |
| **storage.js** | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🔴 | 🟢 | 🔴 | — | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 |
| **sidebar.js** | 🔴 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟡 | 🔴 | 🟡 | 🟢 | — | 🔴 | 🟢 | 🟢 | 🟢 |
| **restore.js** | 🔴 | 🔴 | 🔴 | 🟡 | 🟢 | 🟢 | 🟢 | 🔴 | 🟢 | 🔴 | 🔴 | 🔴 | 🔴 | 🟢 | 🟢 | — | 🟢 | 🟢 | 🔴 |
| **duplicate.js** | 🟡 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🔴 | 🟢 | 🟢 | 🟢 | 🟡 | 🔴 | 🟡 | 🟢 | 🟢 | 🟢 | — | 🟢 | 🟢 |
| **ui.js** | 🔴 | 🟢 | 🟢 | 🟢 | 🔴 | 🟢 | 🟡 | 🟡 | 🟢 | 🟡 | 🟡 | 🟢 | 🟢 | 🟢 | 🟡 | 🟢 | 🟡 | — | 🟢 |
| **utils.js** | 🟡 | 🔴 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | 🟢 | 🔴 | 🟢 | 🟢 | 🟢 | 🟢 | 🔴 | 🟢 | 🟢 | — |

---

## Componentes por Impacto

### 🔴 Alto Impacto (mais dependentes)

| Componente | Depende de | Impacta |
|-----------|-----------|---------|
| **app.js** | 18 módulos | Afeta toda a aplicação — entry point central |
| **send.js** | 7 módulos (crítico: validation, duplicate, compress, db) | Pipeline de envio — qualquer falha interrompe o fluxo principal |
| **persistence.js** | 6 módulos (state, storage, db, iniciais, retornos, utils) | Save/restore — corromper afeta todos os registros |
| **restore.js** | 10 módulos (state, fields, attachments, db, utils, etc.) | Restauração de registros — bug afeta sidebar + recarga |
| **validation.js** | 5 módulos (dom, state, iniciais, retornos, ui) | Bloqueia envio se falhar |

### 🟡 Médio Impacto

| Componente | Motivo |
|-----------|--------|
| **iniciais.js** | Dependência de fields.js para schema. Impacta app.js, retornos.js, validation.js |
| **retornos.js** | Dependência de fields.js e iniciais.js. Impacta app.js, email.js, validation.js |
| **db.js** | Store único de dados. Impacta persistence.js, sidebar.js, restore.js, duplicate.js |
| **state.js** | Estado global. Impacta 10+ módulos que importam state |
| **attachments.js** | Impacta app.js, send.js, compress.js, persistence.js |
| **sidebar.js** | Impactado por db.js. Usa restore.js para carregar registros |

### 🟢 Baixo Impacto

| Componente | Motivo |
|-----------|--------|
| **storage.js** | Função específica (UUID), 2 dependentes |
| **styles.js** | Apenas constantes CSS, sem lógica |
| **utils.js** | Funções puras, sem dependências |

---

## Feature Impact Map

| Funcionalidade | Componentes Envolvidos | Risco |
|---------------|----------------------|:----:|
| **Preencher formulário** | app → iniciais → fields → retornos | 🟡 |
| **Auto-save** | iniciais → persistence → db → storage | 🟡 |
| **Adicionar equipamento** | equipment → validation (duplicata) → persistence | 🟢 |
| **Anexar arquivos** | attachments → compress → persistence (dirty) | 🟡 |
| **Enviar email** | send → validation → duplicate → compress → db → fetch | 🔴 |
| **Restaurar registro** | sidebar → restore → db → iniciais → retornos → attachments | 🔴 |
| **Excluir registro** | sidebar → db (atômico 2 stores) | 🟡 |
| **Sidebar/histórico** | sidebar → db → restore → ui | 🟡 |
| **Reset formulário** | reset → state → iniciais → attachments | 🟢 |

---

## Caminhos Críticos (Critical Paths)

### Path 1: Envio de Email (mais crítico)

```
app.js → send.js → validation.js → duplicate.js → compress.js
  → persistence.js (saveState) → fetch POST /api/send
  → db.js (updateRecordStatus)
```

**Risco**: 🔴 Alto — 6 componentes precisam funcionar em sequência

### Path 2: Restauração de Registro

```
sidebar.js → restore.js → db.js → iniciais.js → retornos.js
  → attachments.js → equipment.js
```

**Risco**: 🔴 Alto — restore.js coordena 7 módulos

### Path 3: Persistência Automática

```
app.js (input listener) → debouncedSave → persistence.js
  → saveState → db.js + storage.js
```

**Risco**: 🟡 Médio — debounce de 1000ms, mas falha no save = perda de dados

---

*Fim da Spec Impact Matrix.*

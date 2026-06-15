---
schemaVersion: 1
generatedAt: 2026-06-15T18:10:00-03:00
reversa:
  version: "1.2.43"
  kind: target_domain_model
  producedBy: designer
  hash: "sha256:placeholder"
---

# Target Domain Model

> Modelo de domínio do sistema novo — aggregates, entidades, value objects e mapeamento de regras.
> Topologia: Feature-Sliced Design. Paradigma: Component-based reativo (Vue 3 + TypeScript).

## Aggregates

### AGG-Record
- **Aggregate root**: `Record`
- **Bounded context**: Compartilhado (entities/record/) — usado por features inicio, retorno, email, sidebar
- **Invariantes**:
  - UUID é único e imutável (gerado via `crypto.randomUUID()`)
  - `status` é `"draft"` ou `"sent"` (enum, nunca vazio)
  - `createdAt` ≤ `updatedAt` (timestamps monotônicos)
  - `tipoOrdem` é string opcional (nullable)
  - `equipamentos` é array (pode ser vazio — seção opcional)
  - `attachmentCount` reflete contagem de anexos no store attachments (consistência eventual)
- **Comandos aceitos**:
  - `criar(iniciais)`: cria registro com status "draft"
  - `atualizar(dados)`: atualiza campos do registro
  - `enviar()`: muda status para "sent", registra `sentData`
  - `duplicar()`: cria cópia com novo UUID e status "draft"
  - `excluir()`: remove registro + anexos associados
- **Eventos publicados**: N/A (paradigma component-based reativo, não event-driven)
- **Origem no legado**: `_reversa_sdd/domain.md § Record` + `scripts/persistence.js`, `scripts/db.js`, `scripts/state.js`

### AGG-Attachment
- **Aggregate root**: `Attachment`
- **Bounded context**: entities/attachment/
- **Invariantes**:
  - ID é `{uuid}_{index}` (FK composta com Record)
  - uuid referencia Record existente (consistência na camada de aplicação)
  - Máximo 12 anexos por uuid
  - Cada anexo ≤ 8MB (após compressão)
  - `data` é string base64
- **Comandos aceitos**:
  - `adicionar(uuid, file)`: comprime (se necessário) e armazena
  - `remover(id)`: deleta anexo
  - `listar(uuid)`: retorna todos anexos de um registro
- **Origem no legado**: `_reversa_sdd/domain.md § Attachment` + `scripts/attachments.js`

### AGG-Equipment
- **Aggregate root**: `Equipment` (entidade fraca — não persiste, vive apenas na sessão)
- **Bounded context**: features/equipamentos/
- **Invariantes**:
  - `status` é "Instalado" ou "Retirado" (enum)
  - `categoria` é "Medidor" | "Display" | "Conjunto" | "TC" | "TP" (enum)
  - `numero` é string única (sem duplicatas na lista)
  - Normalização: "00123" → "123" (sem zeros à esquerda)
- **Comandos aceitos**:
  - `adicionar(status, categoria, numero)`: adiciona equipamento à lista
  - `remover(index)`: remove da lista
  - `limpar()`: limpa todos equipamentos
- **Origem no legado**: `_reversa_sdd/domain.md § Equipment` + `scripts/equipment.js`

## Entidades

| Entidade | Aggregate dono | Atributos principais | Origem no legado |
|---|---|---|---|
| `Record` | AGG-Record | uuid, status, createdAt, updatedAt, iniciais, retorno, tipoOrdem, equipamentos[], lastTipoOrdem, composicao, attachmentCount, sentData | `scripts/state.js` + `scripts/persistence.js` |
| `Attachment` | AGG-Attachment | id, uuid, index, name, type, data (base64) | `scripts/attachments.js` + `scripts/db.js` |
| `Equipment` | AGG-Equipment | status, categoria, numero | `scripts/equipment.js` |
| `SentData` | AGG-Record | sentAt (ISO), response (string) | `scripts/persistence.js` |

## Value objects

| Value object | Atributos | Validações | Origem |
|---|---|---|---|
| `IniciaisData` | uc, os, tipoOrdem, parceiroLider, municipio, placa, data, horaInicio, horaFim, coordenadas, notificado, complemento | uc: dígitos apenas; data: não futura; horaFim ≠ horaInicio | `_reversa_sdd/domain.md § Record.iniciais` |
| `RetornoData` | dicionário chave-valor (dinâmico por tipo de ordem) | Chaves dos campos visíveis; valores string | `_reversa_sdd/domain.md § Record.retorno` |
| `Coordenadas` | latitude, longitude (string) | Formato "lat, lon" ou "Não disponível" | `scripts/utils.js` |
| `ComposicaoEmail` | subject, text (strings) | Texto normalizado: MAIÚSCULAS, sem acentos | `_reversa_sdd/domain.md RE02-RE03` |

## Eventos de domínio

> Paradigma component-based reativo: não há barramento de eventos de domínio. A comunicação entre features ocorre via reatividade do Pinia (stores observam umas às outras) e via entities compartilhadas. Eventos de UI (toast, navegação) são gerenciados por `shared/ui/`.

## Regras de domínio

> Mapeamento de todas as 72 regras MIGRAR de `target_business_rules.md` para os aggregates / bounded contexts onde vivem.

| Regra (ID) | Local no domínio novo | Origem |
|---|---|---|
| BR-MIGRAR-001 | BC-Retorno: `watch(tipoOrdem)` descarta retorno anterior | `target_business_rules.md` |
| BR-MIGRAR-002 | BC-Retorno: `v-if` oculta campo → valor nulo automaticamente | `target_business_rules.md` |
| BR-MIGRAR-003 | BC-Retorno + BC-Email: composable dupla proteção | `target_business_rules.md` |
| BR-MIGRAR-004 | BC-Início: Zod regex `/^\d*$/` + `<input inputmode="numeric">` | `target_business_rules.md` |
| BR-MIGRAR-005 | BC-Início: `<option disabled selected>Selecione</option>` | `target_business_rules.md` |
| BR-MIGRAR-006 | BC-Início: Composable `useGeolocation()` | `target_business_rules.md` |
| BR-MIGRAR-007 | BC-Retorno: CSS Grid + `v-for` agrupado por linha | `target_business_rules.md` |
| BR-MIGRAR-008 | BC-Início/BC-Retorno: `<component :is="campoComponent(field.tipo)">` | `target_business_rules.md` |
| BR-MIGRAR-009 | BC-Retorno: Composable `useConditionalFields()` | `target_business_rules.md` |
| BR-MIGRAR-010 | BC-Início + BC-Retorno: TypeScript types dos fields | `target_business_rules.md` |
| BR-MIGRAR-011 a BR-MIGRAR-016 | BC-Anexos: useAnexoStore + useImageCompression() | `target_business_rules.md` |
| BR-MIGRAR-017 a BR-MIGRAR-019 | BC-Equipamentos: useEquipamentoStore + Zod | `target_business_rules.md` |
| BR-MIGRAR-020 a BR-MIGRAR-025 | BC-Email: useComposeEmail() + netlify/functions/send.ts | `target_business_rules.md` |
| BR-MIGRAR-026 a BR-MIGRAR-036 | Distribuído: Zod schemas por feature + VeeValidate | `target_business_rules.md` |
| BR-MIGRAR-037 a BR-MIGRAR-042 | AGG-Record + shared/lib/db.ts | `target_business_rules.md` |
| BR-MIGRAR-043 a BR-MIGRAR-048 | BC-Sidebar: useSidebarStore + shared/lib/db.ts | `target_business_rules.md` |
| BR-MIGRAR-049 a BR-MIGRAR-054 | Distribuído: features/*/ + shared/lib/ | `target_business_rules.md` |
| BR-MIGRAR-055 a BR-MIGRAR-062 | App shell + shared/lib/ + entities/ | `target_business_rules.md` |

## Rastreabilidade para o legado

| Elemento novo | Origem no legado | Tipo de mapeamento |
|---|---|---|
| AGG-Record | `scripts/state.js` + `scripts/persistence.js` + `scripts/db.js` + `scripts/restore.js` | fundido |
| AGG-Attachment | `scripts/attachments.js` + `scripts/db.js` (store attachments) | fundido |
| AGG-Equipment | `scripts/equipment.js` | 1-para-1 |
| BC-Início | `scripts/iniciais.js` + `scripts/fields.js` (parcial) | fundido |
| BC-Retorno | `scripts/retornos.js` + `scripts/fields.js` (parcial) | fundido |
| BC-Anexos | `scripts/attachments.js` + `scripts/compress.js` | fundido |
| BC-Email | `scripts/email.js` + `scripts/send.js` | fundido |
| BC-Sidebar | `scripts/sidebar.js` | 1-para-1 |
| shared/lib/ | `scripts/db.js` + `scripts/storage.js` + `scripts/persistence.js` (parcial) | dividido |
| shared/ui/ | `scripts/ui.js` | 1-para-1 |
| shared/utils/ | `scripts/utils.js` | 1-para-1 |
| shared/types/ | `scripts/fields.js` + `scripts/styles.js` | novo (tipos consolidados) |
| netlify/functions/send.ts | `netlify/functions/send.js` | 1-para-1 (port TS) |
| IniciaisData (VO) | `scripts/state.js` § iniciais | extraído |
| RetornoData (VO) | `scripts/state.js` § retorno | extraído |
| Coordenadas (VO) | `scripts/utils.js` | extraído |
| ComposicaoEmail (VO) | `scripts/email.js` | extraído |

## Notas
- `AGG-Record` é o aggregate principal — todos os outros references ele via `uuid`
- `AGG-Equipment` é entidade fraca (não persistida individualmente, vive serializada dentro de Record)
- Value objects são imutáveis por construção (TypeScript `readonly` + interfaces)
- Não há eventos de domínio porque o paradigma é component-based reativo, não event-driven
- A normalização de número de equipamento ("00123" → "123") é responsabilidade do AGG-Equipment

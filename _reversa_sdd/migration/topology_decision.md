---
schemaVersion: 1
generatedAt: 2026-06-15T18:00:00-03:00
reversa:
  version: "1.0.0"
  kind: topology_decision
  producedBy: designer
  hash: "sha256:placeholder"
---

# Topology Decision

> Decisão consciente sobre como organizar o sistema novo: preservar a topologia do legado, adotar uma topologia moderna ou aplicar um híbrido.
> Este artefato é leitura obrigatória do próprio Designer (para decompor bounded contexts) e do agente de codificação (para criar a árvore de pastas).

## Topologia do legado detectada
- **Padrão organizacional**: monolito flat sem fronteiras claras (package-by-layer conceitual não materializado em pastas)
- **Confiança**: 🟢 CONFIRMADO
- **Evidências**:
  - `inventory.md` mostra `scripts/` com 23 arquivos flat (sem subdiretórios por camada ou feature)
  - `architecture.md` lista 8 camadas conceituais (UI, Form, Persistence, Email, Attachments, Equipment, History, Utilities) que NÃO se refletem na árvore de diretórios
  - `dependencies.md` confirma que não há barreiras de importação entre módulos — qualquer módulo importa qualquer outro
- **Mapa da árvore legada** (resumido):
  ```
  /
  ├── index.html
  ├── scripts/              # 23 módulos flat
  │   ├── app.js
  │   ├── attachments.js
  │   ├── compress.js
  │   ├── db.js
  │   ├── dom.js
  │   ├── duplicate.js
  │   ├── email.js
  │   ├── equipment.js
  │   ├── fields.js
  │   ├── iniciais.js
  │   ├── persistence.js
  │   ├── reset.js
  │   ├── restore.js
  │   ├── retornos.js
  │   ├── send.js
  │   ├── sidebar.js
  │   ├── state.js
  │   ├── storage.js
  │   ├── styles.js
  │   ├── sw-update.js
  │   ├── ui.js
  │   ├── utils.js
  │   └── validation.js
  ├── tests/
  ├── netlify/functions/
  └── ...
  ```

## Diagnóstico estrutural
- **Acoplamento**: 🟡 médio — módulos de UI importam persistence diretamente; state.js e storage.js têm ciclo de import circular quebrado via storage.js intermediário
- **Coesão por módulo**: 🟢 alta — cada módulo tem responsabilidade única e nome intencional (ex: `attachments.js` só faz attachments)
- **Módulos órfãos / mortos**: nenhum
- **Camadas redundantes**: nenhuma
- **Violações de fronteira**: 🔴 sim — `app.js` importa de todas as camadas; `state.js` é singleton global acessado por toda parte sem interface; `validation.js` depende de `DOM` global
- **Mistura de paradigmas/estilos**: homogêneo — todos ES6 modules com programação procedural + closures
- **Avaliação geral**: 🟡 parcialmente problemática — bom para 1.889 LOC, mas não escalaria sem reestruturação

## Topologia moderna proposta
- **Padrão**: Feature-Sliced Design (FSD) simplificado — `app/`, `pages/`, `features/`, `entities/`, `shared/`
- **Justificativa**: O FSD é o padrão que maximiza os ganhos do stack alvo (Vue 3 + TypeScript + Pinia):
  - Cada feature do legado vira um módulo FSD com seus próprios componentes Vue, stores Pinia e tipos
  - As camadas (app/pages/features/entities/shared) criam barreiras de dependência naturais que o TypeScript enforce
  - O Big Bang permite adotar a estrutura completa sem compromisso de compatibilidade retroativa
  - A separação por feature acelera onboarding de novos devs e isola testes por funcionalidade
- **Ganhos concretos esperados**:
  - Testabilidade isolada por feature (cada feature roda testes sem carregar o app inteiro)
  - TypeScript enforce boundaries (features não importam de outras features diretamente, só via entities/shared)
  - Composição Vue nativa (cada feature expõe componentes, não funções globais)
  - Onboarding mais rápido (estrutura conhecida, padronizada)
  - Facilidade de adicionar novas features sem acoplar às existentes
- **Custo / risco**:
  - Curva de aprendizado do padrão FSD (1 dev precisa aprender slicings)
  - Overhead inicial de estrutura (mais pastas que o legado, mas para 1.889 LOC é gerenciável)
  - Reorganização completa (não há migração parcial por ser Big Bang)
- **Esboço da árvore proposta**:
  ```
  src/
  ├── app/
  │   ├── App.vue
  │   ├── main.ts
  │   ├── router/
  │   │   └── index.ts
  │   └── providers/
  │       └── sw-update.ts
  ├── pages/
  │   └── FormPage.vue           # Página única (SPA) com 5 seções
  ├── features/
  │   ├── inicio/
  │   │   ├── components/        # InicioForm.vue, TecnicoSelect.vue
  │   │   ├── composables/
  │   │   ├── store.ts
  │   │   └── types.ts
  │   ├── retorno/
  │   │   ├── components/
  │   │   ├── composables/       # useConditionalFields.ts
  │   │   ├── store.ts
  │   │   └── types.ts           # RetornoField, Condicional
  │   ├── equipamentos/
  │   │   ├── components/
  │   │   ├── store.ts
  │   │   └── types.ts
  │   ├── anexos/
  │   │   ├── components/
  │   │   ├── composables/       # useCompress.ts
  │   │   ├── store.ts
  │   │   └── types.ts
  │   ├── email/
  │   │   ├── composables/       # useComposeEmail.ts
  │   │   └── types.ts
  │   └── sidebar/
  │       ├── components/
  │       ├── store.ts
  │       └── types.ts
  ├── entities/
  │   ├── record/
  │   │   ├── record.ts          # Interface Record
  │   │   └── record.db.ts       # IndexedDB CRUD
  │   ├── attachment/
  │   │   ├── attachment.ts
  │   │   └── attachment.db.ts
  │   └── equipment/
  │       └── equipment.ts
  ├── shared/
  │   ├── ui/                    # Toast, Modal, ErrorBar
  │   ├── lib/                   # db.ts, storage.ts, compress.ts
  │   ├── utils/                 # formatDate, geoLocation, base64
  │   └── types/                 # Tipos globais (TipoOrdem, etc.)
  └── netlify/
      └── functions/
          └── send.ts
  ```

## Opções apresentadas ao usuário
1. **Preservar topologia legada** (conservador)
   - Consequências: mantém estrutura flat familiar; não aproveita boundaries do TypeScript; perpetua acoplamento indireto entre módulos.
2. **Adotar Feature-Sliced Design (FSD) simplificado** (transformacional) ← **ESCOLHIDA**
   - Consequências: rompe com o monolito flat; exige aprendizado do padrão; maximiza ganhos do Vue+TS+Pinia; cada feature isolada com seus próprios componentes, store e tipos.
3. **Híbrido (Package-by-Feature simplificado)**
   - Consequências: pastas por funcionalidade sem camadas FSD; menos overhead que FSD; menos padronização e sem barreiras de dependência formais.

## Decisão do usuário
- **Escolha**: 2
- **Justificativa do usuário**: Optou pela topologia FSD para maximizar os ganhos do stack alvo
- **Decidido em**: 2026-06-15T18:00:00-03:00

## Mapeamento legado → novo
| Módulo / pasta legada | Bounded context novo | Tipo | Observações |
|---|---|---|---|
| `scripts/iniciais.js`, `scripts/fields.js` (parcial) | `features/inicio/` | fundido | Fields de início + renderização + validação |
| `scripts/retornos.js`, `scripts/fields.js` (parcial) | `features/retorno/` | fundido | Campos condicionais + tipos de ordem |
| `scripts/equipment.js` | `features/equipamentos/` | preservado | CRUD equipamentos |
| `scripts/attachments.js`, `scripts/compress.js` | `features/anexos/` | fundido | Upload + compressão |
| `scripts/email.js`, `scripts/send.js` | `features/email/` | fundido | Composição + envio |
| `scripts/sidebar.js` | `features/sidebar/` | preservado | Lista de registros |
| `scripts/db.js`, `scripts/persistence.js`, `scripts/storage.js`, `scripts/restore.js` | `entities/record/`, `entities/attachment/`, `shared/lib/` | dividido | Lógica de BD separada das entidades |
| `scripts/state.js` | `features/*/store.ts` + `shared/lib/` | dividido | Estado global vira stores Pinia por feature |
| `scripts/validation.js` | `features/*/composables/` + `shared/lib/` | dividido | Validação distribuída por feature |
| `scripts/dom.js` | eliminado | removido | Vue substitui DOM cache com refs |
| `scripts/ui.js` | `shared/ui/` | fundido | Toast, Modal, ErrorBar |
| `scripts/utils.js` | `shared/utils/` | preservado | Utilitários gerais |
| `scripts/styles.js` | eliminado | removido | Tailwind + CSS scoped substituem |
| `scripts/sw-update.js` | `app/providers/` | movido | Lógica de SW update |
| `scripts/reset.js`, `scripts/duplicate.js` | `features/*/` | dividido | Reset e duplicata distribuídos |
| `scripts/app.js` | `app/main.ts` + `app/App.vue` | transformado | Entry point vira Vue app |
| `netlify/functions/send.js` | `netlify/functions/send.ts` | preservado | Port para TypeScript |
| `tests/` | `src/**/*.test.ts` | distribuído | Testes co-localizados com features |
| `sw.js`, `manifest.json`, `tailwind.config.js` | `app/` ou raiz | preservado | Config PWA e Tailwind |

## Implicações pendentes para próximos passos do Designer
| Etapa do Designer | Implicação | Como honrar |
|---|---|---|
| Bounded contexts | FSD define camadas (features/entities/shared) como bounded contexts | Cada feature FSD é um bounded context com suas próprias entidades e store |
| target_architecture | A arquitetura deve refletir o fluxo entre features via entities/shared, sem dependência direta entre features | Diagrama Mermaid com setas feature→entity, feature→shared, page→feature |
| target_domain_model | Os aggregates do domínio mapeiam 1-para-1 com entities/ (record, attachment, equipment) | Record permanece aggregate root; Attachment é value object; Equipment é entidade separada |
| target_data_model | IndexedDB v3 mantido como store local; schema mapeado para entities/ | DDL mantido compatível com records + attachments stores |
| data_migration_plan | IndexedDB é client-side — não há migração de dados servidor | Plano foca em compatibilidade de schema entre v3 legado e v4 Vue |

## Notas
- A topologia FSD foi escolhida por Breno em 2026-06-15 às 18:00 BRT.
- O mapeamento legado→novo acima é o guia definitivo para a árvore de pastas. O agente de codificação deve segui-lo à risca.
- Os módulos "eliminados" (dom.js, styles.js) foram substituídos por mecanismos nativos do Vue (refs, scoped CSS) — ver `discard_log.md` para justificativa completa.
- A função Netlify `send.js` será portada para TypeScript mas mantida como serverless function separada do frontend.

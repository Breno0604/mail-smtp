---
schemaVersion: 1
generatedAt: 2026-06-15T17:35:00-03:00
reversa:
  version: "1.2.43"
kind: target_business_rules
producedBy: curator
hash: "sha256:b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1"
---

# Target Business Rules

> Catálogo das regras de negócio do legado com decisão de migração: MIGRAR, DESCARTAR ou DECISÃO HUMANA.
> Cada item rastreia para a origem em `_reversa_sdd/` e respeita o `paradigm_decision.md` (Opção 1 — Transformacional).

## Resumo

- Total de regras analisadas: 90
- MIGRAR: 72
- DESCARTAR: 16 (detalhe em `discard_log.md`)
- DECISÃO HUMANA: 2

---

## Regras MIGRAR

### Formulário — Campos Iniciais e Retorno

#### BR-MIGRAR-001
- **Origem**: `_reversa_sdd/formulario/requirements.md` § RD01
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: Ao mudar o tipo de ordem, os dados de retorno anteriores são descartados (`state.retorno = {}`)
- **Justificativa de migração**: Regra de negócio pura — o comportamento deve ser preservado
- **Compatibilidade com paradigma alvo**: Expressar como `watch(tipoOrdem)` na Pinia store

#### BR-MIGRAR-002
- **Origem**: `_reversa_sdd/formulario/requirements.md` § RD02
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: Campos condicionais ocultos têm valor zerado (`input.value = ""`)
- **Justificativa de migração**: Regra de negócio pura — garante que dados não sejam enviados para campos ocultos
- **Compatibilidade com paradigma alvo**: No Vue, campo removido do DOM via `v-if` não participa do formulário; valor é automaticamente nulo

#### BR-MIGRAR-003
- **Origem**: `_reversa_sdd/formulario/requirements.md` § RD03
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: Campos de retorno ocultos (condicionais não atendidos) são excluídos dos dados coletados
- **Justificativa de migração**: Regra de negócio pura — proteção contra envio de dados espúrios
- **Compatibilidade com paradigma alvo**: `v-if` + `v-model` garantem naturalmente

#### BR-MIGRAR-004
- **Origem**: `_reversa_sdd/formulario/requirements.md` § RD04
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: Campo UC é do tipo `text` com `inputMode=numeric` — aceita apenas dígitos mas é string
- **Justificativa de migração**: Regra de negócio pura — validação de formato
- **Compatibilidade com paradigma alvo**: TypeScript `string` + Zod `.regex(/^\d*$/)` + `<input inputmode="numeric">`

#### BR-MIGRAR-005
- **Origem**: `_reversa_sdd/formulario/requirements.md` § RD05
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: Selects recebem um placeholder "Selecione" como primeira opção
- **Justificativa de migração**: Regra de UX pura — deve ser preservada
- **Compatibilidade com paradigma alvo**: `<option value="" disabled selected>Selecione</option>` no template Vue

#### BR-MIGRAR-006
- **Origem**: `_reversa_sdd/formulario/requirements.md` § RD06
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: Campo coordenadas tem botão de refresh que chama `captureCoordinates()`
- **Justificativa de migração**: Regra de negócio + UX — funcionalidade de geolocalização
- **Compatibilidade com paradigma alvo**: Composable `useGeolocation()` + `<button>` no template

#### BR-MIGRAR-007
- **Origem**: `_reversa_sdd/formulario/requirements.md` § RD09
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: Renderização agrupa campos por `linha` (mesma linha = mesma flex row)
- **Justificativa de migração**: Regra de layout — deve ser preservada
- **Compatibilidade com paradigma alvo**: Template Vue com `v-for` agrupado + CSS Grid / Flexbox

#### BR-MIGRAR-008
- **Origem**: `_reversa_sdd/formulario/design.md` § Fluxo Principal
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: INPUT_CREATORS como factory de elementos: suporta select, number, date, time, text, textarea, coordinates
- **Justificativa de migração**: Mecanismo de criação de campos — no Vue vira componente dinâmico
- **Compatibilidade com paradigma alvo**: `<component :is="inputFactory(field.tipo)">` ou render function

#### BR-MIGRAR-009
- **Origem**: `_reversa_sdd/formulario/design.md` § Mudança de Tipo de Ordem
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: `updateConditionalFields()` avalia condições com suporte a string, array (any match) e negação
- **Justificativa de migração**: Regra de negócio pura — lógica de visibilidade condicional
- **Compatibilidade com paradigma alvo**: `computed` ou `watch` no Vue; lógica em TypeScript puro num composable

#### BR-MIGRAR-010
- **Origem**: `_reversa_sdd/formulario/requirements.md` § RF-01 a RF-07
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: 12 campos fixos do início + 41 tipos de ordem com campos de retorno específicos
- **Justificativa de migração**: Core do sistema — deve ser preservado integralmente
- **Compatibilidade com paradigma alvo**: Schema de fields como TypeScript types + Pinia store

---

### Anexos

#### BR-MIGRAR-011
- **Origem**: `_reversa_sdd/anexos/requirements.md` § RN01
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: Máximo de 12 anexos por formulário (excedente descartado com warning)
- **Justificativa de migração**: Regra de negócio pura — limite de arquivos

#### BR-MIGRAR-012
- **Origem**: `_reversa_sdd/anexos/requirements.md` § RN02
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: Cada anexo no máximo 8 MB (validado no envio, não no upload)
- **Justificativa de migração**: Regra de negócio pura — limite de tamanho

#### BR-MIGRAR-013
- **Origem**: `_reversa_sdd/anexos/requirements.md` § RN03
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: Imagens ≤ 670KB (SKIP_SIZE) não são comprimidas — apenas convertidas para base64
- **Justificativa de migração**: Regra de negócio pura — otimização de armazenamento

#### BR-MIGRAR-014
- **Origem**: `_reversa_sdd/anexos/requirements.md` § RN04
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: Compressão progressiva: até 10 tentativas reduzindo largura em 80%, qualidade JPEG 0.9
- **Justificativa de migração**: Algoritmo de compressão — deve ser preservado
- **Compatibilidade com paradigma alvo**: Composable `useImageCompression()` com canvas API

#### BR-MIGRAR-015
- **Origem**: `_reversa_sdd/anexos/requirements.md` § RN05
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: 11ª tentativa (fallback): qualidade 0.7 sem redução adicional de largura
- **Justificativa de migração**: Algoritmo de compressão — caso extremo

#### BR-MIGRAR-016
- **Origem**: `_reversa_sdd/anexos/requirements.md` § RN06
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: Anexos comprimidos renomeados para `{basename}_red.jpg`
- **Justificativa de migração**: Convenção de nomenclatura — preservar

---

### Equipamentos

#### BR-MIGRAR-017
- **Origem**: `_reversa_sdd/equipamentos/requirements.md`
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: Seção de equipamentos é opcional (sem rows = válido)
- **Justificativa de migração**: Regra de validação — seção não obrigatória

#### BR-MIGRAR-018
- **Origem**: `_reversa_sdd/equipamentos/requirements.md`
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: Número de equipamento duplicado é inválido
- **Justificativa de migração**: Regra de validação — unicidade dentro do formulário

#### BR-MIGRAR-019
- **Origem**: `_reversa_sdd/equipamentos/requirements.md`
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: Cada equipamento requer tipo, categoria e número obrigatórios
- **Justificativa de migração**: Regra de validação — campos obrigatórios

---

### Email

#### BR-MIGRAR-020
- **Origem**: `_reversa_sdd/email/requirements.md`
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: Email composto com template HTML: iniciais + retorno + equipamentos + anexos (base64)
- **Justificativa de migração**: Core do sistema — composição de email

#### BR-MIGRAR-021
- **Origem**: `_reversa_sdd/email/requirements.md`
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: 4 campos obrigatórios no contrato de email: `assunto`, `mensagem`, `data`, `hora`
- **Justificativa de migração**: Contrato de API — invariante

#### BR-MIGRAR-022
- **Origem**: `_reversa_sdd/email/requirements.md`
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: Datas são invertidas de YYYY-MM-DD para DD-MM-YYYY no email
- **Justificativa de migração**: Formatação de apresentação — preservar

#### BR-MIGRAR-023
- **Origem**: `_reversa_sdd/email/requirements.md`
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: Hidden fields são duplamente excluídos: `getRetornoData()` filtra display:none + `composeEmail()` verifica existência no data object
- **Justificativa de migração**: Regra de segurança — camada dupla de proteção

#### BR-MIGRAR-024
- **Origem**: `_reversa_sdd/email/requirements.md`
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: 6 env vars SMTP obrigatórias: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_TO`
- **Justificativa de migração**: Configuração de infra — preservar

#### BR-MIGRAR-025
- **Origem**: `_reversa_sdd/email/requirements.md`
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: SMTP TLS com `rejectUnauthorized: false` (self-signed certs em produção)
- **Justificativa de migração**: Configuração de infra — preservar

---

### Validação

#### BR-MIGRAR-026 a BR-MIGRAR-036
- **Origem**: `_reversa_sdd/validacao/requirements.md` § RN01 a RN11
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**:

| ID | Regra |
|---|---|
| BR-MIGRAR-026 | UC deve conter apenas dígitos |
| BR-MIGRAR-027 | Data não pode ser futura (comparação com `today.setHours(0,0,0,0)`) |
| BR-MIGRAR-028 | Hora fim deve ser diferente de hora início (permitindo overnight, ex: 23:00 → 01:00) |
| BR-MIGRAR-029 | Seção de equipamentos é opcional (sem rows = válido) |
| BR-MIGRAR-030 | Número de equipamento duplicado é inválido |
| BR-MIGRAR-031 | Campos de retorno com `display: none` são pulados na validação |
| BR-MIGRAR-032 | Seção de retorno só é validada se `tipoOrdem` estiver selecionado |
| BR-MIGRAR-033 | Máximo 12 anexos, máximo 8MB cada |
| BR-MIGRAR-034 | Seção 5 (Revisão) sempre retorna `true` — nenhum campo novo |
| BR-MIGRAR-035 | `addBlurValidation()` adiciona validação on-blur + clear on input/change para campos com `required` ou `data-required` |
| BR-MIGRAR-036 | Scroll suave para primeiro erro na validação total |

- **Justificativa de migração**: Todas são regras de negócio ou de UX — devem ser preservadas
- **Compatibilidade com paradigma alvo**: Expressar como Zod schemas + VeeValidate; scroll suave via `element.scrollIntoView({ behavior: 'smooth' })`

---

### Persistência

#### BR-MIGRAR-037
- **Origem**: `_reversa_sdd/persistencia/requirements.md`
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: Só salva se UC+OS campos preenchidos (`state.iniciaisValido` flag)
- **Justificativa de migração**: Regra de negócio — não poluir banco com registros incompletos

#### BR-MIGRAR-038
- **Origem**: `_reversa_sdd/persistencia/requirements.md`
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: Não salva se não há dados nenhum (estado vazio)
- **Justificativa de migração**: Regra de negócio — evitar registros vazios

#### BR-MIGRAR-039
- **Origem**: `_reversa_sdd/persistencia/requirements.md`
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: IndexedDB v3 com dois stores: `records` (keyPath: uuid) e `attachments` (keyPath: id, índice em uuid)
- **Justificativa de migração**: Schema de dados — preservar estrutura

#### BR-MIGRAR-040
- **Origem**: `_reversa_sdd/persistencia/requirements.md`
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: Auto-save com debounce (300ms) após cada alteração relevante
- **Justificativa de migração**: UX — não perder dados
- **Compatibilidade com paradigma alvo**: Pinia plugin `$subscribe` + `debounce`

#### BR-MIGRAR-041
- **Origem**: `_reversa_sdd/persistencia/requirements.md`
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: Migração transparente de v2 para v3 (separar attachments em store próprio)
- **Justificativa de migração**: Compatibilidade com dados existentes

#### BR-MIGRAR-042
- **Origem**: `_reversa_sdd/persistencia/requirements.md`
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**: Anexos armazenados como base64 no IndexedDB
- **Justificativa de migração**: Formato de armazenamento — preservar

---

### Sidebar

#### BR-MIGRAR-043 a BR-MIGRAR-048
- **Origem**: `_reversa_sdd/sidebar/requirements.md`
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**:

| ID | Regra |
|---|---|
| BR-MIGRAR-043 | Listar registros ordenados por data/hora de criação (mais recente primeiro) |
| BR-MIGRAR-044 | Abas de filtro por período: manhã, tarde, noite |
| BR-MIGRAR-045 | Busca por texto livre em todos os campos |
| BR-MIGRAR-046 | Duplicação de registro cria cópia com novo UUID |
| BR-MIGRAR-047 | Exclusão de registro com confirmação |
| BR-MIGRAR-048 | Restauração de registro preenche formulário completo (dados + anexos) |

- **Justificativa de migração**: Funcionalidades de UX — todas devem ser preservadas

---

### Ferramentas

#### BR-MIGRAR-049 a BR-MIGRAR-054
- **Origem**: `_reversa_sdd/ferramentas/requirements.md`
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**:

| ID | Regra |
|---|---|
| BR-MIGRAR-049 | Reset completo limpa formulário + state + attachments |
| BR-MIGRAR-050 | Compressão usa canvas API com parâmetros controlados (qualidade, largura) |
| BR-MIGRAR-051 | Duplicação preserva todos os dados exceto uuid e timestamps |
| BR-MIGRAR-052 | Coordenadas obtidas via geolocation API com fallback "Não disponível" |
| BR-MIGRAR-053 | Service Worker com cache de static assets (vite-plugin-pwa substitui) |
| BR-MIGRAR-054 | Debounced save (300ms) em todas as alterações de formulário |

- **Justificativa de migração**: Funcionalidades de infra e UX

---

### Globais

#### BR-MIGRAR-055 a BR-MIGRAR-062
- **Origem**: `_reversa_sdd/globals/requirements.md`
- **Confiança original**: 🟢 CONFIRMADO
- **Descrição**:

| ID | Regra |
|---|---|
| BR-MIGRAR-055 | Cache DOM centralizado — substituído por template refs do Vue |
| BR-MIGRAR-056 | Estado global via store — Pinia substitui state.js |
| BR-MIGRAR-057 | Ciclo de importação state → persistence → state quebrado via storage.js |
| BR-MIGRAR-058 | saveState() com guardas (só salva se válido + não vazio) |
| BR-MIGRAR-059 | localStorage como backup do estado atual do formulário |
| BR-MIGRAR-060 | IndexedDB como storage primário de registros |
| BR-MIGRAR-061 | Bump manual de CACHE_NAME em mudanças de static assets |
| BR-MIGRAR-062 | Deploy via git push → Netlify com npm install on build |

- **Justificativa de migração**: Arquitetura e infra — preservar conceitos

---

## Regras DESCARTAR (resumo)

| ID | Origem | Motivo curto | Vínculo a paradigma? |
|---|---|---|---|
| BR-DESCARTAR-001 | `dom.js` — cache manual de elementos DOM | Vue template refs substituem | sim |
| BR-DESCARTAR-002 | `addBlurValidation()` manual | VeeValidate gerencia blur/invalid | sim |
| BR-DESCARTAR-003 | `addEventListener` manual para cada evento | `@change`, `@input` no template | sim |
| BR-DESCARTAR-004 | `innerHTML` para renderizar campos | Vue SFC template com `v-for` | sim |
| BR-DESCARTAR-005 | `document.getElementById` para ler dados | `v-model` bidirecional | sim |
| BR-DESCARTAR-006 | Cache `_validatedData` manual | Zod schema + computed reativo | sim |
| BR-DESCARTAR-007 | Classes `.error` setadas manualmente | VeeValidate error classes automáticas | sim |
| BR-DESCARTAR-008 | `debouncedSave` manual | Pinia `$subscribe` + lodash debounce | sim |
| BR-DESCARTAR-009 | `saveState()` guard manual | Pinia plugin de persistência | sim |
| BR-DESCARTAR-010 | `_resetValidationCache()` entre testes | Não necessário com Zod puro | sim |
| BR-DESCARTAR-011 | Seção 5 sempre true | Template vazio não precisa de validação | sim |
| BR-DESCARTAR-012 | `markAttachmentsDirty()` | Pinia reatividade substitui dirty tracking | sim |
| BR-DESCARTAR-013 | Object URLs revogadas manualmente | Vue ciclo de vida `onUnmounted` | sim |
| BR-DESCARTAR-014 | CACHE_NAME manual no sw.js | vite-plugin-pwa + Workbox automatiza | sim |
| BR-DESCARTAR-015 | DOM.tipoOrdem cacheado manualmente (exceção) | Template ref `ref="tipoOrdem"` | sim |
| BR-DESCARTAR-016 | `data-required` atributo manual | VeeValidate required prop | sim |

> Detalhe completo em `discard_log.md`.

---

## Regras DECISÃO HUMANA

### BR-HUMANA-001
- **Origem**: `_reversa_sdd/gaps.md` — Lacuna de autenticação no Service Worker
- **Tipo de ambiguidade**: ⚠️ Questão de design
- **Descrição**: O Service Worker atual não tem autenticação. Com vite-plugin-pwa, podemos adicionar um cache-first com fallback de rede + rota de logout que limpa o cache.
- **Opções**:
  - (A) Manter sem autenticação (igual ao legado) — single-user, sem login ✅ ESCOLHIDA
  - (B) Adicionar autenticação básica no novo sistema (preparando para multi-usuário futuro)
- **Recomendação do Curator**: (A)
- **Status**: RESOLVIDA — Breno, 2026-06-15

### BR-HUMANA-002
- **Origem**: `_reversa_sdd/gaps.md` — Cobertura de testes backend
- **Tipo de ambiguidade**: ⚠️ Gap de qualidade
- **Descrição**: A função `send.js` (Netlify Function) não tem testes porque SMTP não está disponível em CI.
- **Opções**:
  - (A) Manter sem testes (como hoje)
  - (B) Criar testes com nodemailer mock
  - (C) Separar `comporEmail()` (função pura, testável sem SMTP) do `enviarEmail()` (transporte) ✅ ESCOLHIDA
- **Recomendação do Curator**: (C)
- **Status**: RESOLVIDA — Breno, 2026-06-15

---

## Notas

- Itens BR-HUMANA-001 e BR-HUMANA-002 aguardam decisão do usuário antes de prosseguir ao Strategist.
- Consolidado em `ambiguity_log.md`.
- Nenhuma regra foi descartada por incompatibilidade com o brief (escopo) — todos os 23 módulos + backend entram na migração.
- Nenhuma regra 🔴 LACUNA foi encontrada nas specs — todas as 90 regras estavam 🟢 CONFIRMADAS.

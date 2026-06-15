---
schemaVersion: 1
generatedAt: 2026-06-15T18:25:00-03:00
reversa:
  version: "1.2.43"
  kind: target_screens
  producedBy: screen-translator
  mode: modernized
  sourcePlatform: html-legacy
  targetPlatform: web-spa
  adapter: html_legacy__spa
  screenCount: 9
  hash: "sha256:placeholder"
---

# Target Screens

> Especificação executável de cada tela do sistema novo, derivada do legado segundo o modo aprovado em `screen_modernization_decision.md` (modernizado).
> Conteúdo textual preservado literalmente. Nenhuma revisão linguística foi aprovada.

## Resumo

- **Modo aplicado**: modernizado
- **Telas geradas**: 9
- **Adapter**: `html_legacy__spa` (formato `route-component`)
- **Tokens consumidos**: ver `_reversa_sdd/design-system/tokens-derived.md`
- **Golden files**: 0 (manifest em `_reversa_sdd/screens/golden/manifest.yaml`)
- **Deviations registradas**: 0 em `screen_deviation_log.md`

---

## Tela: SCR-01 — Sidebar

**Origem**: `scripts/sidebar.js` | `screnns/aba_lateral.jpeg`
**Modo aplicado**: modernizado
**Componentes do design-system**: `[color.bg.sidebar, color.text.sidebar, color.bg.sidebar-hover, font.size.sm, spacing.sidebar-width]`
**Pontos de interpolação**: `{{records}}`, `{{filteredRecords}}`, `{{searchQuery}}`, `{{activePeriod}}`
**Tela crítica?**: não

### Especificação

```yaml
spec.kind: route-component
spec.route: / (layout slot lateral)
spec.layout: AppLayout (slot "sidebar")
spec.states: [idle, loading, error]
spec.component:
  component: SidebarPanel
  legacy_origin: "scripts/sidebar.js"
  state:
    records: Record[]
    searchQuery: string
    activePeriod: 'manha' | 'tarde' | 'noite' | null
  children:
    - component: SearchInput
      props:
        placeholder: "Buscar por UC, OS ou tipo..."
        v-model: $state.searchQuery
    - component: PeriodFilter
      props:
        periods: ['manhã', 'tarde', 'noite']
        active: $state.activePeriod
        onChange: filterByPeriod
    - component: RecordList
      children:
        - component: RecordListItem  (v-for record in filteredRecords)
          props:
            record: Record
            onClick: restoreRecord(record.uuid)
          children:
            - component: RecordStatusBadge
              props:
                status: record.status  # draft | sent
            - component: RecordInfo
              props:
                uc: record.iniciais.uc
                os: record.iniciais.os
                tipo: record.tipoOrdem
                updatedAt: record.updatedAt
            - component: RecordActions
              children:
                - component: IconButton (duplicar)
                  action: duplicateRecord(record.uuid)
                - component: IconButton (excluir)
                  action: deleteRecord(record.uuid)
                  confirm: "Tem certeza que deseja excluir este registro?"
spec.state_messages:
  loading: "Carregando registros..."
  error: "Erro ao carregar registros. Tente novamente."
  empty: "Nenhum registro encontrado."
```

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | Lista de registros carregada | Input de busca + filtros + lista |
| Loading | Buscando registros do IndexedDB | Spinner + "Carregando registros..." |
| Error | Falha ao abrir IndexedDB | "Erro ao carregar registros. Tente novamente." |
| Empty | Nenhum registro corresponde ao filtro | "Nenhum registro encontrado." |

---

## Tela: SCR-02 — Sec-Inicio

**Origem**: `scripts/iniciais.js` | `screnns/etapa_iniciais.jpeg`
**Modo aplicado**: modernizado
**Componentes do design-system**: `[color.bg.card, color.text.primary, color.text.muted, color.border, radius.card, shadow.card, spacing.section, spacing.gap, spacing.input-padding, font.size.base, font.size.sm]`
**Pontos de interpolação**: `{{iniciaisData}}`, `{{tiposOrdem}}`, `{{tecnicos}}`, `{{municipios}}`, `{{placas}}`
**Tela crítica?**: sim (dados essenciais da OS)

### Especificação

```yaml
spec.kind: route-component
spec.route: / (section 1 do form)
spec.layout: FormPage (slot "inicio")
spec.states: [idle, error]
spec.component:
  component: InicioForm
  legacy_origin: "scripts/iniciais.js + scripts/fields.js (iniciaisFields)"
  state:
    data: IniciaisData
    validationErrors: Record<string, string>
  children:
    - component: SectionTitle
      content: "DADOS DA OS"
    - component: FieldGrid (2-col responsive grid)
      children:
        # Linha 1: UC + OS
        - component: CampoInicio
          props:
            field: { nome: "uc", label: "UC", tipo: "text", inputmode: "numeric", required: true }
            v-model: $state.data.uc
            error: $state.validationErrors['iniciais-uc']
        - component: CampoInicio
          props:
            field: { nome: "os", label: "OS", tipo: "text", required: true }
            v-model: $state.data.os
            error: $state.validationErrors['iniciais-os']
        # Linha 2: tipo-ordem (select)
        - component: CampoInicio
          props:
            field: { nome: "tipo-ordem", label: "TIPO DE ORDEM", tipo: "select", opcoes: $tiposOrdem, required: true }
            v-model: $state.data.tipoOrdem
            placeholder: "Selecione"
            onChange: onTipoOrdemChange
        # Linha 3: parceiro-lider + municipio (selects)
        - component: CampoInicio
          props:
            field: { nome: "parceiro-lider", label: "PARCEIRO / LIDER", tipo: "select", opcoes: $tecnicos }
            v-model: $state.data.parceiroLider
            placeholder: "Selecione"
        - component: CampoInicio
          props:
            field: { nome: "municipio", label: "MUNICIPIO", tipo: "select", opcoes: $municipios }
            v-model: $state.data.municipio
            placeholder: "Selecione"
        # Linha 4: placa (select)
        - component: CampoInicio
          props:
            field: { nome: "placa", label: "PLACA", tipo: "select", opcoes: $placas }
            v-model: $state.data.placa
            placeholder: "Selecione"
        # Linha 5: data + hora-inicio + hora-fim
        - component: CampoInicio
          props:
            field: { nome: "data", label: "DATA", tipo: "date", required: true }
            v-model: $state.data.data
        - component: CampoInicio
          props:
            field: { nome: "hora-inicio", label: "HORA INICIO", tipo: "time", required: true }
            v-model: $state.data.horaInicio
        - component: CampoInicio
          props:
            field: { nome: "hora-fim", label: "HORA FIM", tipo: "time", required: true }
            v-model: $state.data.horaFim
        # Linha 6: coordenadas (with refresh button)
        - component: CampoInicio
          props:
            field: { nome: "coordenadas", label: "COORDENADAS", tipo: "coordinates" }
            v-model: $state.data.coordenadas
          children:
            - component: RefreshButton
              action: captureCoordinates
        # Linha 7: notificado (select SIM/NÃO)
        - component: CampoInicio
          props:
            field: { nome: "notificado", label: "NOTIFICADO", tipo: "select", opcoes: ["SIM", "NÃO"] }
            v-model: $state.data.notificado
            placeholder: "Selecione"
        # Linha 8: complemento (textarea full width)
        - component: CampoInicio
          props:
            field: { nome: "complemento", label: "COMPLEMENTO", tipo: "textarea" }
            v-model: $state.data.complemento
spec.state_messages:
  error: "{{validationErrors}}"
```

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | Formulário pronto para preenchimento | Todos os campos renderizados |
| Error | Validação inline no blur | Mensagem abaixo do campo + borda vermelha |

---

## Tela: SCR-03 — Sec-Retorno

**Origem**: `scripts/retornos.js` + `scripts/fields.js` (retornoFieldsByTipo)
**Modo aplicado**: modernizado
**Componentes do design-system**: `[color.bg.card, radius.card, shadow.card, spacing.section, spacing.gap, font.size.sm]`
**Pontos de interpolação**: `{{retornoFields}}`, `{{retornoData}}`, `{{tipoOrdem}}`
**Tela crítica?**: sim (dados específicos do tipo de ordem)

### Especificação

```yaml
spec.kind: route-component
spec.route: / (section 2 do form)
spec.layout: FormPage (slot "retorno")
spec.states: [idle, empty]
spec.component:
  component: RetornoForm
  legacy_origin: "scripts/retornos.js"
  state:
    tipoOrdem: string | null
    fields: RetornoField[]
    data: Record<string, string>
    visibleFields: computed (baseado em condicionais)
  children:
    - component: SectionTitle
      content: "RETORNO"
    - component: ConditionalFieldGroup (v-if tipoOrdem != null)
      children:
        - component: FieldRow  (v-for field in visibleFields, agrupado por linha)
          children:
            - component: CampoRetorno (v-if field.tipo !== 'description')
              props:
                field: field
                v-model: $data[field.nome]
            - component: DescriptionText (v-if field.tipo === 'description')
              content: field.label
    - component: PlaceholderText (v-if tipoOrdem == null)
      content: "Selecione um Tipo de Ordem na seção DADOS DA OS para ver os campos de retorno."
  # Comportamento: ao mudar tipoOrdem, descarta data anterior e reavalia condicionais
  transitions:
    - event: tipoOrdem.change
      action: resetRetornoData()
spec.state_messages:
  empty: "Selecione um Tipo de Ordem na seção DADOS DA OS para ver os campos de retorno."
```

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | Tipo de ordem selecionado, campos visíveis | Campos dinâmicos do tipo selecionado |
| Empty | Nenhum tipo de ordem selecionado | "Selecione um Tipo de Ordem..." |

---

## Tela: SCR-04 — Sec-Equipamentos

**Origem**: `scripts/equipment.js` + `scripts/validation.js` (BR-MIGRAR-017 a BR-MIGRAR-019)
**Modo aplicado**: modernizado
**Componentes do design-system**: `[color.bg.card, color.error, radius.card, shadow.card, spacing.section, spacing.gap, font.size.sm]`
**Pontos de interpolação**: `{{equipamentos}}`, `{{equipamentoErrors}}`
**Tela crítica?**: não (seção opcional)

### Especificação

```yaml
spec.kind: route-component
spec.route: / (section 3 do form)
spec.layout: FormPage (slot "equipamentos")
spec.states: [idle, error]
spec.component:
  component: EquipamentoForm
  legacy_origin: "scripts/equipment.js"
  state:
    items: Equipment[]
    validationErrors: Record<string, string>
  children:
    - component: SectionTitle
      content: "EQUIPAMENTOS"
    - component: EquipamentoRow (v-for (equip, index) in items)
      props:
        index: index
        equip: equip
      children:
        - component: SelectField
          props:
            label: "STATUS"
            opcoes: ["Instalado", "Retirado"]
            v-model: equip.status
        - component: SelectField
          props:
            label: "CATEGORIA"
            opcoes: ["Medidor", "Display", "Conjunto", "TC", "TP"]
            v-model: equip.categoria
        - component: InputField
          props:
            label: "NUMERO"
            type: text
            v-model: equip.numero
            error: validationErrors[`equipamentos-${index}-numero`]
        - component: RemoveButton
          action: removeEquipment(index)
    - component: AddButton
      label: "+ Adicionar Equipamento"
      action: addEquipment()
spec.validation:
  equipamentos[].numero: unique (dentro da lista)
  equipamentos[].status: required
  equipamentos[].categoria: required
  equipamentos[].numero: required
spec.state_messages:
  error: "Verifique os campos obrigatórios dos equipamentos."
```

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | Seção pronta (vazia ou com equipamentos) | Lista de equipamentos + botão adicionar |
| Error | Número duplicado ou campo obrigatório faltando | Mensagem inline + borda vermelha no campo |

---

## Tela: SCR-05 — Sec-Anexos

**Origem**: `scripts/attachments.js` + `scripts/compress.js`
**Modo aplicado**: modernizado
**Componentes do design-system**: `[color.bg.card, radius.card, shadow.card, spacing.section, spacing.gap, font.size.sm]`
**Pontos de interpolação**: `{{anexos}}`, `{{uploadProgress}}`, `{{anexoError}}`
**Tela crítica?**: não

### Especificação

```yaml
spec.kind: route-component
spec.route: / (section 4 do form)
spec.layout: FormPage (slot "anexos")
spec.states: [idle, loading, error, success]
spec.component:
  component: AnexoForm
  legacy_origin: "scripts/attachments.js + scripts/compress.js"
  state:
    items: Attachment[]
    uploadProgress: number | null  # 0-100
  children:
    - component: SectionTitle
      content: "ANEXOS"
    - component: UploadDropzone
      props:
        accept: "image/*"
        maxFiles: 12
        maxSizeMB: 8
        onUpload: handleUpload(file)
      children:
        - component: ProgressBar (v-if uploadProgress != null)
          props:
            value: uploadProgress
    - component: AnexoGrid
      children:
        - component: AnexoCard (v-for anexo in items)
          props:
            anexo: anexo
          children:
            - component: ImagePreview
              props:
                src: anexo.data  # base64
                alt: anexo.name
            - component: AnexoInfo
              props:
                name: anexo.name
                size: formattedSize(anexo)
            - component: RemoveButton
              action: removeAnexo(anexo.id)
spec.validation:
  items.length: max 12
  each item.data (base64): max 8MB equivalent
spec.state_messages:
  loading: "Comprimindo imagem..."
  error: "{{error_message}}"
  success: "Anexo adicionado com sucesso."
  max: "Máximo de 12 anexos atingido."
```

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | Seção pronta para upload | Dropzone + grid de anexos existentes |
| Loading | Compressão em andamento | Barra de progresso + "Comprimindo imagem..." |
| Error | Arquivo muito grande ou tipo inválido | Toast de erro |
| Success | Upload concluído | Card do anexo no grid |
| Max | 12 anexos já adicionados | Dropzone desabilitado |

---

## Tela: SCR-06 — Sec-Revisao

**Origem**: `index.html #sec-revisao` + `scripts/send.js`
**Modo aplicado**: modernizado
**Componentes do design-system**: `[color.bg.card, radius.card, shadow.card, spacing.section, font.size.base, font.size.lg]`
**Pontos de interpolação**: `{{iniciaisResumo}}`, `{{retornoResumo}}`, `{{equipamentosResumo}}`, `{{anexosResumo}}`
**Tela crítica?**: sim (última etapa antes do envio)

### Especificação

```yaml
spec.kind: route-component
spec.route: / (section 5 do form)
spec.layout: FormPage (slot "revisao")
spec.states: [idle, sending, success, error]
spec.component:
  component: RevisaoForm
  legacy_origin: "index.html #sec-revisao + scripts/send.js"
  state:
    sending: boolean
    sendResult: { success: boolean, message: string } | null
  children:
    - component: SectionTitle
      content: "REVISAO"
    - component: ResumoCard
      props:
        title: "Dados da OS"
        fields:
          - { label: "UC", value: $iniciaisStore.data.uc }
          - { label: "OS", value: $iniciaisStore.data.os }
          - { label: "Tipo de Ordem", value: $iniciaisStore.data.tipoOrdem }
          - { label: "Parceiro/Lider", value: $iniciaisStore.data.parceiroLider }
          - ...
    - component: ResumoCard
      props:
        title: "Retorno"
        fields: $retornoStore.data  # (dinâmico)
    - component: ResumoCard
      props:
        title: "Equipamentos"
        fields: $equipamentoStore.items  # (lista)
    - component: ResumoCard
      props:
        title: "Anexos"
        fields: $anexoStore.items.length  # (contagem)
    - component: Button
      variant: primary
      label: "Enviar OS"
      disabled: $state.sending
      action: sendForm()
    - component: Toast
      props:
        show: $state.sendResult != null
        variant: sendResult.success ? 'success' : 'error'
        message: sendResult.message
spec.state_messages:
  sending: "Enviando OS por email..."
  success: "OS enviada com sucesso!"
  error: "{{error_message}}"
```

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | Revisão pronta | Cards de resumo + botão "Enviar OS" |
| Sending | Enviando email | Botão desabilitado + "Enviando OS por email..." |
| Success | Envio concluído | Toast verde + "OS enviada com sucesso!" |
| Error | Falha no envio | Toast vermelho + mensagem de erro |

---

## Tela: SCR-07 — Modal Duplicata

**Origem**: `scripts/duplicate.js`
**Modo aplicado**: modernizado
**Componentes do design-system**: `[color.bg.card, color.accent, shadow.card, radius.card, font.size.base]`
**Pontos de interpolação**: `{{os}}`, `{{sentAt}}`
**Tela crítica?**: não

### Especificação

```yaml
spec.kind: route-component
spec.route: / (modal — overlay)
spec.layout: AppLayout (modal slot)
spec.states: [idle]
spec.component:
  component: DuplicateModal
  legacy_origin: "scripts/duplicate.js"
  props:
    show: boolean
    record: { os: string, sentAt: string }
  children:
    - component: ModalOverlay
      children:
        - component: ModalCard
          children:
            - component: ModalTitle
              content: "Registro já enviado"
            - component: ModalBody
              content: "Este registro (OS {{os}}) já foi enviado em {{sentAt}}. Deseja enviar novamente?"
            - component: ModalActions
              children:
                - component: Button
                  variant: ghost
                  label: "Cancelar"
                  action: close()
                - component: Button
                  variant: primary
                  label: "Confirmar envio"
                  action: confirmSend()
```

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | Modal visível | Título + corpo + botões |

---

## Tela: SCR-08 — Toast

**Origem**: `scripts/ui.js`
**Modo aplicado**: modernizado
**Componentes do design-system**: `[color.success, color.error, color.warning, radius.card, shadow.card, font.size.sm]`
**Pontos de interpolação**: `{{message}}`, `{{variant}}`
**Tela crítica?**: não

### Especificação

```yaml
spec.kind: route-component
spec.route: / (global — fixed position)
spec.layout: (nenhum — sobreposto)
spec.states: [idle]
spec.component:
  component: BaseToast
  legacy_origin: "scripts/ui.js"
  props:
    show: boolean
    message: string
    variant: 'success' | 'error' | 'warning'
    duration: 3500
  behavior:
    autoHide: true (after duration)
    position: top-right
    closeButton: true (para dismiss manual)
slot_variants:
  success:
    token: color.success
    icon: check-circle
  error:
    token: color.error
    icon: x-circle
  warning:
    token: color.warning
    icon: alert-triangle
```

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | Toast visível | Ícone + mensagem |
| Hidden | Toast não visível | — |

---

## Tela: SCR-09 — Modal SW Update

**Origem**: `scripts/sw-update.js`
**Modo aplicado**: modernizado
**Componentes do design-system**: `[color.bg.card, color.accent, radius.card, shadow.card]`
**Pontos de interpolação**: (nenhum — mensagem fixa)
**Tela crítica?**: não

### Especificação

```yaml
spec.kind: route-component
spec.route: / (modal — overlay)
spec.layout: AppLayout (modal slot)
spec.states: [idle]
spec.component:
  component: SwUpdateModal
  legacy_origin: "scripts/sw-update.js"
  props:
    show: boolean
  children:
    - component: ModalOverlay
      children:
        - component: ModalCard
          children:
            - component: ModalTitle
              content: "Atualização disponível"
            - component: ModalBody
              content: "Uma nova versão do sistema está disponível. Clique em 'Atualizar' para recarregar."
            - component: ModalActions
              children:
                - component: Button
                  variant: primary
                  label: "Atualizar"
                  action: updateSW()
```

### Estados

| Estado | Descrição | Conteúdo / mensagem |
|---|---|---|
| Idle | Modal visível | Título + corpo + botão "Atualizar" |

---

## Apêndice: rastreabilidade ao inventário

| Tela do `target_screens.md` | Origem em `_reversa_sdd/screens/inventory.json` |
|---|---|
| SCR-01 — Sidebar | `SCR-01` sidebar |
| SCR-02 — Sec-Inicio | `SCR-02` sec-inicio |
| SCR-03 — Sec-Retorno | `SCR-03` sec-retorno |
| SCR-04 — Sec-Equipamentos | `SCR-04` sec-equipamentos |
| SCR-05 — Sec-Anexos | `SCR-05` sec-anexos |
| SCR-06 — Sec-Revisao | `SCR-06` sec-revisao |
| SCR-07 — Modal Duplicata | `SCR-07` modal-duplicata |
| SCR-08 — Toast | `SCR-08` toast |
| SCR-09 — Modal SW Update | `SCR-09` modal-sw-update |

# Dicionário de Dados — mail-mvp

> Gerado pelo Arqueólogo em 2026-06-15
> Escala: 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## 1. State Global (`state`)

```js
{
  iniciais: {}               // Objeto com valores dos campos da seção Início
  equipamentos: []           // Array de objetos { status, categoria, numero }
  attachments: []            // Array de File objects (do navegador)
  lastTipoOrdem: ""          // Último tipo de ordem selecionado
  retorno: {}                // Objeto com valores dos campos de retorno
  currentUUID: ""            // UUID do registro atual (do localStorage)
  composicao: { complementoCorpo: "" }
  iniciaisValido: false      // Flag: true quando UC e OS estão preenchidos
}
```

## 2. Campos de Início (`iniciaisFields`)

| Campo        | Tipo        | Obrigatório | Domínio                                    |
|--------------|-------------|-------------|--------------------------------------------|
| coordenadas  | coordinates | não         | "lat, lon" ou "Não disponível"             |
| lider        | select      | sim         | 12 nomes de técnicos                       |
| parceiro     | select      | sim         | 12 nomes de técnicos                       |
| municipio    | select      | sim         | 29 municípios do Ceará                     |
| uc           | number      | sim         | Apenas dígitos                             |
| os           | text        | sim         | Texto livre                                |
| notificado   | select      | sim         | "SIM" / "NÃO"                              |
| placa        | select      | sim         | 12 placas de veículo                       |
| data         | date        | sim         | YYYY-MM-DD, não futura                     |
| hora_inicio  | time        | sim         | HH:mm, step 5min                           |
| hora_fim     | time        | sim         | HH:mm, deve ser ≠ hora_inicio              |
| tipo-ordem   | select      | sim         | 41 tipos de ordem (ver lista completa)     |

## 3. Campos de Retorno (por Tipo de Ordem)

### Insp. UC Cortada (I15, I30, I90, I180)

| Campo            | Tipo   | Obrigatório | Domínio                                                   | Condicional      |
|------------------|--------|-------------|-----------------------------------------------------------|-----------------|
| situacao-cliente | select | sim         | CORTADO / AUTO RELIGADO CORTE EXECUTADO / AUTO RELIGADO / SOLICITOU RELIGACAO / NOVO CLIENTE NO LOCAL | — |
| viavel-retirar   | select | sim         | COM MUNK OU GUINCHO / COM MUNK / COM LINHA VIVA / N/A    | — |
| ramal            | select | sim         | COM RAMAL / SEM RAMAL                                     | — |
| medicao          | select | sim         | COM MEDIÇÃO / SEM MEDIÇÃO                                 | — |
| jump             | select | sim         | COM JUMP / SEM JUMP                                       | — |
| chaves           | select | sim         | COM CHAVE / SEM CHAVE                                     | — |
| aplicado-toi     | select | sim         | SIM / NAO                                                 | — |
| toi              | text   | não         | Texto livre                                               | aplicado-toi = "SIM" |

### Subst. Medidor a Pedido

| Campo            | Tipo   | Obrigatório | Domínio                                   | Condicional        |
|------------------|--------|-------------|-------------------------------------------|-------------------|
| tipo-servico     | select | sim         | Troca de Medidor / Reparo / Aferição      | — |
| medidor-antigo   | text   | não         | Nº do medidor                             | tipo-servico = "Troca de Medidor" |
| medidor-novo     | text   | não         | Nº do medidor                             | tipo-servico = "Troca de Medidor" |
| marca-medidor    | select | não         | Landis+Gyr / EDMI / Siemens / Itron / Nansen / Outra | tipo-servico = "Troca de Medidor" |
| leitura-anterior | number | não         | Leitura numérica                          | tipo-servico = "Aferição" |
| leitura-atual    | number | não         | Leitura numérica                          | tipo-servico = "Aferição" |

### Vistoria da UC

| Campo                    | Tipo     | Obrigatório | Domínio                                    | Condicional      |
|--------------------------|----------|-------------|--------------------------------------------|-----------------|
| resultado                | select   | sim         | Regular / Irregularidade Leve / Irregularidade Grave / Cliente Ausente / Recusou / Outro | — |
| motivo-recusa            | text     | não         | Texto livre                                | resultado = "Recusou" |
| desc-irregularidade      | textarea | não         | Texto livre                                | resultado = "Irregularidade Leve" |
| desc-irregularidade-grave| textarea | não         | Texto livre                                | resultado = "Irregularidade Grave" |

### Grandes Clientes Selo Rompido

| Campo              | Tipo   | Obrigatório | Domínio      | Condicional              |
|--------------------|--------|-------------|--------------|--------------------------|
| selo-rompido       | select | sim         | SIM / NÃO    | — |
| medidor-substituido| select | não         | SIM / NÃO    | selo-rompido = "SIM" |
| num-novo-medidor   | text   | não         | Nº do medidor| medidor-substituido = "SIM" |

### Corte por Falta de Pagamento

| Campo         | Tipo   | Obrigatório | Domínio |
|---------------|--------|-------------|---------|
| situacao_corte | select | sim | CLIENTE CORTADO / CLIENTE VISITADO CONTA PAGA / CLIENTE NAO PERMITIU O CORTE / SEM ACESSO PARA EXECUTAR O CORTE |

### Deslig. Prog. Manutenção

| Campo               | Tipo   | Obrigatório | Domínio | Condicional |
|---------------------|--------|-------------|---------|-------------|
| desligamento        | select | sim         | DESLIGAMENTO EXECUTADO / CLIENTE CANCELOU DESLIGAMENTO / SEM ACESSO / NAO EXECUTADO PENDENCIA CLIENTE / NAO EXECUTADO PENDENCIA ENEL | — |
| acesso_desligamento | text   | não         | Texto livre | negado(desligamento = "DESLIGAMENTO EXECUTADO") |

### Ligação Nova MT / MT Cliente Livre (10+ campos)

Sistema de 3 níveis condicionais:
- `retorno_ligacao` (VISTORIA / VISTORIA + LIGAÇÃO / LIGAÇÃO) → desbloqueia grupos
- Grupos: "Obra", "Medição", "Ponto de Entrega", "Acesso", "Ligação", "Tombamento"
- Sub-campos com dependências adicionais

### Telemedição Manutenção

| Campo       | Tipo   | Obrigatório | Domínio |
|-------------|--------|-------------|---------|
| equipamento | select | sim | Modem / Roteador / Concentrador / Fonte / Antena / Hub / Outro |
| defeito     | text   | sim | Texto livre |
| num-serie   | text   | sim | Texto livre |

### Demais tipos

- INSTALACAO DO DISPLAY: display-instalado + motivo-nao-instalar (condicional)
- SUBSTITUIÇÃO DE DISPLAY: motivo-subst + display-funcionando
- AFERIÇÃO DE MEDIDOR: medidor-aferido + resultado-afericao (condicional)
- Default: descricao (textarea) — usado como fallback para tipos sem campos específicos

## 4. Equipamentos (`state.equipamentos[]`)

| Campo     | Tipo   | Obrigatório | Domínio                       |
|-----------|--------|-------------|-------------------------------|
| status    | string | sim         | "Instalado" / "Retirado"      |
| categoria | string | sim         | "Medidor" / "Display" / "Conjunto" / "TC" / "TP" |
| numero    | string | sim         | Número do equipamento (texto)  |

## 5. Registro IndexedDB (`records` store)

**keyPath**: `uuid` (string, gerado via `crypto.randomUUID()`)

| Campo           | Tipo     | Obrigatório | Descrição                              |
|-----------------|----------|-------------|----------------------------------------|
| uuid            | string   | sim         | Chave primária                         |
| status          | string   | sim         | "draft" / "sent"                       |
| createdAt       | string   | sim         | ISO 8601                               |
| updatedAt       | string   | sim         | ISO 8601                               |
| iniciais        | object   | sim         | Dados da seção Início                  |
| retorno         | object   | não         | Dados da seção Retorno                 |
| tipoOrdem       | string   | não         | Tipo de ordem selecionado              |
| equipamentos    | array    | não         | Lista de equipamentos                  |
| lastTipoOrdem   | string   | não         | Último tipo selecionado                |
| composicao      | object   | não         | `{ complementoCorpo: "" }`            |
| attachmentCount | number   | não         | Quantidade de anexos (contagem apenas) |
| sentData        | object?  | não         | `{ to, subject, sentAt }` (após envio) |

## 6. Anexos (`attachments` store)

**keyPath**: `id` (string, composto: `{uuid}_{index}`)
**Index**: `uuid` (non-unique)

| Campo | Tipo   | Obrigatório | Descrição                |
|-------|--------|-------------|--------------------------|
| id    | string | sim         | `{uuid}_{index}`         |
| uuid  | string | sim         | FK para records          |
| index | number | sim         | Posição no array         |
| name  | string | sim         | Nome do arquivo original |
| type  | string | sim         | MIME type                |
| data  | string | sim         | Base64 do arquivo        |

## 7. Constantes

| Nome        | Valor    | Descrição                      |
|-------------|----------|--------------------------------|
| MAX_SIZE    | 665600   | 650KB — limite de compressão   |
| SKIP_SIZE   | 686080   | 670KB — abaixo disso não comprime |
| MAX_ANEXOS  | 12       | Máximo de anexos por envio     |
| MAX_ANEXO_MB| 8        | Tamanho máximo por anexo       |
| DB_NAME     | "mail-mvp" | Nome do banco IndexedDB       |
| DB_VERSION  | 3        | Versão atual do schema         |
| CACHE_NAME  | "retorno-v60" | Nome do cache do Service Worker |

## 8. Service Worker Cache

| Cache        | Estratégia   | Conteúdo                              |
|--------------|--------------|---------------------------------------|
| retorno-v60  | Cache-first  | index.html, style.css, tailwind.css, manifest.json, icons/, scripts/*.js |

---

*Fim do dicionário de dados.*

# Fluxograma — Form: Campos Condicionais

```mermaid
flowchart TD
    A[handleTipoChange] --> B{tipo === lastTipoOrdem?}
    B -->|sim| C[return]
    B -->|não| D[state.lastTipoOrdem = tipo]
    D --> E[state.retorno = {}]
    E --> F[renderRetorno]
    F --> G[saveState]

    subgraph "renderRetorno"
        H[getRetornoFields tipo] --> I[agruparPorLinha]
        I --> J[Iterar grupos]
        J --> K[Criar rowDiv flex/mb-4]
        K --> L[Criar group com dataset.fieldNome]
        L --> M{Campo tem condicional?}
        M -->|sim| N[dataset.condicionalRef + dataset.condicionalVal]
        N --> O[group.style.display = none]
        M -->|não| O
        O --> P[Criar label + input + errorSpan]
        P --> Q[input change → updateConditionalFields]
    end
```

## Fluxo — updateConditionalFields

```mermaid
flowchart TD
    A[updateConditionalFields fields] --> B[Iterar fields]
    B --> C{Tem condicional?}
    C -->|não| D[pula]
    C -->|sim| E[Buscar group por data-field-nome]
    E --> F[Buscar controlEl por campoRef]
    F --> G{controlEl existe?}
    G -->|não| H[pula]
    G -->|sim| I[Converter valor para array]
    I --> J{includes controlEl.value?}
    J -->|sim| K[negar? → show = false : show = true]
    J -->|não| L[negar? → show = true : show = false]
    K --> M{show?}
    L --> M
    M -->|sim| N[group.style.display = '']
    M -->|não| O[group.style.display = 'none']
    O --> P[input.value = '']
```

## Fluxo — Validação

```mermaid
flowchart TD
    A[validateAll] --> B[validateSection1]
    B --> C{OK?}
    C -->|não| D[Registrar firstError]
    C -->|sim| E{TipoOrdem selecionado?}
    E -->|sim| F[validateSection3]
    F --> G{OK?}
    G -->|não| H[Registrar firstError]
    G -->|sim| I[validateSection2]
    I --> J{OK?}
    J -->|não| K[Registrar firstError]
    J -->|sim| L[validateSection4]
    L --> M{OK?}
    M -->|não| N[Registrar firstError]
    M -->|sim| O[Scroll to firstError]
    D --> O
    H --> O
    K --> O
    N --> O
    O --> P[return valid]
```

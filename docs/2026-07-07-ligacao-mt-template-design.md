# Design: Template de Retorno para LIGACAO NOVA MEDIA TENSAO

## Data: 2026-07-07

## Status: Aprovado

## Objetivo

Criar template de texto personalizado para o preview de revisão dos tipos "LIGACAO NOVA MEDIA TENSAO" e "LIGACAO NOVA MT - CLIENTE LIVRE", com lógica condicional baseada nos campos de retorno.

## Estrutura do Template

### Campo chave: `retorno_ligacao` (3 valores possíveis)

### Variante 1: `retorno_ligacao = "VISTORIA"`

```
OBRA CONCLUIDA
COM MEDICAO ACOPLADO NO LOCAL
COM MEDICAO CUBICULO NO LOCAL
COM MEDICAO SEMI-DIRETA NO LOCAL
COM MEDICAO DIRETA NO LOCAL
SEM MEDICAO NO LOCAL
PONTO DE ENTREGA DE ACORDO COM PROJETO
PONTO DE ENTREGA EM DESACORDO COM O PROJETO
PONTO DE ENTREGA NÃO CONSTRUIDO
COM {qtd} MEDIDOR DE BT
SEM MEDIDOR DE BT
ACESSO A MEDICAO REGULAR
ACESSO A MEDICAO IRREGULAR DEVIDO {motivo}
SEM ACESSO A MEDICAO DEVIDO {motivo}
---
[descricao]
```

### Variante 2: `retorno_ligacao = "LIGAÇÃO"`

```
LIGAÇÃO CONCLUIDA
TOMBAMENTO: {tombamento}
---
[descricao]
```

### Variante 3: `retorno_ligacao = "VISTORIA + LIGAÇÃO"`

```
LIGAÇÃO CONCLUIDA
TOMBAMENTO: {tombamento}
OBRA CONCLUIDA
COM MEDICAO ACOPLADO NO LOCAL
PONTO DE ENTREGA DE ACORDO COM PROJETO
COM 2 MEDIDOR DE BT
ACESSO A MEDICAO REGULAR
---
[descricao]
```

## Mudanças Técnicas

### 1. `scripts/email.js` — matchCondition()

Adicionar suporte a array de condições (AND):

- Se `condicao` for array, todas as condições devem ser verdadeiras
- Se `condicao` for objeto (formato atual), manter comportamento existente
- 100% retrocompatível

### 2. `scripts/data/retorno-templates.js`

Adicionar entrada para LIGACAO NOVA MEDIA TENSAO e LIGACAO NOVA MT - CLIENTE LIVRE
compartilhando a mesma constante de template (3 variantes).

## Blocos com condição composta (AND)

Os seguintes blocos usam condição composta (array):

| Bloco                            | Condições                                               |
| -------------------------------- | ------------------------------------------------------- |
| COM MEDICAO ACOPLADO NO LOCAL    | status_medicao=COM MEDICAO AND tipo_medicao=ACOPLADA    |
| COM MEDICAO CUBICULO NO LOCAL    | status_medicao=COM MEDICAO AND tipo_medicao=CUBICULO    |
| COM MEDICAO SEMI-DIRETA NO LOCAL | status_medicao=COM MEDICAO AND tipo_medicao=SEMI-DIRETA |
| COM MEDICAO DIRETA NO LOCAL      | status_medicao=COM MEDICAO AND tipo_medicao=DIRETA      |
| COM {qtd} MEDIDOR DE BT          | medidor_bt=COM MEDIDOR BT (condição simples)            |
| SEM MEDIDOR DE BT                | medidor_bt=SEM MEDIDOR BT (condição simples)            |

# Validação, Requisitos

> Gerado pelo Redator em 2026-06-15
> Cobre o módulo: `scripts/validation.js`

---

## Visão Geral

Sistema de validação de formulário em 4 seções (Iniciais, Equipamentos, Retorno, Anexos) + seção de Revisão (sem validação). Usa cache de dados validados para evitar re-leitura do DOM. Validação por seção e validação total (com scroll para primeiro erro).

## Responsabilidades

- Validar campos obrigatórios de Iniciais
- Validar formato de UC (apenas números)
- Validar data futura (não permitir)
- Validar hora fim != hora início
- Validar equipamentos (tipo, categoria, número obrigatórios; número duplicado)
- Validar campos de retorno obrigatórios (pulando hidden fields)
- Validar anexos (max 12, max 8MB cada)
- Marcar/limpar erros visualmente (classe `error` + mensagem via `ui.js`)
- Cache de dados validados (collectSectionData consome o cache)
- Scroll suave para primeiro erro na validação total

## Regras de Negócio

- RN01: UC deve conter apenas dígitos 🟢
- RN02: Data não pode ser futura (comparação com `today.setHours(0,0,0,0)`) 🟢
- RN03: Hora fim deve ser diferente de hora início (permitindo overnight, ex: 23:00 → 01:00) 🟢
- RN04: Seção de equipamentos é opcional (sem rows = válido) 🟢
- RN05: Número de equipamento duplicado é inválido (normalizado: string numérica → Number, string alfa → trim leading zeros) 🟢
- RN06: Campos de retorno com `display: none` (conditional fields) são pulados na validação 🟢
- RN07: Seção de retorno só é validada se `tipoOrdem` estiver selecionado 🟢
- RN08: Máximo 12 anexos, máximo 8MB cada 🟢
- RN09: Cache `_validatedData` é populado por validateSection e consumido por collectSectionData 🟢
- RN10: `_resetValidationCache()` limpa o cache entre execuções de teste 🟢
- RN11: Seção 5 (Revisão) sempre retorna `true` — nenhum campo novo 🟢
- RN12: `addBlurValidation()` adiciona validação on-blur + clear on input/change para campos com `required` ou `data-required` 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Validar campos obrigatórios seção 1 | Must | `validateSection1()` marca erros em campos obrigatórios vazios |
| RF-02 | Validar formato UC (só números) | Must | UC não-numérica → erro |
| RF-03 | Validar data futura | Must | Data > hoje → erro |
| RF-04 | Validar hora fim != hora início | Must | Hora fim == hora início → erro |
| RF-05 | Validar equipamentos obrigatórios e duplicidade | Must | `validateSection2()` valida tipo, categoria, número, duplicidade |
| RF-06 | Validar campos de retorno (pulando hidden) | Must | `validateSection3()` valida visíveis obrigatórios |
| RF-07 | Validar anexos (12 max, 8MB max) | Must | `validateSection4()` verifica limites |
| RF-08 | Validar formulário completo com scroll | Must | `validateAll()` valida todas seções, scrolla ao primeiro erro |
| RF-09 | Validar seção individual (com cache) | Must | `validateSection(n)` executa validador e popula cache |
| RF-10 | Coletar dados validados | Must | `collectSectionData(n)` retorna dados do cache ou relê DOM |
| RF-11 | Validação on-blur | Should | `addBlurValidation()` marca erro ao sair do campo vazio |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência | Confiança |
|------|--------------------|-----------|-----------|
| Performance | Cache evita re-leitura do DOM | `_validatedData` + `collectSectionData()` | 🟢 |
| Manutenibilidade | Strategy pattern por seção | `SECTION_VALIDATORS` object | 🟢 |
| Manutenibilidade | Seção 5 (Revisão) é passthrough | `SECTION_VALIDATORS[5] = () => true` | 🟢 |

## Critérios de Aceitação

```gherkin
Dado que o campo UC contém "ABC"
Quando `validateSection1()` é executado
Então UC é marcado com erro "UC deve conter apenas números"

Dado que a data é "15/12/2030" (futura)
Quando `validateSection1()` é executado
Então data é marcada com erro "Data não pode ser futura"

Dado que hora_inicio e hora_fim são ambos "10:00"
Quando `validateSection1()` é executado
Então hora_fim é marcado com erro "Hora fim deve ser diferente"

Dado que há 2 equipamentos com mesmo número
Quando `validateSection2()` é executado
Então segundo equipamento é marcado com "Número duplicado"

Dado que não há tipo de ordem selecionado
Quando `validateSection3()` é executado
Então retorna true (sem validação)

Dado que há 13 anexos
Quando `validateSection4()` é executado
Então retorna false com erro "Máximo de 12 anexos"
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Validação de campos obrigatórios | Must | Integridade dos dados |
| Validações especiais (UC, data, hora) | Must | Regras de negócio |
| Validação de equipamentos duplicados | Must | Integridade dos dados |
| Validação de anexos | Must | Limites do backend |
| Blur validation | Should | UX |
| Cache de dados validados | Should | Performance |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `scripts/validation.js` | `validateSection1()`, `validateSection2()`, `validateSection3()`, `validateSection4()`, `validateSection()`, `validateAll()`, `collectSectionData()`, `addBlurValidation()`, `_resetValidationCache()` | 🟢 |

---

*Fim dos requisitos de validação.*

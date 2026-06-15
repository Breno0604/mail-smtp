# Formulário, Requisitos

> Gerado pelo Redator em 2026-06-15
> Escala: 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA
> Cobre os módulos: `iniciais.js`, `retornos.js`, `fields.js`

---

## Visão Geral

Renderiza dinamicamente os formulários de "Início" (12 campos fixos) e "Retorno" (campos variáveis conforme o tipo de ordem selecionado). Fornece a definição de schema para todos os 41 tipos de ordem suportados, com suporte a campos condicionais em cascata.

## Responsabilidades

- Renderizar 12 campos da seção Início (coordenadas, lider, parceiro, municipio, uc, os, notificado, placa, data, hora_inicio, hora_fim, tipo-ordem)
- Renderizar dinamicamente campos de Retorno conforme o Tipo de Ordem selecionado (41 tipos)
- Gerenciar visibilidade de campos condicionais (mostrar/esconder baseado em valores de outros campos)
- Fornecer schema de definição de campos (`iniciaisFields`, `retornoFieldsByTipo`)
- Coletar dados do DOM para as seções Início e Retorno
- Detectar mudança de Tipo de Ordem e descartar dados anteriores

## Regras de Negócio

- RD01: Ao mudar o tipo de ordem, os dados de retorno anteriores são descartados (`state.retorno = {}`) 🟢
- RD02: Campos condicionais quando ocultos têm seu valor zerado (`input.value = ""`) 🟢
- RD03: Campos de retorno ocultos (condicionais não atendidos) são excluídos dos dados coletados 🟢
- RD04: O campo UC é do tipo `text` com `inputMode=numeric` — aceita apenas dígitos mas é string 🟢
- RD05: Selects recebem um placeholder "Selecione" como primeira opção 🟢
- RD06: O campo coordenadas tem um botão de refresh que chama `captureCoordinates()` 🟢
- RD07: O campo tipo-ordem é criado dinamicamente e deve ter seu event listener re-attachado após renderIniciais() 🟢
- RD08: Cada campo obrigatório recebe atributo `data-required` para validação no blur 🟢
- RD09: A renderização agrupa campos por `linha` (mesma linha = mesma flex row / grid column) 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Renderizar 12 campos iniciais com tipos corretos (select, number, date, time, text, textarea, coordinates) | Must | Cada campo tem o elemento HTML correto (select/input/textarea) e classes CSS |
| RF-02 | Renderizar campos de retorno ao selecionar tipo de ordem | Must | Ao selecionar tipo, os campos específicos aparecem; ao limpar, voltam ao placeholder |
| RF-03 | Ocultar/mostrar campos condicionais baseado no valor do campo de referência | Must | Campo condicional some quando referência muda de valor, reaparece quando valor condiz |
| RF-04 | Zerar valor de campos condicionais ao ocultá-los | Must | Campo oculto tem `value=""` |
| RF-05 | Coletar dados apenas de campos visíveis no retorno | Must | `getRetornoData()` não inclui campos com `display:none` |
| RF-06 | Detectar mudança de tipo de ordem e descartar dados anteriores | Must | Ao mudar tipo, `state.retorno` é zerado e campos re-renderizados |
| RF-07 | Campo coordenadas com botão de refresh geolocalização | Could | Botão de refresh ao lado do input readonly |
| RF-08 | Agrupar campos por linha no layout | Must | Campos com mesma `linha` aparecem na mesma fileira flex/grid |
| RF-09 | Suportar 41 tipos de ordem no select | Must | Select de tipo-ordem lista todos os 41 tipos |
| RF-10 | Suportar condicionais com valor único, array (any match) e negação | Must | `condicional.valor` pode ser string ou array; `condicional.negado` inverte lógica |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Manutenibilidade | Schema de campos centralizado em um único arquivo (`fields.js`) | `fields.js` | 🟢 |
| Performance | Input/change listeners chamam `debouncedSave()` (1000ms) | `iniciais.js:175-176`, `retornos.js:54-55` | 🟢 |

## Critérios de Aceitação

```gherkin
Dado um formulário vazio
Quando a página carrega
Então os 12 campos iniciais são renderizados com labels, inputs e spans de erro
E o campo coordenadas está readonly com botão de refresh

Dado que o tipo de ordem "INSPECAO UC CORTADA I15" está selecionado
Quando o formulário renderiza os campos de retorno
Então os campos "situacao-cliente", "viavel-retirar", "ramal", "medicao", "jump", "chaves", "aplicado-toi" são exibidos
E o campo "toi" está oculto (condicional)

Dado que o campo "aplicado-toi" está como "NÃO"
Quando o usuário seleciona "SIM" no campo "aplicado-toi"
Então o campo "toi" aparece

Dado que o campo condicional "toi" está visível com valor preenchido
Quando o campo "aplicado-toi" muda para "NÃO"
Então o campo "toi" fica oculto e seu valor é zerado

Dado que há 2 campos na mesma linha (ex: "uc" e "os", linha 4)
Quando o formulário é renderizado
Então ambos aparecem lado a lado na mesma grid row

Dado que o tipo de ordem está selecionado e há dados de retorno
Quando o usuário muda o tipo de ordem
Então os dados de retorno anteriores são descartados e novos campos são renderizados
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Renderização dos 12 campos iniciais | Must | Base do formulário, sem isso nada funciona |
| Renderização dinâmica de retorno por tipo | Must | Core do negócio — 41 tipos de ordem |
| Campos condicionais em cascata | Must | Funcionalidade central — muitos tipos dependem disso |
| Agrupamento por linha no layout | Should | Importante para UX mas não bloqueia funcionalidade |
| Campo coordenadas com refresh | Could | Geolocalização é auxiliar, fallback para "Não disponível" |
| Suporte a condicionais com negação | Should | Apenas 1 tipo usa (`DESLIG.PROG.MANUTENÇÃO`) |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `scripts/iniciais.js` | `renderIniciais()`, `getIniciaisData()`, `INPUT_CREATORS` | 🟢 |
| `scripts/retornos.js` | `renderRetorno()`, `handleTipoChange()`, `getRetornoData()`, `setRetornoData()`, `updateConditionalFields()` | 🟢 |
| `scripts/fields.js` | `iniciaisFields`, `retornoFieldsByTipo`, `getRetornoFields()` | 🟢 |

---

*Fim dos requisitos do formulário.*

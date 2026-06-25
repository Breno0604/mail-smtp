# Relatório de Exploração — Adição de Campos de Retorno para Tipos de Ordem

> **Data:** 16/06/2026
> **Propósito:** Mapear arquitetura, fluxo e pontos de atenção para adicionar novos campos de retorno aos Tipos de Ordem no sistema Mail MVP.
> **Fonte de verdade:** A planilha `dados_projeto/tipos_ordem_template.xlsx` é a **fonte de verdade** para definição dos campos, **mas apenas quando o usuário indicar explicitamente qual aba/grupo usar**. Antes dessa indicação, o conteúdo não deve ser considerado confiável (pode estar desatualizado). Este relatório usa a planilha apenas como referência **estrutural** (formato das colunas, tipos de dados). Uma vez que o usuário aponte a aba, os dados daquela aba passam a ser fonte de verdade — em linha com o skill `retorno-fields-guide`.

---

## 1. Arquitetura Atual dos Campos de Retorno

### Localização central: `scripts/fields.js`

O sistema de campos de retorno é definido por um objeto `retornoFieldsByTipo` que mapeia cada Tipo de Ordem a um array de objetos de campo.

```js
// Estrutura de cada campo:
{
  linha: 1,                          // Agrupamento visual (mesmo linha = mesma flex row)
  nome: "situacao_corte",            // ID do campo (snake_case ou kebab-case)
  label: "Situação do Corte",        // Rótulo visível
  tipo: "select",                    // select | text | number | textarea
  opcoes: ["OPCAO_1", "OPCAO_2"],    // Apenas para SELECT (NÃO incluir "Selecione")
  condicional: {                     // Opcional: visibilidade condicional
    campoRef: "campo_pai",
    valor: "VALOR" | ["VALOR1", "VALOR2"],
    negado: true                     // Opcional: inverte a lógica
  }
}
```

### Componentes existentes:

| Componente | Descrição |
|---|---|
| `retornoFieldsByTipo` | Objeto principal: `{ "NOME_TIPO": [ ...fields ], "default": [FIELD_DESCRICAO] }` |
| `FIELD_DESCRICAO` | Placeholder `{ nome: "descricao", label: "Descrição do Serviço", tipo: "textarea" }` — usado como fallback |
| `UC_CORTADA_FIELDS` | 8 campos compartilhados por 4 tipos (I15, I30, I90, I180) |
| `LIGACAO_NOVA_MT_FIELDS` | 11 campos compartilhados por 2 tipos |
| `getRetornoFields(tipo)` | Função lookup: `retornoFieldsByTipo[tipo] \|\| retornoFieldsByTipo["default"]` |

### Tipos atualmente com campos específicos (~15):
- INSPECAO UC CORTADA I15, I30, I90, I180 (compartilham `UC_CORTADA_FIELDS`)
- SUBST. MEDIDOR A PEDIDO, VISTORIA DA UC, GRANDES CLIENTES SELO ROMPIDO
- INSTALACAO DO DISPLAY, SUBSTITUIÇÃO DE DISPLAY, AFERIÇÃO DE MEDIDOR
- CORTE POR FALTA DE PAGAMENTO, DESLIG.PROG.MANUTENÇÃO
- LIGACAO NOVA MEDIA TENSAO, LIGACAO NOVA MT - CLIENTE LIVRE (compartilham)
- TELEMEDIÇÃO MANUTENÇÃO

### Tipos atualmente sem campos específicos (caem no `default` — só FIELD_DESCRICAO):

- ADEQUACAO SMF
- AFERIÇÃO MEDIDOR CLIENTE LIVRE
- COLHER LEITURA
- CORTE DE UC POR DEF TECNICO
- CORTE DEFINITIVO A PEDIDO
- DESLOCAMENTO DE SUBESTAÇÃO
- DISPON. SAIDA SERIAL MEDIDOR
- EXECUÇÃO DE MUDANÇA DE TARIFA
- EXECUCAO DO ACRESCIMO DE POTENCIA
- EXECUCAO DO DECRESCIMO DE POTENCIA
- GRANDES CLIENTES SEM MEDIÇÃO
- LIBERAÇÃO DE PULSO
- LIGAÇÃO NOVA ISOLADA
- LIGAÇÃO NOVA SIMULTÂNEA
- RELIGACAO NORMAL RURAL
- RELIGAÇÃO NORMAL URBANA
- RESELAR MEDICAO
- RESSERVICO
- RETIRAR EQUIPAMENTOS
- RETIRAR RAMAL
- SERVIÇO ESPECIAL OPERAÇÃO GRUPO A
- SUBST. DE EQUIPAMENTO DE MEDICAO
- SUBST. MEDIDOR INICIATIVA COELCE
- SUBSTITUIÇÃO DA BATERIA DO MEDIDOR
- TELEMEDIÇÃO MANUTENÇÃO CLIENTE LIVRE
- TELEMEDIÇÃO MANUTENÇÃO LOTE
- VISITA TECNICA GRUPO A
- VISTORIA GERAÇÃO DISTRIBUIDA
- (e outros, conforme planilha)

---

## 2. Estrutura da Planilha (`tipos_ordem_template.xlsx`)

### Abas disponíveis:

| Aba | Conteúdo | Status |
|---|---|---|
| `tipos_ordem` | ~108 linhas — todos os campos de retorno, organizados por grupos de verificação (1 a 10) | ⏳ Aguardando validação |
| `corte` | 15 linhas — campos legacy (já implementados) | ⏳ Aguardando validação |
| `Texto_ordem` | Templates de email por tipo de ordem | ⏳ Aguardando validação |
| `tela_inicial` | Campos iniciais do formulário (já implementados) | ⏳ Aguardando validação |

### Colunas da aba principal (`tipos_ordem`):

| Coluna | Descrição | Mapeamento no código |
|---|---|---|
| `tipo_ordem` | Nome do Tipo de Ordem (exato) | Chave em `retornoFieldsByTipo` — deve bater com dropdown |
| `ordem` | Ordem de exibição (1, 2, 3...) | Posição no array |
| `campo_nome` | ID do campo (snake_case) | `field.nome` |
| `campo_label` | Texto visível do label | `field.label` |
| `tipo` | `SELECT`, `TEXT`, `NUMBER`, `TEXTAREA` | `field.tipo` (minúsculo) |
| `opcoes` | Opções separadas por vírgula | `field.opcoes` (array) |
| `inicia_visivel` | `SIM` ou `NÃO` | Define estado inicial de visibilidade |
| `gatilho_campo` | Campo pai para condicional | `field.condicional.campoRef` |
| `gatilho_valor` | Valor(es) gatilho (vírgula = multi) | `field.condicional.valor` |
| `placeholder` | Texto de placeholder (informativo) | Não implementado automaticamente |
| `grupo` | Nome do grupo de categorização | Referência apenas |
| `grupo_verificacao` | Grupo de verificação (1-10) | Referência apenas |
| `tipo_retorno` | `tela_especifica`, `template`, ou `direto` | Referência apenas — ajuda a identificar quais tipos devem receber campos específicos (`tela_especifica`) vs quais permanecem no `default` (`template`/`direto`) |

> **Nota sobre `inicia_visivel`:** Esta coluna é informativa. No código, campos **sem** condicional começam visíveis; campos **com** condicional começam ocultos (`display: none`) e só aparecem quando o gatilho é ativado. O valor `NÃO` em `inicia_visivel` geralmente indica que o campo tem um condicional — verifique se `gatilho_campo` está preenchido.

---

## 3. Fluxo Completo dos Dados (Definição → Envio)

```
fields.js (retornoFieldsByTipo)
  ↓
retornos.js (renderRetorno)
  ├── agruparPorLinha(fields) → agrupa campos mesmo linha_campo
  ├── INPUT_CREATORS (cria input/select/textarea)
  ├── data-required em todos os campos
  ├── addBlurValidation() no campo
  ├── listeners input/change → atualiza state.retorno + debouncedSave
  └── condicionais: display:none + updateConditionalFields()
       ↓
state.retorno (objeto genérico, atualizado via listeners)
  ↓
collectors.js (collectRetorno)
  ├── Itera getRetornoFields(tipo)
  ├── Só lê campos com group.style.display !== "none"
  └── Atualiza state.retorno e retorna objeto
  ↓
validation.js (validateSection3)
  ├── Só valida campos com display !== "none"
  └── Todos os campos visíveis são obrigatórios
  ↓
email.js (composeEmail)
  ├── Seção "RETORNO:" no corpo do email
  ├── normalizeText() → MAIÚSCULAS SEM ACENTOS
  ├── Filtra campos que existem em data.retorno (dupla proteção)
  └── (NAO PREENCHIDO) para valores vazios
  ↓
send.js (sendEmail)
  ├── Lê preview do DOM (DOM.previewCorpo.textContent)
  └── Envia via Netlify Function (SMTP)
  ↓
persistence.js (saveState)
  ├── Chama collectRetorno() para sincronizar
  ├── state.retorno incluso no registro
  └── debouncedSave() com 1s de debounce
  ↓
restore.js (applyRecord)
  ├── Seta state.retorno = record.retorno
  ├── renderRetorno() + setRetornoData()
  └── updateConditionalFields() reavalia visibilidade
```

---

## 4. Sistema de Campos Condicionais

### Como funciona em `scripts/retornos.js`:

```js
// Campo filho com condicional:
{
  nome: "campo-filho",
  condicional: {
    campoRef: "campo-pai",   // Referencia o campo pai pelo nome
    valor: "VALOR",           // String única ou array de valores
    negado: false             // Se true, inverte a lógica
  }
}
```

### Comportamento:

1. **Ao renderizar**: campos com `condicional` recebem `display: none` + datasets `data-condicional-ref` / `data-condicional-val`
2. **Ao mudar o pai**: listeners disparam `updateConditionalFields()` que reavalia todos os campos condicionais
3. **`updateConditionalFields()`**: encontra o campo filho, lê o valor do pai, compara com o match, mostra ou esconde
4. **Ao esconder**: **limpa o valor do input** (`input.value = ""`) para evitar dados fantasmas

### Exemplos:

| Tipo | Código |
|---|---|
| **Simples** (mostrar se pai = X) | `condicional: { campoRef: "aplicado-toi", valor: "SIM" }` |
| **Multi-valor** (mostrar se pai = X ou Y) | `condicional: { campoRef: "retorno_ligacao", valor: ["VISTORIA", "VISTORIA + LIGAÇÃO"] }` |
| **Negado** (mostrar se pai ≠ X) | `condicional: { campoRef: "desligamento", valor: "DESLIGAMENTO EXECUTADO", negado: true }` |

### Regra de cascata:
Se o campo B depende de A, e C depende de B, então A deve vir antes de B, e B antes de C no array. O sistema avalia sequencialmente, então a ordem do array **é a ordem de avaliação**.

---

## 5. Pontos de Atenção Críticos

### ⚠️ 1. Match exato do nome do Tipo de Ordem

O nome no campo `tipo_ordem` da planilha deve corresponder **exatamente** ao `<option value="...">` no dropdown `tipo-ordem` em `iniciaisFields`.

**Mismatch já identificado:**
- Planilha: `DESLI.PROG.MANUTENÇÃO` (sem "G")
- Dropdown: `DESLIG.PROG.MANUTENÇÃO` (com "G")

**Ação:** SEMPRE conferir e sinalizar ao usuário antes de implementar.

### ⚠️ 2. Remoção do `FIELD_DESCRICAO`

Quando um Tipo de Ordem ganha campos específicos pela primeira vez:
- **Remover** o `FIELD_DESCRICAO` do array
- O novo array **não deve incluir** `FIELD_DESCRICAO` a menos que a planilha o liste explicitamente

### ⚠️ 3. Ordem do array (cascata)

Campo pai **SEMPRE** antes do campo filho. A ordem de declaração no array é a ordem de avaliação das condicionais.

### ⚠️ 4. Nomes de campo duplicados

Um `campo_nome` **não pode aparecer duas vezes** no mesmo array. Isso quebra a lógica de renderização e coleta.

### ⚠️ 5. Campos compartilhados

Quando `tipo_ordem` contém múltiplos nomes (ex: "TIPO_A, TIPO_B"):
- Criar constante compartilhada: `const TIPO_AB_FIELDS = [...]`
- Declarar **antes** do `retornoFieldsByTipo`
- Ambos os tipos apontam para a **mesma referência** de array

### ⚠️ 6. Nomes de campo e tipo

- `campo_nome` da planilha em `snake_case` → `field.nome` no código
- `tipo` da planilha em MAIÚSCULAS → converter para minúsculo (`SELECT` → `select`)
- **NÃO incluir** "Selecione" nas opções (o sistema adiciona automaticamente)

### ⚠️ 7. `tipo_retorno` como guia de prioridade

A coluna `tipo_retorno` da planilha indica se o tipo deve ou não receber campos específicos:

| Valor | Significado | Ação |
|---|---|---|
| `tela_especifica` | Tipo DEVE receber campos de retorno específicos | ✅ Implementar |
| `template` | Tipo usa template genérico (permanece no `default`) | ⏳ Pular |
| `direto` | Tipo tem fluxo direto (permanece no `default`) | ⏳ Pular |

### ⚠️ 8. Coluna `ordem` vs `linha_campo` (confusão comum)

- **`ordem`**: ordem sequencial dos campos no array (1, 2, 3...). Define a posição no array.
- **`linha_campo`**: agrupamento visual (mesmo valor = mesma linha/flex row). No código vira `field.linha`.

Ambos existem na planilha. Não confundir: a `ordem` dita a posição no array, a `linha_campo` dita o layout visual.

---

## 6. Arquivos Que DEVEM Ser Modificados (apenas 3-4)

| Arquivo | O que fazer | Prioridade |
|---|---|---|
| **`scripts/fields.js`** | Adicionar entries em `retornoFieldsByTipo`, criar constantes compartilhadas, remover `FIELD_DESCRICAO` | 🔴 Essencial |
| **`tests/fields.test.js`** | Testes estruturais: contagem de campos, propriedades, condicionais, valores padrão | 🟡 Essencial |
| **`tests/retornos.test.js`** | Testes comportamentais: renderização, condicionais (mostrar/esconder), coleta de dados | 🟡 Essencial |
| **`sw.js`** | Bump no `CACHE_NAME` (ex: `retorno-v69` → `retorno-v70`) | 🟢 Recomendado |

---

## 7. Arquivos Que NÃO DEVEM Ser Modificados

| Arquivo | Motivo |
|---|---|
| `scripts/retornos.js` | Já é genérico — itera sobre `getRetornoFields()` |
| `scripts/collectors.js` | Já é genérico — itera sobre `getRetornoFields()` e filtra hidden |
| `scripts/validation.js` | Já é genérico — valida todos os campos visíveis |
| `scripts/email.js` | Já é genérico — itera sobre `getRetornoFields()` e normaliza |
| `scripts/persistence.js` | Já é genérico — salva `state.retorno` sem conhecimento dos campos |
| `scripts/restore.js` | Já é genérico — chama `setRetornoData()` + `updateConditionalFields()` |
| `scripts/app.js` | Event delegation captura eventos de novos campos automaticamente |
| `scripts/dom.js` | Sem novos elementos estáticos para cache |
| `scripts/iniciais.js` | A menos que novos tipos de ordem sejam adicionados ao dropdown |
| `scripts/state.js` | `state.retorno` é genérico (objeto dinâmico) |
| `scripts/send.js` | Sem alterações necessárias |

---

## 8. Padrões de Teste

### `tests/fields.test.js` — Testes Estruturais

```js
// Testar contagem de campos para um tipo específico
it('should have exactly N fields for TIPO X', () => {
  const fields = getRetornoFields('NOME EXATO DO TIPO');
  expect(fields.length).toBe(N);
});

// Testar propriedades do primeiro campo
it('should have first field with correct properties', () => {
  const fields = getRetornoFields('NOME EXATO DO TIPO');
  expect(fields[0].nome).toBe('field_name');
  expect(fields[0].tipo).toBe('select');
  expect(fields[0].opcoes).toEqual(['OPT1', 'OPT2']);
});

// Testar que campo condicional existe
it('should have conditional on dependent field', () => {
  const fields = getRetornoFields('NOME EXATO DO TIPO');
  const child = fields.find(f => f.nome === 'child_field');
  expect(child.condicional).toEqual({
    campoRef: 'parent_field',
    valor: 'TRIGGER_VALUE'
  });
});

// Testar que FIELD_DESCRICAO foi removido
it('should NOT have descricao field', () => {
  const fields = getRetornoFields('NOME EXATO DO TIPO');
  expect(fields.find(f => f.nome === 'descricao')).toBeUndefined();
});

// Testar que tipos compartilhados usam mesma referência
it('should share array reference between TIPO_A and TIPO_B', () => {
  const a = getRetornoFields('TIPO A');
  const b = getRetornoFields('TIPO B');
  expect(a).toBe(b);
});
```

### `tests/retornos.test.js` — Testes Comportamentais

```js
// Testar renderização
it('should render all N fields for TIPO X', () => {
  DOM.tipoOrdem.value = 'NOME EXATO DO TIPO';
  renderRetorno();
  // Substitua "situacao_corte", "desligamento" pelos campo_nome reais
  expect(document.getElementById('situacao_corte')).toBeTruthy();
  expect(document.getElementById('desligamento')).toBeTruthy();
});

// Testar agrupamento visual (mesma linha = mesmo flex container)
it('should group same-linha fields in flex container', () => {
  DOM.tipoOrdem.value = 'NOME EXATO DO TIPO';
  renderRetorno();
  const groups = document.querySelectorAll('[data-field-nome]');
  // Verificar que campos mesma linha estão no mesmo parent
});

// Testar condicional — oculto inicialmente
it('should initially hide child field', () => {
  DOM.tipoOrdem.value = 'NOME EXATO DO TIPO';
  renderRetorno();
  const group = document.querySelector('[data-field-nome="child"]');
  expect(group.style.display).toBe('none');
});

// Testar condicional — mostrar ao ativar gatilho
it('should show child when parent trigger value is selected', () => {
  DOM.tipoOrdem.value = 'NOME EXATO DO TIPO';
  renderRetorno();
  document.getElementById('parent').value = 'TRIGGER';
  document.getElementById('parent').dispatchEvent(new Event('change'));
  const group = document.querySelector('[data-field-nome="child"]');
  expect(group.style.display).toBe('');
});

// Testar condicional negado — mostrado inicialmente (diferente do normal)
it('should show negated field initially (no value matches negated target)', () => {
  DOM.tipoOrdem.value = 'NOME EXATO DO TIPO';
  renderRetorno();
  const group = document.querySelector('[data-field-nome="negated_field"]');
  expect(group.style.display).toBe('');
});

// Testar condicional negado — ocultar ao selecionar valor excluído
it('should hide negated field when the excluded value is selected', () => {
  DOM.tipoOrdem.value = 'NOME EXATO DO TIPO';
  renderRetorno();
  document.getElementById('parent_name').value = 'EXCLUDED_VALUE';
  document.getElementById('parent_name').dispatchEvent(new Event('change'));
  const group = document.querySelector('[data-field-nome="negated_field"]');
  expect(group.style.display).toBe('none');
});

// Testar coleta — só captura campos visíveis
it('should collect visible fields but skip hidden ones', () => {
  DOM.tipoOrdem.value = 'NOME EXATO DO TIPO';
  renderRetorno();
  // Ativar trigger
  document.getElementById('parent').value = 'TRIGGER';
  document.getElementById('parent').dispatchEvent(new Event('change'));
  document.getElementById('child').value = 'some value';
  const data = collectRetorno();
  expect(data['child']).toBe('some value');
});
```

---

## 9. Escopo: O que DEVE vs NÃO DEVE

### ✅ DEVE fazer (em ordem):

1. **Apenas `scripts/fields.js`**: adicionar entries em `retornoFieldsByTipo`, criar constantes compartilhadas, remover `FIELD_DESCRICAO`
2. **Testes**: `tests/fields.test.js` (estrutura) + `tests/retornos.test.js` (comportamento)
3. **`sw.js`**: bump no `CACHE_NAME`
4. **Rodar `npm test`**: todos os testes existentes devem passar (atualmente ~394, conforme `AGENTS.md`)
5. **Sinalizar mismatches** de nome de tipo entre planilha e dropdown ao usuário

### ❌ NÃO DEVE fazer:

- ❌ Modificar `retornos.js`, `collectors.js`, `validation.js`, `email.js`, `persistence.js`, `restore.js`
- ❌ Modificar `app.js`, `dom.js`, `iniciais.js`, `state.js`, `send.js`
- ❌ Implementar lógica customizada de validação (o sistema já faz)
- ❌ Implementar lógica customizada de persistência (o sistema já faz)
- ❌ Implementar lógica customizada de e-mail (o sistema já faz)
- ❌ Implementar lógica customizada de reatividade (o sistema já faz)
- ❌ Incluir "Selecione" manualmente nas opções
- ❌ Adicionar `FIELD_DESCRICAO` em arrays específicos a menos que a planilha o liste

---

## 10. Convenções do Projeto (AGENTS.md)

Extraídas do `AGENTS.md`:

| Convensão | Detalhe |
|---|---|
| **DOM cache** | Usar `DOM` importado de `dom.js` — nunca `getElementById` |
| **DOM.tipoOrdem** | Criado dinamicamente, atribuído manualmente após `renderIniciais()` |
| **CACHE_NAME** | Bump sempre que assets estáticos mudarem |
| **Tipo de Ordem names** | Match **exato** entre dropdown e `retornoFieldsByTipo` |
| **Campos ocultos** | Excluídos de email, validação e persistência (dupla proteção) |
| **Selects** | Placeholder "Selecione" adicionado automaticamente |
| **snake_case** | Padrão para novos campos. O único array legado (`UC_CORTADA_FIELDS`) usa kebab-case; todos os demais arrays de retorno já usam snake_case — siga este padrão |
| **Collectors** | Sempre usar `collectRetorno()` — nunca ler DOM diretamente |
| **Condicionais** | Pai antes do filho no array; cascade automático |

---

## 11. Fluxo de Trabalho Sugerido

```
1. Usuário indica: "Use a aba/planilha X"
    ↓
2. Ler dados da aba indicada
    ↓
3. Conferir match de nomes com dropdown (iniciaisFields)
    ├── OK → seguir
    └── MISMATCH → sinalizar ao usuário
    ↓
4. Identificar tipos compartilhados → criar constantes
    ↓
5. Identificar condicionais → extrair campoRef / valor / negado
    ↓
6. Implementar em scripts/fields.js
    ↓
7. Adicionar testes (fields.test.js + retornos.test.js)
    ↓
8. Rodar npm test
    ├── Passou → próximo grupo / finalizar
    └── Falhou → corrigir
    ↓
9. Bump CACHE_NAME em sw.js
    ↓
10. Commit + Push
```

---

## 12. Erros Comuns (Evitar)

| Erro | Consequência | Como evitar |
|---|---|---|
| Esquecer de remover `FIELD_DESCRICAO` | Tipo fica com campo descrição extra + campos específicos | Sempre verificar se o tipo tem entrada própria em `retornoFieldsByTipo` |
| Nome do tipo diferente do dropdown | `getRetornoFields` cai no `default`, campos não aparecem | Copiar o nome exato do `<option>` no `iniciaisFields` |
| Campo condicional antes do pai no array | `updateConditionalFields` não encontra o pai ainda, condicional quebra | Ordenar o array por dependência: pais primeiro |
| Usar "Selecione" nas opções do SELECT | Aparece duplicado (sistema já adiciona) | Nunca incluir nas `opcoes` |
| Duas entradas com mesmo `campo_nome` no array | `getElementById` e `querySelector` pegam o primeiro apenas | Verificar nomes únicos antes de implementar |
| Array com tipos diferentes referenciando constantes distintas | Tipos que deviam compartilhar campos têm campos diferentes | Usar a **mesma referência** de array para tipos que compartilham |
| Ignorar a coluna `tipo_retorno` | Implementar campos para tipos `template`/`direto` que não precisam | Priorizar apenas tipos com `tipo_retorno = tela_especifica` |
| Não incrementar `CACHE_NAME` | Usuários com Service Worker podem não ver os novos campos | Bump no `sw.js` sempre que mudar `fields.js` |

---

## 13. Checklist de Verificação Pós-Implementação

Antes de dar o grupo como concluído, conferir cada item:

- [ ] Nomes dos tipos batem exatamente com o dropdown (`iniciaisFields`)
- [ ] `FIELD_DESCRICAO` foi removido dos tipos que ganharam campos (a menos que a planilha o inclua)
- [ ] Nenhum `campo_nome` está duplicado no mesmo array
- [ ] Campos condicionais têm o pai declarado **antes** do filho no array
- [ ] `tipo` convertido para minúsculo (`SELECT` → `select`)
- [ ] Nenhuma opção contém "Selecione" (sistema adiciona automaticamente)
- [ ] Constantes compartilhadas declaradas **antes** de `retornoFieldsByTipo`
- [ ] Tipos que compartilham campos apontam para a **mesma referência** de array
- [ ] `npm test` passou sem falhas
- [ ] `CACHE_NAME` no `sw.js` foi incrementado
- [ ] Testes adicionados em `tests/fields.test.js` e `tests/retornos.test.js`
- [ ] Nomes de campo seguem `snake_case` (padrão) ou `kebab-case` (só para legados compatíveis com `UC_CORTADA_FIELDS`)

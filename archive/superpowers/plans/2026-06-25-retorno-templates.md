# Retorno Templates — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que cada Tipo de Ordem com campos personalizados tenha seu próprio template de texto de retorno, substituindo a listagem genérica `LABEL: valor\n` por um texto personalizado com condicionais.

**Architecture:** Template declarativo (JSON puro) em arquivo separado, motor de template em `email.js`, fallback automático para o comportamento genérico quando não há template.

**Tech Stack:** JavaScript (ES6 modules), Vitest, jsdom

---

## File Structure

| Arquivo                             | Ação          | Responsabilidade                                                |
| ----------------------------------- | ------------- | --------------------------------------------------------------- |
| `scripts/data/retorno-templates.js` | **Criar**     | Definições declarativas dos templates por Tipo de Ordem         |
| `scripts/email.js`                  | **Modificar** | Adicionar `applyRetornoTemplate()` + modificar `composeEmail()` |
| `tests/email.test.js`               | **Modificar** | Adicionar testes para o motor de template e integração          |

---

### Task 1: Criar arquivo de templates

**Files:**

- Create: `scripts/data/retorno-templates.js`
- Test: `tests/email.test.js` (Task 3)

- [ ] **Step 1: Criar arquivo vazio com estrutura base**

```js
// scripts/data/retorno-templates.js
// Templates declarativos de retorno por Tipo de Ordem.
// Formato:
//   "NOME DO TIPO": [
//     { condicao: { campo: "nome", valor: "X" }, blocos: [{ texto: "..." }] },
//     { blocos: [{ texto: "..." }] }  // else (opcional)
//   ]

export const retornoTemplates = {
  // Templates serão adicionados incrementalmente
};
```

- [ ] **Step 2: Adicionar template para CORTE POR FALTA DE PAGAMENTO**

```js
export const retornoTemplates = {
  'CORTE POR FALTA DE PAGAMENTO': [
    {
      condicao: { campo: 'situacao_corte', valor: 'CLIENTE CORTADO' },
      blocos: [
        { texto: 'CORTE EXECUTADO CONFORME ORDEM DE SERVIÇO {situacao_corte}' },
        { texto: '{descricao}' },
      ],
    },
    {
      // else
      blocos: [{ texto: '{situacao_corte}.' }, { texto: '{descricao}' }],
    },
  ],
};
```

- [ ] **Step 3: Commit**

```bash
git add scripts/data/retorno-templates.js
git commit -m "feat: add retornoTemplates data file with CORTE POR FALTA DE PAGAMENTO template"
```

---

### Task 2: Adicionar motor de template e integrar em composeEmail

**Files:**

- Modify: `scripts/email.js`

- [ ] **Step 1: Importar retornoTemplates no email.js**

Adicionar ao topo de `scripts/email.js` (após a linha `import { formatDate } from './utils.js';`):

```js
import { retornoTemplates } from './data/retorno-templates.js';
```

- [ ] **Step 2: Adicionar função applyRetornoTemplate antes de composeEmail**

Inserir antes da função `composeEmail` (após a definição de `EQUIP_LABELS`, antes de `export function composeEmail`):

```js
/**
 * Motor de template declarativo.
 * Retorna texto personalizado ou null (fallback genérico).
 */
export function applyRetornoTemplate(tipo, data) {
  const template = retornoTemplates[tipo];
  if (!template) return null;

  const variante = template.find(v => {
    if (!v.condicao) return true;
    const valorCampo = data.retorno?.[v.condicao.campo];
    if (v.condicao.valor !== undefined) {
      const valores = Array.isArray(v.condicao.valor) ? v.condicao.valor : [v.condicao.valor];
      return valores.includes(valorCampo);
    }
    if (v.condicao.diferenteDe !== undefined) {
      return valorCampo !== v.condicao.diferenteDe;
    }
    return false;
  });

  if (!variante) return null;

  return variante.blocos
    .map(bloco => {
      let texto = bloco.texto;
      // Substitui {placeholder} por valores dos dados
      for (const [nome, valor] of Object.entries(data.retorno || {})) {
        texto = texto.replaceAll(`{${nome}}`, valor || '');
      }
      // Também resolve placeholders de iniciais e equipamentos
      for (const [nome, valor] of Object.entries(data.iniciais || {})) {
        texto = texto.replaceAll(`{${nome}}`, valor || '');
      }
      return texto;
    })
    .join('\n');
}
```

- [ ] **Step 3: Modificar composeEmail para usar template**

Substituir o bloco "Campos de Retorno" (linhas 62-69 atuais):

```js
const tipo = data.iniciais?.['tipo-ordem'] || '';

// Tenta template personalizado
const textoPersonalizado = applyRetornoTemplate(tipo, data);

if (textoPersonalizado) {
  body += '\n' + textoPersonalizado;
} else {
  // Fallback: comportamento genérico atual
  const retornoFields = getRetornoFields(tipo);
  retornoFields.forEach(field => {
    if (!data.retorno || !(field.nome in data.retorno)) return;
    const val = data.retorno[field.nome];
    body += `\n${normalizeText(field.label)}: ${normalizeText(val || '(nao preenchido)')}`;
  });
}
```

- [ ] **Step 4: Executar testes existentes para verificar que não quebraram**

```bash
npx vitest run tests/email.test.js
```

Expected: todos os testes existentes passam (eles usam `ADEQUACAO SMF` que não tem template → fallback genérico).

- [ ] **Step 5: Commit**

```bash
git add scripts/email.js
git commit -m "feat: add applyRetornoTemplate and integrate into composeEmail"
```

---

### Task 3: Adicionar testes para o motor de template

**Files:**

- Test: `tests/email.test.js`

- [ ] **Step 1: Escrever testes para applyRetornoTemplate**

Adicionar novo describe block após o describe `composeEmail` existente:

```js
describe('applyRetornoTemplate', () => {
  it('should return null for tipo without template', () => {
    const result = applyRetornoTemplate('ADEQUACAO SMF', { retorno: {} });
    expect(result).toBeNull();
  });

  it('should return null for unknown tipo', () => {
    const result = applyRetornoTemplate('TIPO INEXISTENTE', { retorno: {} });
    expect(result).toBeNull();
  });

  it('should select CLIENTE CORTADO variant and substitute placeholders', () => {
    const data = {
      retorno: {
        situacao_corte: 'CLIENTE CORTADO',
        descricao: 'Corte realizado com sucesso',
      },
    };
    const result = applyRetornoTemplate('CORTE POR FALTA DE PAGAMENTO', data);
    expect(result).toContain('CORTE EXECUTADO CONFORME ORDEM DE SERVIÇO CLIENTE CORTADO');
    expect(result).toContain('Corte realizado com sucesso');
  });

  it('should select else variant when situacao is not CLIENTE CORTADO', () => {
    const data = {
      retorno: {
        situacao_corte: 'CLIENTE VISITADO CONTA PAGA',
        descricao: 'Cliente pagou a conta',
      },
    };
    const result = applyRetornoTemplate('CORTE POR FALTA DE PAGAMENTO', data);
    expect(result).toContain('CLIENTE VISITADO CONTA PAGA.');
    expect(result).toContain('Cliente pagou a conta');
  });

  it('should handle empty field values without breaking', () => {
    const data = {
      retorno: {
        situacao_corte: 'SEM ACESSO PARA EXECUTAR O CORTE',
        descricao: '',
      },
    };
    const result = applyRetornoTemplate('CORTE POR FALTA DE PAGAMENTO', data);
    expect(result).toContain('SEM ACESSO PARA EXECUTAR O CORTE.');
    expect(result).toBeTruthy();
  });

  it('should handle missing descricao field', () => {
    const data = {
      retorno: {
        situacao_corte: 'CLIENTE CORTADO',
        // descricao não informado
      },
    };
    const result = applyRetornoTemplate('CORTE POR FALTA DE PAGAMENTO', data);
    expect(result).toContain('CORTE EXECUTADO CONFORME ORDEM DE SERVIÇO CLIENTE CORTADO');
  });
});
```

- [ ] **Step 2: Adicionar import de applyRetornoTemplate no topo do test**

O import atual é:

```js
import { composeEmail } from '../scripts/email.js';
```

Mudar para:

```js
import { composeEmail, applyRetornoTemplate } from '../scripts/email.js';
```

- [ ] **Step 3: Escrever teste de integração: composeEmail com template**

Adicionar dentro do describe `composeEmail`:

```js
it('should use template when available for CORTE POR FALTA DE PAGAMENTO', () => {
  const data = {
    iniciais: { ...sampleData.iniciais, 'tipo-ordem': 'CORTE POR FALTA DE PAGAMENTO' },
    equipamentos: { instaladoEquip: 'NAO', retiradoEquip: 'NAO', instalados: {}, retirados: {} },
    retorno: { situacao_corte: 'CLIENTE CORTADO', descricao: 'Corte efetuado na UC' },
  };
  const body = composeEmail(data);
  // Deve conter o texto do template, não o label genérico
  expect(body).toContain('CORTE EXECUTADO CONFORME ORDEM DE SERVIÇO CLIENTE CORTADO');
  expect(body).toContain('Corte efetuado na UC');
  // Não deve conter o label genérico "SITUACAO:" (pois o template substitui)
  expect(body).not.toContain('SITUACAO:');
});
```

- [ ] **Step 4: Executar testes**

```bash
npx vitest run tests/email.test.js
```

Expected: todos os 12+ testes passam.

- [ ] **Step 5: Commit**

```bash
git add tests/email.test.js scripts/email.js
git commit -m "test: add tests for applyRetornoTemplate and template integration"
```

---

### Task 4: Verificar integração total e testes completos

- [ ] **Step 1: Executar suite completa de testes**

```bash
npm test
```

Expected: todos os testes existentes passam.

- [ ] **Step 2: Verificar se há cobertura adicional necessária**

Revisar se `tests/retornos.test.js`, `tests/collectors.test.js` ou `tests/fields.test.js` precisam de ajustes — em princípio nenhum, pois a mudança é isolada em `email.js`.

- [ ] **Step 3: Commit final**

```bash
git add -A
git commit -m "chore: finalize retorno templates integration"
```

---

## Referências

- Spec: `docs/superpowers/specs/2026-06-25-retorno-templates-design.md`
- Dados: `scripts/data/fields-data.js` (definições de campos por tipo)
- Testes existentes: `tests/email.test.js` (cobre composeEmail genérico)

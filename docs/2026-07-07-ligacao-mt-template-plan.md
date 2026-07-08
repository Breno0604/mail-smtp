# LIGACAO NOVA MT Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add retorno template for LIGACAO NOVA MEDIA TENSAO and LIGACAO NOVA MT - CLIENTE LIVRE with conditional text blocks and array-condition support.

**Architecture:** Extend `matchCondition()` in `email.js` to accept array of conditions (AND). Add template constant `LIGACAO_NOVA_MT_TEMPLATE` to `retorno-templates.js` with 3 variants (VISTORIA, LIGAÇÃO, VISTORIA+LIGAÇÃO). Both tipos share the same template.

**Tech Stack:** JS (ES6 modules), Vitest, Node.js

---

### Task 1: Extend matchCondition() for array conditions

**Files:**

- Modify: `scripts/email.js:27-38`

- [ ] **Step 1: Understand current matchCondition**

Read `scripts/email.js` lines 27-38 to understand the current single-condition logic.

- [ ] **Step 2: Add array condition support**

Modify `matchCondition()` to handle `condicao` as array (AND logic):

```js
function matchCondition(condicao, data) {
  if (!condicao) return true;
  // Support array of conditions (AND logic)
  if (Array.isArray(condicao)) {
    return condicao.every(c => matchCondition(c, data));
  }
  const valorCampo = data.retorno?.[condicao.campo];
  if (condicao.valor !== undefined) {
    const valores = Array.isArray(condicao.valor) ? condicao.valor : [condicao.valor];
    return valores.includes(valorCampo);
  }
  if (condicao.diferenteDe !== undefined) {
    return valorCampo !== condicao.diferenteDe;
  }
  return false;
}
```

Key change: 2 lines added at the top (`Array.isArray` check with `every`).

- [ ] **Step 3: Run existing tests to confirm backward compatibility**

Run: `npm test`
Expected: All existing 511 tests pass (no regression)

- [ ] **Step 4: Commit**

```bash
git add scripts/email.js
git commit -m "feat: support array conditions in matchCondition (AND logic)"
```

---

### Task 2: Add LIGACAO NOVA MT template

**Files:**

- Modify: `scripts/data/retorno-templates.js`

- [ ] **Step 1: Add template constant before retornoTemplates export**

Add after `UC_CORTADA_TEMPLATE` (around line 23):

```js
const LIGACAO_NOVA_MT_TEMPLATE = [
  // Variant 1: VISTORIA only
  {
    condicao: { campo: 'retorno_ligacao', valor: 'VISTORIA' },
    blocos: [
      {
        condicao: { campo: 'obra', valor: 'CONCLUIDA' },
        texto: 'OBRA CONCLUIDA',
      },
      {
        condicao: { campo: 'obra', valor: 'NAO CONCLUIDA' },
        texto: 'OBRA NAO CONCLUIDA',
      },
      // Medição — compound conditions (AND)
      {
        condicao: [
          { campo: 'status_medicao', valor: 'COM MEDICAO' },
          { campo: 'tipo_medicao', valor: 'ACOPLADA' },
        ],
        texto: 'COM MEDICAO ACOPLADO NO LOCAL',
      },
      {
        condicao: [
          { campo: 'status_medicao', valor: 'COM MEDICAO' },
          { campo: 'tipo_medicao', valor: 'CUBICULO' },
        ],
        texto: 'COM MEDICAO CUBICULO NO LOCAL',
      },
      {
        condicao: [
          { campo: 'status_medicao', valor: 'COM MEDICAO' },
          { campo: 'tipo_medicao', valor: 'SEMI-DIRETA' },
        ],
        texto: 'COM MEDICAO SEMI-DIRETA NO LOCAL',
      },
      {
        condicao: [
          { campo: 'status_medicao', valor: 'COM MEDICAO' },
          { campo: 'tipo_medicao', valor: 'DIRETA' },
        ],
        texto: 'COM MEDICAO DIRETA NO LOCAL',
      },
      {
        condicao: { campo: 'status_medicao', valor: 'SEM MEDICAO' },
        texto: 'SEM MEDICAO NO LOCAL',
      },
      // Ponto de Entrega
      {
        condicao: { campo: 'ponto_de_entrega', valor: 'DE ACORDO' },
        texto: 'PONTO DE ENTREGA DE ACORDO COM PROJETO',
      },
      {
        condicao: { campo: 'ponto_de_entrega', valor: 'EM DESACORDO' },
        texto: 'PONTO DE ENTREGA EM DESACORDO COM O PROJETO',
      },
      {
        condicao: { campo: 'ponto_de_entrega', valor: 'NÃO CONSTRUIDO' },
        texto: 'PONTO DE ENTREGA NÃO CONSTRUIDO',
      },
      // Medidor de BT
      {
        condicao: { campo: 'medidor_bt', valor: 'COM MEDIDOR BT' },
        texto: 'COM {qtd_medidor_bt} MEDIDOR DE BT',
      },
      {
        condicao: { campo: 'medidor_bt', valor: 'SEM MEDIDOR BT' },
        texto: 'SEM MEDIDOR DE BT',
      },
      // Acesso
      {
        condicao: { campo: 'acesso_medicao', valor: 'REGULAR' },
        texto: 'ACESSO A MEDICAO REGULAR',
      },
      {
        condicao: { campo: 'acesso_medicao', valor: 'IRREGULAR' },
        texto: 'ACESSO A MEDICAO IRREGULAR DEVIDO {acesso_ponto_de_entrega}',
      },
      {
        condicao: { campo: 'acesso_medicao', valor: 'SEM ACESSO' },
        texto: 'SEM ACESSO A MEDICAO DEVIDO {acesso_ponto_de_entrega}',
      },
      { texto: '' },
      { texto: '{descricao}' },
    ],
  },
  // Variant 2: LIGAÇÃO only
  {
    condicao: { campo: 'retorno_ligacao', valor: 'LIGAÇÃO' },
    blocos: [
      {
        condicao: { campo: 'ligacao', valor: 'CONCLUIDA' },
        texto: 'LIGAÇÃO CONCLUIDA',
      },
      {
        condicao: { campo: 'ligacao', valor: 'NAO CONCLUIDA' },
        texto: 'LIGAÇÃO NAO CONCLUIDA',
      },
      {
        condicao: { campo: 'tombamento', diferenteDe: '' },
        texto: 'TOMBAMENTO: {tombamento}',
      },
      { texto: '' },
      { texto: '{descricao}' },
    ],
  },
  // Variant 3: VISTORIA + LIGAÇÃO
  {
    condicao: { campo: 'retorno_ligacao', valor: 'VISTORIA + LIGAÇÃO' },
    blocos: [
      {
        condicao: { campo: 'ligacao', valor: 'CONCLUIDA' },
        texto: 'LIGAÇÃO CONCLUIDA',
      },
      {
        condicao: { campo: 'ligacao', valor: 'NAO CONCLUIDA' },
        texto: 'LIGAÇÃO NAO CONCLUIDA',
      },
      {
        condicao: { campo: 'tombamento', diferenteDe: '' },
        texto: 'TOMBAMENTO: {tombamento}',
      },
      // Obra
      {
        condicao: { campo: 'obra', valor: 'CONCLUIDA' },
        texto: 'OBRA CONCLUIDA',
      },
      {
        condicao: { campo: 'obra', valor: 'NAO CONCLUIDA' },
        texto: 'OBRA NAO CONCLUIDA',
      },
      // Medição — compound conditions
      {
        condicao: [
          { campo: 'status_medicao', valor: 'COM MEDICAO' },
          { campo: 'tipo_medicao', valor: 'ACOPLADA' },
        ],
        texto: 'COM MEDICAO ACOPLADO NO LOCAL',
      },
      {
        condicao: [
          { campo: 'status_medicao', valor: 'COM MEDICAO' },
          { campo: 'tipo_medicao', valor: 'CUBICULO' },
        ],
        texto: 'COM MEDICAO CUBICULO NO LOCAL',
      },
      {
        condicao: [
          { campo: 'status_medicao', valor: 'COM MEDICAO' },
          { campo: 'tipo_medicao', valor: 'SEMI-DIRETA' },
        ],
        texto: 'COM MEDICAO SEMI-DIRETA NO LOCAL',
      },
      {
        condicao: [
          { campo: 'status_medicao', valor: 'COM MEDICAO' },
          { campo: 'tipo_medicao', valor: 'DIRETA' },
        ],
        texto: 'COM MEDICAO DIRETA NO LOCAL',
      },
      {
        condicao: { campo: 'status_medicao', valor: 'SEM MEDICAO' },
        texto: 'SEM MEDICAO NO LOCAL',
      },
      // Ponto de Entrega
      {
        condicao: { campo: 'ponto_de_entrega', valor: 'DE ACORDO' },
        texto: 'PONTO DE ENTREGA DE ACORDO COM PROJETO',
      },
      {
        condicao: { campo: 'ponto_de_entrega', valor: 'EM DESACORDO' },
        texto: 'PONTO DE ENTREGA EM DESACORDO COM O PROJETO',
      },
      {
        condicao: { campo: 'ponto_de_entrega', valor: 'NÃO CONSTRUIDO' },
        texto: 'PONTO DE ENTREGA NÃO CONSTRUIDO',
      },
      // Medidor de BT
      {
        condicao: { campo: 'medidor_bt', valor: 'COM MEDIDOR BT' },
        texto: 'COM {qtd_medidor_bt} MEDIDOR DE BT',
      },
      {
        condicao: { campo: 'medidor_bt', valor: 'SEM MEDIDOR BT' },
        texto: 'SEM MEDIDOR DE BT',
      },
      // Acesso
      {
        condicao: { campo: 'acesso_medicao', valor: 'REGULAR' },
        texto: 'ACESSO A MEDICAO REGULAR',
      },
      {
        condicao: { campo: 'acesso_medicao', valor: 'IRREGULAR' },
        texto: 'ACESSO A MEDICAO IRREGULAR DEVIDO {acesso_ponto_de_entrega}',
      },
      {
        condicao: { campo: 'acesso_medicao', valor: 'SEM ACESSO' },
        texto: 'SEM ACESSO A MEDICAO DEVIDO {acesso_ponto_de_entrega}',
      },
      { texto: '' },
      { texto: '{descricao}' },
    ],
  },
];
```

- [ ] **Step 2: Add entries to retornoTemplates**

Add inside the `retornoTemplates` export object:

```js
  'LIGACAO NOVA MEDIA TENSAO': LIGACAO_NOVA_MT_TEMPLATE,
  'LIGACAO NOVA MT - CLIENTE LIVRE': LIGACAO_NOVA_MT_TEMPLATE,
```

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: All existing tests pass (no regression yet since we haven't tested new template)

- [ ] **Step 3: Commit**

```bash
git add scripts/data/retorno-templates.js
git commit -m "feat: add LIGACAO NOVA MT retorno template with 3 conditional variants"
```

---

### Task 3: Write tests for array conditions

**Files:**

- Modify: `tests/email.test.js` (add tests in the `applyRetornoTemplate` describe block)

- [ ] **Step 1: Add test for array condition (AND logic)**

```js
describe('array conditions (AND)', () => {
  it('should match when all array conditions are true', () => {
    const template = [
      {
        blocos: [
          {
            condicao: [
              { campo: 'status', valor: 'COM' },
              { campo: 'tipo', valor: 'ACOPLADA' },
            ],
            texto: 'COM MEDICAO ACOPLADO',
          },
        ],
      },
    ];
    const data = { retorno: { status: 'COM', tipo: 'ACOPLADA' } };
    const result = applyRetornoTemplate('TIPO_TESTE', data, template);
    expect(result).toContain('COM MEDICAO ACOPLADO');
  });

  it('should NOT match when any array condition is false', () => {
    const template = [
      {
        blocos: [
          {
            condicao: [
              { campo: 'status', valor: 'COM' },
              { campo: 'tipo', valor: 'ACOPLADA' },
            ],
            texto: 'COM MEDICAO ACOPLADO',
          },
        ],
      },
    ];
    const data = { retorno: { status: 'COM', tipo: 'CUBICULO' } };
    const result = applyRetornoTemplate('TIPO_TESTE', data, template);
    expect(result).not.toContain('COM MEDICAO ACOPLADO');
  });

  it('should work with existing single conditions unchanged', () => {
    const data = {
      retorno: { situacao_corte: 'CLIENTE CORTADO', descricao: 'ok' },
    };
    const result = applyRetornoTemplate('CORTE POR FALTA DE PAGAMENTO', data);
    expect(result).toContain('CLIENTE CORTADO.');
  });
});
```

Note: `applyRetornoTemplate` currently only takes `tipo` and `data`. To test ad-hoc templates, we need to either:

- (a) Add a 3rd optional parameter `templatesOverride` to `applyRetornoTemplate`
- (b) Or temporarily add to `retornoTemplates` object

Simpler approach (a): Add optional 3rd param:

```js
// email.js
export function applyRetornoTemplate(tipo, data, templatesOverride) {
  const template = templatesOverride?.[tipo] || retornoTemplates[tipo];
  ...
}
```

- [ ] **Step 2: Add optional templatesOverride parameter to applyRetornoTemplate**

Modify `applyRetornoTemplate` in `email.js` to accept optional 3rd arg:

```js
export function applyRetornoTemplate(tipo, data, templatesOverride) {
  const template = templatesOverride ? templatesOverride[tipo] : retornoTemplates[tipo];
  if (!template) return null;
  ...
}
```

- [ ] **Step 3: Run tests to verify array condition tests pass**

Run: `npx vitest run tests/email.test.js`
Expected: All tests pass (new + old)

- [ ] **Step 4: Commit**

```bash
git add scripts/email.js tests/email.test.js
git commit -m "feat: add optional templatesOverride param for testability; test array conditions"
```

---

### Task 4: Write tests for LIGACAO NOVA MT template

**Files:**

- Modify: `tests/email.test.js` (add tests inside `applyRetornoTemplate` block)

- [ ] **Step 1: Add describe block for LIGACAO NOVA MT template**

```js
describe('LIGACAO NOVA MT template', () => {
  const baseData = {
    retorno: { descricao: 'Serviço finalizado' },
  };

  it('should return null for VISTORIA only with incomplete data', () => {
    // When no retorno_ligacao is set, no variant matches
    const data = { retorno: { descricao: 'teste' } };
    const result = applyRetornoTemplate('LIGACAO NOVA MEDIA TENSAO', data);
    expect(result).toBeNull();
  });

  describe('VISTORIA variant', () => {
    const data = {
      retorno: {
        retorno_ligacao: 'VISTORIA',
        obra: 'CONCLUIDA',
        status_medicao: 'COM MEDICAO',
        tipo_medicao: 'ACOPLADA',
        ponto_de_entrega: 'DE ACORDO',
        medidor_bt: 'COM MEDIDOR BT',
        qtd_medidor_bt: '2',
        acesso_medicao: 'REGULAR',
        descricao: 'Serviço concluído',
      },
    };

    it('should render VISTORIA template correctly', () => {
      const result = applyRetornoTemplate('LIGACAO NOVA MEDIA TENSAO', data);
      expect(result).toContain('OBRA CONCLUIDA');
      expect(result).toContain('COM MEDICAO ACOPLADO NO LOCAL');
      expect(result).toContain('PONTO DE ENTREGA DE ACORDO COM PROJETO');
      expect(result).toContain('COM 2 MEDIDOR DE BT');
      expect(result).toContain('ACESSO A MEDICAO REGULAR');
      expect(result).toContain('Serviço concluído');
    });

    it('should show SEM MEDICAO when status_medicao is SEM MEDICAO', () => {
      const d = { ...data, retorno: { ...data.retorno, status_medicao: 'SEM MEDICAO' } };
      const result = applyRetornoTemplate('LIGACAO NOVA MEDIA TENSAO', d);
      expect(result).toContain('SEM MEDICAO NO LOCAL');
      expect(result).not.toContain('COM MEDICAO');
    });

    it('should show SEM MEDIDOR DE BT when medidor_bt is SEM MEDIDOR BT', () => {
      const d = { ...data, retorno: { ...data.retorno, medidor_bt: 'SEM MEDIDOR BT' } };
      const result = applyRetornoTemplate('LIGACAO NOVA MEDIA TENSAO', d);
      expect(result).toContain('SEM MEDIDOR DE BT');
      expect(result).not.toContain('COM ');
    });

    it('should show ACESSO IRREGULAR with motivo', () => {
      const d = {
        ...data,
        retorno: {
          ...data.retorno,
          acesso_medicao: 'IRREGULAR',
          acesso_ponto_de_entrega: 'BURACOS',
        },
      };
      const result = applyRetornoTemplate('LIGACAO NOVA MEDIA TENSAO', d);
      expect(result).toContain('ACESSO A MEDICAO IRREGULAR DEVIDO BURACOS');
    });
  });

  describe('LIGAÇÃO variant', () => {
    const data = {
      retorno: {
        retorno_ligacao: 'LIGAÇÃO',
        ligacao: 'CONCLUIDA',
        tombamento: 'ABC123',
        descricao: 'Ligação realizada',
      },
    };

    it('should render LIGAÇÃO template correctly', () => {
      const result = applyRetornoTemplate('LIGACAO NOVA MEDIA TENSAO', data);
      expect(result).toContain('LIGAÇÃO CONCLUIDA');
      expect(result).toContain('TOMBAMENTO: ABC123');
      expect(result).toContain('Ligação realizada');
    });

    it('should omit TOMBAMENTO when empty', () => {
      const d = { ...data, retorno: { ...data.retorno, tombamento: '' } };
      const result = applyRetornoTemplate('LIGACAO NOVA MEDIA TENSAO', d);
      expect(result).not.toContain('TOMBAMENTO');
    });

    it('should render NAO CONCLUIDA', () => {
      const d = { ...data, retorno: { ...data.retorno, ligacao: 'NAO CONCLUIDA' } };
      const result = applyRetornoTemplate('LIGACAO NOVA MEDIA TENSAO', d);
      expect(result).toContain('LIGAÇÃO NAO CONCLUIDA');
    });
  });

  describe('VISTORIA + LIGAÇÃO variant', () => {
    const data = {
      retorno: {
        retorno_ligacao: 'VISTORIA + LIGAÇÃO',
        ligacao: 'CONCLUIDA',
        tombamento: 'XYZ789',
        obra: 'CONCLUIDA',
        status_medicao: 'COM MEDICAO',
        tipo_medicao: 'CUBICULO',
        ponto_de_entrega: 'EM DESACORDO',
        medidor_bt: 'SEM MEDIDOR BT',
        acesso_medicao: 'REGULAR',
        descricao: 'Ambos realizados',
      },
    };

    it('should render combined VISTORIA + LIGAÇÃO correctly', () => {
      const result = applyRetornoTemplate('LIGACAO NOVA MEDIA TENSAO', data);
      expect(result).toContain('LIGAÇÃO CONCLUIDA');
      expect(result).toContain('TOMBAMENTO: XYZ789');
      expect(result).toContain('OBRA CONCLUIDA');
      expect(result).toContain('COM MEDICAO CUBICULO NO LOCAL');
      expect(result).toContain('PONTO DE ENTREGA EM DESACORDO COM O PROJETO');
      expect(result).toContain('SEM MEDIDOR DE BT');
      expect(result).toContain('ACESSO A MEDICAO REGULAR');
      expect(result).toContain('Ambos realizados');
    });
  });

  it('should work for LIGACAO NOVA MT - CLIENTE LIVRE as well', () => {
    const data = {
      retorno: {
        retorno_ligacao: 'VISTORIA',
        obra: 'CONCLUIDA',
        status_medicao: 'COM MEDICAO',
        tipo_medicao: 'DIRETA',
        ponto_de_entrega: 'DE ACORDO',
        medidor_bt: 'COM MEDIDOR BT',
        qtd_medidor_bt: '1',
        acesso_medicao: 'REGULAR',
        descricao: 'Cliente livre',
      },
    };
    const result = applyRetornoTemplate('LIGACAO NOVA MT - CLIENTE LIVRE', data);
    expect(result).toContain('COM MEDICAO DIRETA NO LOCAL');
    expect(result).toContain('COM 1 MEDIDOR DE BT');
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: All tests pass (new + existing)

- [ ] **Step 3: Commit**

```bash
git add tests/email.test.js
git commit -m "test: add LIGACAO NOVA MT template tests (3 variants, compound conditions)"
```

---

### Task 5: Full integration verification

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass (529+ tests)

- [ ] **Step 2: Verify CACHE_NAME was bumped**

Check commit output for `CACHE_NAME bumpado` message. If the pre-commit hook didn't run (e.g., --no-verify), bump manually.

- [ ] **Step 3: Push**

```bash
git push
```

# Spec: Melhorias no Formulário e Sidebar

**Data:** 2026-06-08  
**Status:** Aprovado

## Visão Geral

Oito melhorias no formulário de retorno e na sidebar para melhorar UX, persistência de dados e validação.

## Requisitos

### 1. Persistir Anexos no IndexedDB

**Problema:** `state.attachments` armazena objetos `File` que não são serializáveis. Ao recarregar a página, os anexos são perdidos.

**Solução:**

- Em `saveState()`: converter cada `File` para `{ name, type, data }` onde `data` é base64
- Em `restore.js`: reconstruir `File` objects com `new File([base64Blob], name, { type })`
- Adicionar função auxiliar em `utils.js` para converter base64 → Blob

**Arquivos:** `state.js`, `restore.js`, `utils.js`

### 2. Espaçamento do Filtro na Sidebar

**Problema:** Input de filtro está colado nas laterais da sidebar.

**Solução:**

- Remover `mx-4` do input em `sidebar.js:20`
- Adicionar `px-4` no container `.sidebar-inner` via `style.css`

**Arquivos:** `sidebar.js`, `style.css`

### 3. Espaço no Topo do Container

**Problema:** Container principal não tem padding-top.

**Solução:**

- Adicionar `pt-4` na classe do container em `index.html:20`

**Arquivos:** `index.html`

### 4. Step Indicators Clicáveis

**Problema:** Círculos das etapas não são interativos.

**Solução:**

- Adicionar `cursor-pointer` e `hover:bg-blue-50` nos `.step` via CSS
- Em `navigation.js`: adicionar listener de click em cada step para navegar (sem validação)
- Seção ativa: aplicar `bg-blue-100` dentro do círculo

**Arquivos:** `navigation.js`, `style.css`

### 5. Fundo Interno Mais Escuro

**Problema:** `bg-gray-50` é muito claro.

**Solução:**

- Trocar `bg-gray-50` para `bg-gray-100` em `index.html:20`

**Arquivos:** `index.html`

### 6. Validação de Data e Hora

**Problema:** Não há validação para data futura ou hora fim <= hora início.

**Solução:**

- Em `validation.js`, seção 1:
  - Se `data` > hoje → erro "Data não pode ser futura"
  - Se `hora_fim` <= `hora_inicio` → erro "Hora fim deve ser maior que hora início"

**Arquivos:** `validation.js`

### 7. Campo Coordenadas GPS

**Problema:** Não há campo para capturar localização GPS.

**Solução:**

- Adicionar campo em `fields.js`: `{ linha: 0, nome: "coordenadas", label: "Coordenadas", tipo: "coordinates", readonly: true }`
- Em `iniciais.js`: renderizar como input readonly
- Em `app.js` ou `reset.js`: ao criar novo registro, capturar via `navigator.geolocation.getCurrentPosition()`
- Formato: decimal `"-3.7327, -38.5270"`
- Se negada/indisponível: "Não disponível"
- Salvar em `state.iniciais.coordenadas` e persistir no IndexedDB

**Arquivos:** `fields.js`, `iniciais.js`, `app.js`, `reset.js`, `state.js`

### 8. Bump de Cache

**Problema:** Mudanças em assets estáticos exigem atualização do Service Worker.

**Solução:**

- Incrementar `CACHE_NAME` de `retorno-v4` para `retorno-v5` em `sw.js`

**Arquivos:** `sw.js`

## Dependências

- Item 1 (anexos) é independente
- Itens 2, 3, 5 são CSS/HTML simples
- Item 4 (steps clicáveis) é independente
- Item 6 (validação) é independente
- Item 7 (coordenadas) é independente
- Item 8 (cache) deve ser feito por último, após todas as outras mudanças

## Riscos

- Geolocalização pode ser negada pelo usuário → fallback para "Não disponível"
- Conversão de anexos para base64 pode aumentar tamanho do IndexedDB → monitorar quota
- Steps clicáveis sem validação podem permitir pular etapas com campos obrigatórios vazios → aceitar, pois é para visualização rápida

## Testes Manuais

1. Anexar arquivos, recarregar página, verificar se persistem
2. Abrir sidebar, verificar espaçamento do filtro
3. Verificar padding-top no container principal
4. Clicar em cada step, verificar navegação e destaque
5. Verificar cor de fundo interna
6. Tentar salvar com data futura ou hora fim <= início
7. Criar novo registro, verificar se coordenadas são capturadas automaticamente
8. Fazer deploy, verificar se PWA atualiza corretamente

# Filtro de Registros por UC ou OS na Sidebar

## Problema
A sidebar de registros lista todos os rascunhos/enviados sem nenhuma forma de busca. Com o acúmulo de registros, fica difícil localizar um específico.

## Abordagem Escolhida
Input único com busca em tempo real — o usuário digita e a lista filtra instantaneamente por UC ou OS.

## Arquivos Afetados
- `index.html` — adicionar input no HTML da sidebar
- `scripts/dom.js` — cache do elemento do input
- `scripts/sidebar.js` — lógica de filtro no `renderSidebar()`

## Especificação

### 1. HTML (`index.html`)
- Inserir um `<input type="search">` dentro de `.sidebar-inner`, entre `.sidebar-head` e `.sidebar-list`
- `id="sidebar-filter"`, `placeholder="Buscar por UC ou OS..."`, `autocomplete="off"`
- Estilo: largura total, padding, borda arredondada, mesma tipografia do formulário

### 2. DOM cache (`dom.js`)
- Adicionar `DOM.sidebarFilter = document.getElementById("sidebar-filter")`

### 3. Lógica de filtro (`sidebar.js`)
- `renderSidebar(filterTerm = "")` recebe termo opcional
- Case-insensitive: `filterTerm.toLowerCase()`
- Filtra registros onde `iniciais.uc` (convertido para string) OU `iniciais.os` contém o termo
- Listener `input` no `DOM.sidebarFilter` → `renderSidebar(this.value)`
- Ao limpar o input (term vazio), mostra todos os registros

### 4. Estados
- **Lista cheia**: sem filtro, comportamento atual
- **Filtrando**: só registros que match UC ou OS
- **Sem resultados**: mensagem `Nenhum registro encontrado para "${term}".` no lugar da lista
- **Lista vazia (sem registros)**: mensagem existente "Nenhum registro encontrado." (inalterado)

### 5. Não Escopo
- Não adicionar índices no IndexedDB (filtro só no frontend)
- Não adicionar debounce (a lista é pequena o suficiente para filtro síncrono)
- Não alterar `db.js`, `state.js`, ou outros módulos

## Observações
- O filtro não persiste entre aberturas da sidebar — sempre começa limpo
- Funciona tanto para registros "Rascunho" quanto "Enviado"

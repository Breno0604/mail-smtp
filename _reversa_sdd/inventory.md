# Inventário — mail-mvp

> Gerado pelo Scout em 2026-06-15

## Estrutura de Diretórios

```
/
├── index.html                  # Página principal (SPA)
├── style.css                   # Estilos customizados
├── tailwind.css                # Tailwind CSS compilado
├── tailwind-input.css          # Tailwind CSS fonte
├── manifest.json               # PWA manifest
├── sw.js                       # Service Worker
├── netlify.toml                # Configuração Netlify
├── package.json                # Dependências e scripts
├── postcss.config.js           # Config PostCSS
├── tailwind.config.js          # Config Tailwind
├── vitest.config.js            # Config Vitest
├── opencode.json               # Config OpenCode
├── fluxo-email.html            # Documentação fluxo de email
├── melhoria_layout.md          # Documentação melhorias layout
├── mobile_android.md           # Documentação mobile Android
│
├── scripts/                    # Módulos JS da aplicação
│   ├── app.js                  # Entry point principal
│   ├── attachments.js          # Upload/preview de anexos
│   ├── compress.js             # Compressão de imagens
│   ├── db.js                   # IndexedDB (v3)
│   ├── dom.js                  # Cache de elementos DOM
│   ├── duplicate.js            # Gerenciamento de duplicatas
│   ├── email.js                # Composição de email
│   ├── equipment.js            # Seção de equipamentos
│   ├── fields.js               # Definição de campos (iniciais + retorno)
│   ├── iniciais.js             # Seção "Início" (renderização + dados)
│   ├── persistence.js          # Persistência (save/restore)
│   ├── reset.js                # Reset do formulário
│   ├── restore.js              # Restore de registros
│   ├── retornos.js             # Seção "Retorno" (renderização + condicionais)
│   ├── send.js                 # Envio de email via Netlify Function
│   ├── sidebar.js              # Sidebar de registros
│   ├── state.js                # Estado global reativo
│   ├── storage.js              # Camada de storage (intermediário)
│   ├── styles.js               # Estilos dinâmicos
│   ├── sw-update.js            # Gerenciamento de update SW
│   ├── ui.js                   # Utilitários de UI (toast, modal)
│   ├── utils.js                # Utilitários gerais (coords, etc.)
│   └── validation.js           # Validação de formulário
│
├── tests/                      # Testes unitários
│   ├── setup.js                # Setup global (jsdom mocks)
│   ├── app-init.test.js        # Testes de inicialização
│   ├── attachments.test.js     # Testes de anexos
│   ├── compress.test.js        # Testes de compressão
│   ├── db.test.js              # Testes do IndexedDB
│   ├── duplicate.test.js       # Testes de duplicatas
│   ├── email.test.js           # Testes de email
│   ├── equipment.test.js       # Testes de equipamentos
│   ├── fields.test.js          # Testes de campos
│   ├── iniciais.test.js        # Testes da seção Início
│   ├── reset.test.js           # Testes de reset
│   ├── restore.test.js         # Testes de restore
│   ├── retornos.test.js        # Testes da seção Retorno
│   ├── sidebar.test.js         # Testes da sidebar
│   ├── state.test.js           # Testes de estado
│   ├── ui.test.js              # Testes de UI
│   ├── utils.test.js           # Testes de utilitários
│   └── validation.test.js      # Testes de validação
│
├── netlify/functions/          # Netlify Functions (serverless)
│   └── send.js                 # Envio SMTP via nodemailer
│
├── tools/
│   ├── generate-icons.mjs      # Geração de ícones PWA
│   └── gerar-planilha.mjs      # Geração de planilha Excel
│
├── icons/
│   ├── icon-192.png            # Ícone PWA 192px
│   └── icon-512.png            # Ícone PWA 512px
│
├── dados_projeto/              # Documentação do projeto
│   ├── analise_completa_ordens_servico.xlsx
│   ├── analise_persistencia.md
│   ├── campos_spinners.md
│   ├── email.md
│   ├── estrutura_app.md
│   ├── etapa_iniciais.xlsx
│   ├── fluxo_navegacao.md
│   ├── funcoes.md
│   ├── modelo_dados.md
│   ├── ordens_servico.md
│   ├── revisao.md
│   ├── tipos_ordem.xlsx
│   ├── tipos_ordem_template.csv
│   ├── tipos_ordem_template.xlsx
│   └── validacoes.md
│
├── docs/superpowers/           # Documentação de superpoderes
│   ├── plans/                  # Planos de implementação
│   └── specs/                  # Especificações técnicas
│
└── screnns/                    # Screenshots
    ├── aba_lateral.jpeg
    └── etapa_iniciais.jpeg
```

## Estatísticas

| Categoria         | Contagem |
|-------------------|----------|
| Arquivos JS       | 46       |
| Arquivos HTML     | 2        |
| Arquivos CSS      | 3        |
| Arquivos JSON     | 4        |
| Arquivos .mjs     | 2        |
| Testes (.test.js) | 17       |
| Total aproximado  | ~57 relevantes |

## Pontos de Entrada

| Caminho                            | Tipo               | Descrição                               |
|------------------------------------|---------------------|-----------------------------------------|
| `index.html`                       | App entry (HTML)    | Página principal do SPA                 |
| `scripts/app.js`                   | App entry (JS)      | Módulo principal ES6, inicializa tudo   |
| `netlify/functions/send.js`        | Serverless function | Função Netlify para envio de email SMTP |
| `sw.js`                            | Service Worker      | PWA offline support                     |
| `manifest.json`                    | PWA manifest        | Configuração do Progressive Web App     |

## Banco de Dados

| Tipo               | Detalhe                                        |
|--------------------|-------------------------------------------------|
| IndexedDB          | `mail-mvp` (v3), stores: `records`, `attachments` |
| localStorage       | Backup do estado do formulário                  |
| Chave primária     | UUID (`records`), ID composto (`attachments`)   |

## CI/CD

| Tipo          | Configuração                     |
|---------------|----------------------------------|
| Deploy        | Netlify auto-deploy via `git push` |
| Build         | `npm install` (no build server)  |
| Serverless    | Netlify Functions                |
| GitHub Actions| Não detectado                    |

## Testes

| Característica           | Valor                         |
|--------------------------|-------------------------------|
| Framework                | Vitest + jsdom                |
| N° de arquivos de teste  | 17                            |
| Total de testes          | ~334 (conforme AGENTS.md)     |
| Setup                    | `tests/setup.js` com mocks    |
| Cobertura                | V8 provider (scripts/**/*.js) |

## Service Worker

| Característica       | Valor                          |
|----------------------|--------------------------------|
| Cache name           | `retorno-v60`                  |
| Estratégia          | Cache-first (static assets)    |
| Auto-update          | `scripts/sw-update.js`         |

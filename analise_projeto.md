# Análise Completa do Projeto — Mail MVP

**Data:** 12/07/2026
**Versão analisada:** 1.1.0
**Tipo:** PWA (Progressive Web App) — Formulário de retorno de ordens de serviço
**Stack:** Vanilla HTML/CSS/JS (ES6 modules) + Tailwind CSS 3 + Netlify Functions (Node.js + Nodemailer) + IndexedDB

---

## Índice

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Arquitetura](#2-arquitetura)
3. [Qualidade do Código](#3-qualidade-do-código)
4. [Boas Práticas](#4-boas-práticas)
5. [Manutenibilidade](#5-manutenibilidade)
6. [Performance](#6-performance)
7. [Segurança](#7-segurança)
8. [Tratamento de Erros](#8-tratamento-de-erros)
9. [Consistência](#9-consistência)
10. [Reutilização](#10-reutilização)
11. [Escalabilidade](#11-escalabilidade)
12. [Testabilidade](#12-testabilidade)
13. [Interface e UX](#13-interface-e-ux)
14. [Documentação](#14-documentação)
15. [Dependências](#15-dependências)
16. [Organização Geral do Projeto](#16-organização-geral-do-projeto)
17. [Pontuação](#17-pontuação)
18. [Plano de Melhorias](#18-plano-de-melhorias)
19. [Roadmap](#19-roadmap)
20. [Conclusão](#20-conclusão)

---

## 1. Visão Geral do Projeto

O **Mail MVP** é uma PWA (Progressive Web Application) para preenchimento e envio de formulários de retorno de ordens de serviço via email. A aplicação funciona totalmente no cliente (browser) com persistência local via IndexedDB, e o envio de email é feito através de uma única Netlify Function que utiliza Nodemailer com SMTP.

### Números do Projeto

| Métrica                         | Valor                  |
| ------------------------------- | ---------------------- |
| Arquivos de código-fonte (JS)   | 27 módulos ES6         |
| Linhas de código JS (estimado)  | ~4.500                 |
| Arquivos de teste unitário      | 30 arquivos            |
| Arquivos de teste E2E           | 8 arquivos             |
| Backend (Netlify Function)      | 1 arquivo (121 linhas) |
| CSS (style.css)                 | 699 linhas             |
| Tailwind CSS                    | 928 linhas (compilado) |
| HTML                            | 245 linhas             |
| Dependências de produção        | 1 (nodemailer)         |
| Dependências de desenvolvimento | 16                     |

---

## 2. Arquitetura

### 2.1 Estrutura de Diretórios

`mail/
├── index.html              # Página única (SPA)
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
├── style.css               # CSS customizado (699 linhas)
├── tailwind.css            # Tailwind compilado (928 linhas)
├── tailwind-input.css      # Fonte do Tailwind
├── tailwind.config.js      # Configuração do Tailwind
├── scripts/                # 27 módulos JS (ES6)
│   ├── app.js              # Entry point / controller
│   ├── dom.js              # Cache de elementos DOM (Proxy)
│   ├── state.js            # Estado global mutável
│   ├── iniciais.js         # Renderização dos campos iniciais
│   ├── retornos.js         # Renderização dos campos de retorno
│   ├── equipment.js        # Seção de equipamentos
│   ├── equipment-keys.js   # Fonte única de verdade (9 chaves)
│   ├── attachments.js      # Gerenciamento de anexos
│   ├── compress.js         # Compressão de imagens
│   ├── collectors.js       # Coleta de dados DOM → state
│   ├── validation.js       # Validação de formulário (331 linhas)
│   ├── email.js            # Composição de email e templates
│   ├── send.js             # Orquestração de envio
│   ├── persistence.js      # Persistência IndexedDB
│   ├── db.js               # Abstração IndexedDB
│   ├── restore.js          # Restauração de registros
│   ├── reset.js            # Reset do formulário
│   ├── sidebar.js          # Sidebar de registros
│   ├── duplicate.js        # Detecção de duplicatas
│   ├── ui.js               # Feedback visual (toasts, modais)
│   ├── utils.js            # Utilitários gerais
│   ├── uuid.js             # Geração de UUID
│   ├── styles.js           # Constantes CSS
│   ├── sw-update.js        # Atualização do Service Worker
│   └── data/
│       ├── fields-data.js  # Definições estáticas (440 linhas)
│       └── retorno-templates.js # Templates de email (243 linhas)
├── netlify/
│   ├── functions/
│   │   └── send.js         # Única função backend (121 linhas)
│   └── netlify.toml
├── tests/                  # 30 arquivos de teste unitário
├── tests-e2e/              # 8 arquivos de teste E2E (Playwright)
├── graphify-out/           # Grafo de conhecimento
├── dados_projeto/          # Documentos de requisitos
├── docs/                   # Documentação adicional
├── icons/                  # Ícones PWA (192x192, 512x512)
└── archive/                # Código arquivado/obsoleto`

### 2.2 Modelo Arquitetural

O projeto adota um modelo **hub-and-spoke** centrado em dois módulos principais:

`                    ┌──────────────────────┐
                    │     dom.js (Proxy)    │◄── importado por 16 módulos
                    └──────────────────────┘
                    ┌──────────────────────┐
                    │   state.js (mutável)  │◄── importado por 13 módulos
                    └──────────────────────┘`

### 2.3 Pontos Fortes da Arquitetura

1. **Separação frontend/backend**: Clara — uma única Netlify Function para envio, todo o resto é cliente.
2. **Coletores (Collectors Pattern)**: A separação entre leitura de dados do DOM (collectors.js) e renderização é uma decisão arquitetural sólida.
3. **Granularidade de arquivos**: 27 módulos pequenos em vez de monolito. Maioria com menos de 200 linhas.
4. **Cache DOM com Proxy**: O módulo dom.js usa um Proxy para permitir que cacheDOM() seja chamada múltiplas vezes sem quebrar referências.
5. **Sistema de templates declarativo**: Os templates de email (
   etorno-templates.js) são declarativos, com sistema de blocos condicionais.
6. **Fonte única de verdade**: equipment-keys.js centraliza as 9 chaves de equipamento.

### 2.4 Problemas Arquiteturais

#### 🔴 A1 — Violações do cache DOM (Crítica)

**Localização:** utils.js:52, equipment.js:13-16, collectors.js:52-53,63,72, alidation.js:57,71,84,97-98,
estore.js:76,
etornos.js:111
**Categoria:** Arquitetura
**Explicação:** Apesar da existência do módulo dom.js, **7 arquivos** fazem document.getElementById() ou document.querySelectorAll() diretamente, quebrando a convenção arquitetural.
**Impacto:** Testes precisam duplicar a estrutura HTML em vez de confiar no cache. Mudanças em IDs HTML requerem alterações em múltiplos arquivos.
**Como corrigir:** Usar DOM.camposInstalados, DOM.camposRetirados, DOM.instaladoEquip, DOM.retiradoEquip onde disponíveis.

#### 🟠 A2 — Estado global mutável sem controle (Alta)

**Localização:** state.js:12-22
**Categoria:** Arquitetura
**Explicação:** state é um singleton mutável exportado como const. 13 módulos podem mutar state diretamente. Não há imutabilidade, notificações de mudança, ou ponto central de depuração.
**Impacto:** Depurar fluxo de dados é difícil. Refatorações são perigosas.
**Como corrigir:** Implementar Observer/EventEmitter para mudanças de estado. Expor setters em vez de permitir mutação direta.

#### 🟠 A3 — DOM como segunda fonte de verdade (Alta)

**Localização:** Global — state.js + eventos + collectors.js
**Categoria:** Arquitetura
**Explicação:** O código mantém **duas** fontes de verdade: o objeto state (JS) e os valores do DOM. Entre saveState(), estado e DOM podem divergir.
**Como corrigir:** Adotar fluxo unidirecional: eventos → state → render.

---

## 3. Qualidade do Código

### 3.1 Funções Excessivamente Longas (>50 linhas)

| Função       | Arquivo      | Linhas  | Problema                        |
| ------------ | ------------ | ------- | ------------------------------- |
| initEvents() | pp.js:54-168 | **114** | 6+ responsabilidades diferentes |

|
enderSidebar() | sidebar.js:24-130 | **106** | Fetch, sort, filter, render, event binding |
| pplyRecord() |
estore.js:20-118 | **104** | UUID, state, migration, render x3, restore x3, preview |
| saveState() | persistence.js:21-108 | **87** | Collect, UUID, createdAt, status, save record, save attachments |
| alidateSection1() | alidation.js:32-116 | **84** | Loop de required + 4 validações especiais |
|
enderRetorno() |
etornos.js:8-80 | **72** | Label, agrupamento, DOM, eventos, conditional fields |
| sendEmail() | send.js | **60** | Validação, duplicata, confirmação, compressão, fetch |
| composeEmail() | email.js | **52** | Iniciais, equipamentos, template, fallback |

### 3.2 Duplicação de Código (DRY)

#### 🔴 B1 — Refrões ipo === 'instalados' ? ... : ... repetidos 4× (Crítica)

**Localização:** equipment.js:85-86, 92, 95, 100
**Categoria:** DRY
**Explicação:** O padrão ipo === 'instalados' ? 'instaladoEquip' : 'retiradoEquip' aparece 4 vezes.
**Como corrigir:** Extrair helpers getControlSelectId(tipo) e getEquipStateKey(tipo).

#### 🟠 B2 — Equipamentos formatados com código idêntico (Alta)

**Localização:** email.js:77-86 e email.js:89-98
**Categoria:** DRY
**Explicação:** Dois blocos funcionalmente idênticos para instalados e retirados, diferindo apenas no state key.
**Como corrigir:** Extrair ormatEquipmentSection(data, type, headerLabel).

#### 🟠 B3 — Templates LIGACAO_NOVA_MT com ~80% de blocos duplicados (Alta)

**Localização:**
etorno-templates.js:25-108 e
etorno-templates.js:130-227
**Categoria:** DRY
**Explicação:** ~70 linhas de blocos idênticos entre as variantes 1 e 3.
**Como corrigir:** Extrair blocos comuns em constantes e usar spread para compor.

#### 🟡 B4 — FIELD_DESCRICAO redefinido inline (Média)

**Localização:** ields-data.js:161, 248, 372, 396
**Categoria:** DRY
**Explicação:** A constante é definida mas não reutilizada em 4 lugares.
**Como corrigir:** { ...FIELD_DESCRICAO, linha: 99 }.

#### 🟡 B5 — parseInt duplicado em linhas consecutivas (Média)

**Localização:** send.js:79-80
**Categoria:** DRY
**Explicação:** parseInt(process.env.SMTP_PORT || '465', 10) chamado duas vezes.
**Como corrigir:** Atribuir a const smtpPort = parseInt(...) e reutilizar.

#### 🔵 B6 — Unicode escapes em vez de caracteres literais (Baixa)

**Localização:** sidebar.js:91, duplicate.js:15
**Categoria:** Legibilidade
**Explicação:** '\u270F\uFE0F Editar' em vez de '✏️ Editar'.

#### 🔵 B7 — Convenção underscore (\_) para "privado" não respeitada (Baixa)

**Localização:** state.js:19
**Categoria:** Convenção
**Explicação:** \_createdAt sugere "privado" mas é acessado diretamente de outros módulos.
**Como corrigir:** Remover o underscore ou tornar acesso somente via getter.

### 3.3 Código Morto

#### 🟡 B8 — ext || '' é unreachable (Média)

**Localização:** send.js:94
**Categoria:** Código morto
**Explicação:** Linha 25 retorna early se !text. Na linha 94, ext é garantidamente string. O || '' nunca executa.

#### 🟡 B9 — Variáveis declaradas mas nunca usadas (Média)

**Localização:** db.js:138-139
**Categoria:** Código morto
**Explicação:** \_deletesDone e \_pendingPuts declaradas em saveAttachments mas nunca lidas.

---

## 4. Boas Práticas

### 4.1 SOLID

| Princípio                     | Avaliação  | Observação                                                              |
| ----------------------------- | ---------- | ----------------------------------------------------------------------- |
| **S — Single Responsibility** | ⚠️ Parcial | Arquivos pequenos, mas várias funções fazem múltiplas coisas            |
| **O — Open/Closed**           | ✅ Bom     | Sistema de campos condicionais e templates usa configuração declarativa |
| **L — Liskov Substitution**   | N/A        | Não usa herança de classes                                              |
| **I — Interface Segregation** | N/A        | Não usa interfaces                                                      |
| **D — Dependency Inversion**  | ❌ Fraco   | Módulos dependem de implementações concretas, não de abstrações         |

### 4.2 Tratamento de Erros — Problema Sistêmico

#### 🔴 C1 — 8+ instâncias de erros silenciosamente engolidos (Crítica)

| Arquivo               | Linha                      | Padrão                             | Consequência                            |
| --------------------- | -------------------------- | ---------------------------------- | --------------------------------------- |
| duplicate.js          | 34                         | catch { return true; }             | Permite envio duplicado se DB falhar    |
| db.js                 | 119                        |
| eq.onerror = () => {} | Falha em update silenciosa |
| send.js               | 65                         | catch (\_err) { showToast('...') } | Erro real descartado, mensagem genérica |
| sidebar.js            | 98-99                      | catch (\_err) { /_ ignore _/ }     | Edição falha sem feedback               |
| sidebar.js            | 117-118                    | catch (\_err) { /_ ignore _/ }     | Exclusão falha sem feedback             |
| persistence.js        | 70, 133                    | catch (err) { console.error(...) } | Logado mas fluxo continua               |

|
estore.js | 52 | catch (err) { console.error(...) } | Anexos perdidos silenciosamente |

---

## 5. Manutenibilidade

### Pontos Fortes

1. Arquivos pequenos e focados (< 200 linhas cada)
2. Sistema declarativo de campos — adicionar Tipo de Ordem requer apenas configuração
3. Migração de schema IndexedDB documentada (v2→v3)
4. Husky + lint-staged garantem qualidade consistente

### Pontos Fracos

1. **Duplicação de setup DOM nos testes (25+ arquivos)** — maior problema de manutenibilidade
2. Dados hardcoded nos testes — "ANDRE DE SOUSA CARVALHO" ~30 vezes
3. Funções monolíticas — 8 funções > 50 linhas
4. Acoplamento via state global — 13 módulos dependentes

---

## 6. Performance

| #   | Gravidade | Problema                                                | Localização      |
| --- | --------- | ------------------------------------------------------- | ---------------- |
| D1  | Média     | iniciaisFields.find() em cada keystroke — deve usar Map | pp.js:98         |
| D2  | Média     | querySelectorAll captura elementos desnecessários       | equipment.js:118 |
| D3  | Baixa     | Transport SMTP recriado a cada invocação                | send.js:88       |
| D4  | Baixa     | @import bloqueante para Google Fonts                    | style.css:1      |

---

## 7. Segurança

### Backend (

etlify/functions/send.js)

#### 🔴 E1 —

ejectUnauthorized: false desabilita verificação TLS (CRÍTICA)
**Localização:** send.js:85
**Categoria:** Segurança / TLS / MITM
**Explicação:** Desabilita a validação de certificado TLS para conexão SMTP. Qualquer interceptador de rede pode realizar MITM, lendo credenciais e emails.
**Evidência:** AGENTS.md:50 confirma "intentional (self-signed certs in production)".
**Como corrigir:**
`javascript
// Opção A (preferida): Adicionar CA certificate
tls: process.env.SMTP_CA_CERT
  ? { ca: Buffer.from(process.env.SMTP_CA_CERT, 'base64') }
  : { rejectUnauthorized: true }
// Opção B: Restringir a não-produção
`

#### 🔴 E2 — error.message vaza para o cliente (CRÍTICA)

**Localização:** send.js:115-119
**Categoria:** Segurança / Vazamento de informação
**Explicação:** catch (error) { body: JSON.stringify({ error: error.message }) } expõe hostnames internos, IPs, comandos SMTP, e estado de autenticação.
**Como corrigir:**
`javascript
catch (error) {
  console.error('[send] SMTP error:', { message: error.message, code: error.code, command: error.command });
  return { statusCode: 500, body: JSON.stringify({ error: 'Erro interno. Tente novamente.' }) };
}
`

#### 🔴 E3 — Endereços SMTP_TO vazam na resposta de erro (CRÍTICA)

**Localização:** send.js:52-55
**Categoria:** Segurança / Vazamento de informação
**Explicação:** Emails inválidos em SMTP_TO são retornados ao cliente.
**Como corrigir:** Responder com mensagem genérica; logar endereços apenas no servidor.

#### 🔴 E4 — Lista de destinatários retornada ao cliente no sucesso (CRÍTICA)

**Localização:** send.js:111-113, scripts/send.js:53
**Categoria:** Segurança / Vazamento de informação
**Explicação:** { success: true, to: toList } — destinatários são armazenados no IndexedDB do browser.
**Como corrigir:** Backend retornar { success: true } sem o. Frontend não depender de
esponseData.to.

#### 🟠 E5 — Sem rate limiting (Alta)

**Localização:** send.js (handler inteiro)
**Como corrigir:** Rate limiter in-memory por IP (simples para MVP).

#### 🟠 E6 — Sem validação de tipo em subject (Alta)

**Localização:** send.js:21
**Como corrigir:** if (!subject || typeof subject !== 'string' || subject.trim().length === 0)

#### 🟠 E7 — ttachments sem validação Array.isArray() (Alta)

**Localização:** send.js:58,62
**Como corrigir:** const attachments = Array.isArray(body.attachments) ? body.attachments : [];

#### 🟠 E8 — Sem limites de comprimento em subject/ ext (Alta)

**Localização:** send.js:21,25
**Como corrigir:** subject.length > 500, ext.length > 500000

#### 🟠 E9 — SMTP_HOST, SMTP_USER, SMTP_PASS não validados (Alta)

**Localização:** send.js:78,81,83
**Como corrigir:** Validar todas as 6 env vars antes de construir o transporte.

### Frontend

#### 🟡 E10 — innerHTML com useHtml: true é vetor XSS potencial (Média)

**Localização:** ui.js:65
**Como corrigir:** Usar extContent ou sanitizar com DOMPurify.

#### 🔵 E11 — Sanitização de filenames destrói Unicode (Baixa)

**Localização:** send.js:65
**Como corrigir:** Remover apenas caracteres perigosos (/\\:\*?"<>| e control chars).

---

## 8. Tratamento de Erros

#### 🟠 F1 — getAttachmentsByUuid com anti-padrão Promise + async (Alta)

**Localização:** db.js:170-183
**Categoria:** Robustez
**Explicação:**
ew Promise(async (resolve, reject) => {...}) — callback async faz erros resultarem em rejeição não tratada. Também não usa withTransaction.

#### 🟡 F2 —

eq.onerror = () => {} vazio (Média)
**Localização:** db.js:119

#### 🟡 F3 — sendMail sem ransporter.verify() (Média)

**Localização:** send.js:88

#### 🔵 F4 — sort sem tratamento de updatedAt inválido (Baixa)

**Localização:** sidebar.js:41
**Como corrigir:**
ew Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)

---

## 9. Consistência

### Inconsistências

| #   | Gravidade | Problema                         | Localização |
| --- | --------- | -------------------------------- | ----------- |
| G1  | Média     | ipoOrdem re-anexado em 3 lugares | pp.js:64,   |

eset.js:35,
estore.js:67 |
| G2 | Média | ite.config.js vs projeto real (não usa Vite) | ite.config.js |
| G3 | Baixa | Import com caminho absoluto inconsistente | sw-update.js:1 |

---

## 10. Reutilização

### Componentes Reutilizáveis Bem Implementados

✅ showModalElements (ui.js) — Modal genérico Promise-based
✅ INPUT_CREATORS lookup table (iniciais.js) — Factory pattern
✅ withTransaction (db.js) — Abstrai boilerplate IndexedDB
✅ EQUIPMENT_KEYS (equipment-keys.js) — Fonte única de verdade
✅ SECTION_VALIDATORS (alidation.js) — Strategy pattern

### Oportunidades Perdidas

❌ Setup DOM dos testes: 25+ arquivos duplicam a mesma estrutura
❌ indSaveOnChange duplicado em pp.js e
etornos.js
❌ Blocos de template LIGACAO_NOVA_MT duplicados (~70 linhas)
❌ setFieldError e clearFieldError poderiam ser uma função

---

## 11. Escalabilidade

### O Que Escala Bem

1. Sistema de campos condicionais — declarativo, suporta arrays e negação
2. Templates de email — declarativos com condições compostas
3. Separação collectors/renderers — padrão consistente

### Limitações

| #                        | Gravidade | Problema                                           | Localização |
| ------------------------ | --------- | -------------------------------------------------- | ----------- |
| H1                       | Alta      | Sem pooling de conexão SMTP                        | send.js:88  |
| H2                       | Alta      | Backend monolítico (função única)                  |
| etlify/functions/send.js |
| H3                       | Média     | Estado global como gargalo de refatoração          | state.js    |
| H4                       | Baixa     | HTML único de 245 linhas como ponto de falha de UI | index.html  |

---

## 12. Testabilidade

### Cobertura de Testes

| Módulo       | Cobertura    | Qualidade                          |
| ------------ | ------------ | ---------------------------------- |
| db.js        | ✅ Excelente | CRUD completo, cascading delete    |
| alidation.js | ✅ Excelente | 1075 linhas, todas as seções       |
| email.js     | ✅ Bom       | Templates, placeholders, condições |
| ields.js     | ✅ Bom       | Validação estrutural               |

|
etornos.js | ✅ Bom | Múltiplos tipos, conditional fields |
| ttachments.js | ✅ Bom | Upload, remoção, limites |
|
etlify/functions/send.js | ❌ 0% | Backend sem cobertura |
| sw.js | ❌ 0% | Service Worker sem testes |
| send.js (cliente) | ❌ Mock-only | Todos colaboradores mockados |
| compress.js | ❌ Não exercitado | loadImage mockado para rejeitar |
| initApp() | ❌ 0% | Entry point não testado |
| equipment-keys.js | ❌ 0% | Sem testes |

### Problemas

#### 🔴 I1 — Setup DOM duplicado em 25+ arquivos (Crítica)

**Localização:** Todos os arquivos em ests/
**Categoria:** Manutenibilidade de testes
**Explicação:** Cada arquivo de teste contém 50-100 linhas idênticas de document.body.innerHTML = .... Alterar um ID no HTML requer atualizar 25+ arquivos.
**Como corrigir:** Criar ests/helpers/dom-fixture.js com createTestDOM().

#### 🟠 I2 — Dados de teste hardcoded (Alta)

**Localização:** 30+ arquivos de teste
**Explicação:** "ANDRE DE SOUSA CARVALHO" ~30 vezes. "11111"/"22222" centenas de vezes.
**Como corrigir:** Criar factories (createSampleIniciais(), createSampleRecord()).

#### 🟡 I3 — Assertion placeholder (Média)

**Localização:** gaps-edge-cases.test.js
**Explicação:** expect(true).toBe(true); — no-op que sempre passa.

#### 🟡 I4 — Testes com timers reais (Média)

**Localização:** duplicate.test.js, persistence.test.js
**Explicação:** setTimeout(resolve, 200) pode ser insuficiente em CI lento.
**Como corrigir:** Usar i.useFakeTimers().

---

## 13. Interface e UX

### Acessibilidade — NOTA: 2/10

#### 🔴 J1 — Zero atributos ARIA, zero

ole, zero abindex (CRÍTICA)
**Localização:** index.html (arquivo inteiro)
**Categoria:** Acessibilidade
**Explicação:** 245 linhas de HTML sem nenhum atributo ARIA,
ole, ou abindex. Para uma aplicação de formulário, isso é falha crítica.
**Impacto:** Leitores de tela não navegam. Modais não são diálogos. Toasts são invisíveis. Campos não têm associação semântica.

#### 🔴 J2 — Área de upload inacessível por teclado (CRÍTICA)

**Localização:** index.html:118-128
**Categoria:** Acessibilidade / Teclado
**Explicação:** <div> com cursor-pointer, sem
ole="button", sem abindex, sem handler de teclado.

#### 🔴 J3 — #error-msg sem

ole="alert" ou ria-live (CRÍTICA)
**Localização:** index.html:30-34

#### 🟠 J4 — Sem elemento <form> (Alta)

**Localização:** index.html:37-149

#### 🟠 J5 — Seções sem headings semânticos (Alta)

**Localização:** index.html:38,44,57,116,138
**Explicação:** Usam <div class="sec-head"> em vez de <h2>.

#### 🟠 J6 — Forçar uppercase em todos inputs (Alta)

**Localização:** style.css:549-573
**Explicação:** Todos os inputs têm ext-transform: uppercase. Conteúdo como emails, URLs e texto livre fica ilegível.

### CSS — 32 !important declarados

#### 🔴 J7 — 32 declarações !important (CRÍTICA)

**Localização:** style.css (32 ocorrências verificadas via grep)
**Categoria:** CSS / Manutenibilidade
**Explicação:** Média de 1 !important a cada ~24 linhas. Trava a cascata CSS.
**Causas:** Estados de campo (9 !important), seção "Outdoor/High Contrast" sempre ativa (7 !important).

#### 🟠 J8 — Regras "Outdoor / High Contrast" sempre ativas (Alta)

**Localização:** style.css:599-641
**Explicação:** 7 !important aplicados globalmente SEM media query e SEM toggle.
**Como corrigir:** Gate behind prefers-contrast: high media query.

#### 🟡 J9 — Seletor CSS frágil [style*='display: none'] (Média)

**Localização:** style.css:99
**Explicação:** Match contra texto exato do atributo style. display:none (sem espaço) quebraria.
**Como corrigir:** Usar classe CSS .condicional-hidden.

---

## 14. Documentação

### Pontos Fortes

✅ **AGENTS.md**: Excelente — stack, convenções, workflow, arquitetura não-óbvia
✅ **Graphify**: 754 nodes, 1299 edges, 51 comunidades
✅ **Comentários de migração**: v2→v3 documentados em
estore.js e db.js

### Problemas

| #                                                              | Gravidade          | Problema                                    | Localização        |
| -------------------------------------------------------------- | ------------------ | ------------------------------------------- | ------------------ |
| K1                                                             | Média              | Backend sem JSDoc                           |
| etlify/functions/send.js                                       |
| K2                                                             | Média              | Comportamentos de fallback não documentados | ields.js, email.js |
| K3                                                             | Baixa              |
| ormalizeText no módulo errado (email.js, deveria ser utils.js) | scripts/email.js:8 |

---

## 15. Dependências

#### 🔴 L1 — 7 pacotes com versões divergentes entre package.json e package-lock.json (CRÍTICA)

| Pacote                 | package.json | package-lock.json | Gap       |
| ---------------------- | ------------ | ----------------- | --------- |
| @eslint/js             | ^9.21.0      | ^10.0.1           | **Major** |
| eslint                 | ^9.21.0      | ^10.5.0           | **Major** |
| globals                | ^16.0.0      | ^17.6.0           | **Major** |
| lint-staged            | ^15.4.3      | ^17.0.8           | **Major** |
| eslint-config-prettier | ^10.0.1      | ^10.1.8           | Minor     |
| eslint-plugin-prettier | ^5.2.3       | ^5.5.6            | Minor     |
| prettier               | ^3.5.1       | ^3.8.4            | Minor     |

**Explicação:** package.json está desatualizado. 4 pacotes com major version à frente no lockfile.

#### 🟠 L2 — sharp não utilizado (Alta)

**Localização:** package.json:35
**Explicação:** Dependência nativa pesada (libvips) sem uso no projeto.

#### 🟠 L3 — ite.config.js referencia pacotes não instalados (Alta)

**Localização:** ite.config.js:2-3
**Explicação:** @vitejs/plugin-vue e ite-plugin-pwa não existem em
ode_modules.

#### 🟡 L4 — eslint-plugin-prettier deprecated (Média)

**Explicação:** Abordagem recomendada é eslint-config-prettier apenas.

#### 🔵 L5 — itest@^4.1.8 bleeding edge (Baixa)

**Explicação:** Versão 4.x lançada muito recentemente. 3.x seria mais estável.

---

## 16. Organização Geral do Projeto

### ✅ Funciona Bem

- Estrutura de diretórios clara e previsível
- Separação física frontend/backend/testes/dados
- Configurações centralizadas
- Sem build tools complexas — simplicidade intencional

### ❌ Problemas

| #   | Gravidade | Problema                                                        |
| --- | --------- | --------------------------------------------------------------- |
| M1  | Média     | rchive/ contém código obsoleto no repositório                   |
| M2  | Média     | ite.config.js alias @: '/src' aponta para diretório inexistente |

---

## 17. Pontuação

| Categoria                                                                       | Nota     | Justificativa                                                                               |
| ------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| **Arquitetura**                                                                 | 6/10     | Boa separação e módulos pequenos. Perde por estado global mutável e violações do cache DOM. |
| **Organização**                                                                 | 7/10     | Estrutura clara. Perde por archive/ e vite.config.js quebrado.                              |
| **Modularidade**                                                                | 7/10     | 27 módulos pequenos. Perde por funções longas e acoplamento via state.                      |
| **Performance**                                                                 | 7/10     | Aplicação leve, vanilla JS. Cache-first do SW causa staleness.                              |
| **Segurança**                                                                   | **3/10** |
| ejectUnauthorized: false, vazamentos, sem rate limiting, sem validação de tipo. |
| **Escalabilidade**                                                              | 5/10     | Campos escalam bem. Backend monolítico e sem pooling.                                       |
| **Legibilidade**                                                                | 7/10     | Código claro. Perde por unicode escapes e funções longas.                                   |
| **Manutenibilidade**                                                            | 5/10     | Adicionar tipos é fácil. Testes são pesadelo (25+ duplicações). 32 !important.              |
| **Documentação**                                                                | 7/10     | AGENTS.md excelente. Graphify abrangente. Falta docs inline no backend.                     |
| **Testabilidade**                                                               | 6/10     | Boa cobertura core. Backend/SW sem testes. Setup de testes frágil.                          |

### Nota Geral do Projeto: **5.5/10**

Projeto demonstra preocupação com boas práticas (collectors, cache DOM, sistema declarativo), mas acumulou débito técnico significativo em segurança, CSS e infraestrutura de testes. É um MVP funcional que precisa de investimento em qualidade antes de produção.

---

## 18. Plano de Melhorias

### 🔴 Críticas (Corrigir Imediatamente)

| #                                       | Problema                                                       | Localização         | Categoria        |
| --------------------------------------- | -------------------------------------------------------------- | ------------------- | ---------------- |
| 1                                       |
| ejectUnauthorized: false desabilita TLS |
| etlify/functions/send.js:85             | Segurança                                                      |
| 2                                       | error.message vaza para o cliente                              |
| etlify/functions/send.js:115-119        | Segurança                                                      |
| 3                                       | SMTP_TO vaza na resposta de erro                               |
| etlify/functions/send.js:52-55          | Segurança                                                      |
| 4                                       | Destinatários retornados ao cliente e armazenados no IndexedDB |
| etlify/functions/send.js:111-113        | Segurança                                                      |
| 5                                       | Zero atributos ARIA no HTML                                    | index.html (global) | Acessibilidade   |
| 6                                       | 32 !important + regras Outdoor sempre ativas                   | style.css           | CSS              |
| 7                                       | 25+ arquivos de teste duplicando estrutura DOM                 | ests/\*.test.js     | Manutenibilidade |
| 8                                       | ailwind.css ausente do STATIC_ASSETS do SW                     | sw.js:2-32          | PWA              |
| 9                                       | cache.addAll sem .catch() — 1 falha bloqueia SW                | sw.js:36-40         | PWA              |
| 10                                      | 7 divergências package.json vs package-lock.json               | package.json        | Dependências     |

### 🟠 Alta Prioridade

| #                                 | Problema                                            | Localização                              |
| --------------------------------- | --------------------------------------------------- | ---------------------------------------- |
| 11                                | Sem rate limiting                                   |
| etlify/functions/send.js          |
| 12                                | ttachments sem validação Array.isArray()            |
| etlify/functions/send.js:58,62    |
| 13                                | tt.filename e tt.content podem ser undefined        |
| etlify/functions/send.js:65,67    |
| 14                                | SMTP_HOST/USER/PASS não validados                   |
| etlify/functions/send.js:78,81,83 |
| 15                                | 8+ erros silenciosamente engolidos                  | duplicate.js, db.js, send.js, sidebar.js |
| 16                                | Templates LIGACAO_NOVA_MT com ~70 linhas duplicadas | scripts/data/retorno-templates.js        |
| 17                                | getAttachmentsByUuid com anti-padrão Promise        | scripts/db.js:170-183                    |
| 18                                | sendMail sem timeout nem retry                      |
| etlify/functions/send.js:98       |
| 19                                | sendMail sem ransporter.verify()                    |
| etlify/functions/send.js:88       |
| 20                                | HTML sem elemento <form>                            | index.html:37-149                        |
| 21                                | Área de upload inacessível por teclado              | index.html:118-128                       |
| 22                                | sharp — dependência não utilizada                   | package.json:35                          |
| 23                                | ite.config.js — código morto                        | ite.config.js                            |
| 24                                | eslint-plugin-prettier deprecated                   | eslint.config.js                         |
| 25                                | Violações do cache DOM em 7 arquivos                | utils.js, equipment.js, collectors.js    |

### 🟡 Média Prioridade

| #               | Problema                                     | Localização        |
| --------------- | -------------------------------------------- | ------------------ |
| 26              | 8 funções > 50 linhas                        | pp.js, sidebar.js, |
| estore.js, etc. |
| 27              | Dados hardcoded nos testes (~30x "ANDRE...") | ests/\*.test.js    |
| 28              | Factory de DOM de teste ausente              | ests/\*.test.js    |
| 29              | Listener ipoOrdem duplicado (3 lugares)      | pp.js,             |

eset.js,
estore.js |
| 30 | input + change disparando handlers em duplicidade | pp.js:135-136 |
| 31 | Estado global mutável sem controle | scripts/state.js |
| 32 | DOM como segunda fonte de verdade | Global |
| 33 | FIELD_DESCRICAO inline em vez de reutilizado | scripts/data/fields-data.js |
| 34 | parseInt duplicado |
etlify/functions/send.js:79-80 |
| 35 | ext \|\| '' é unreachable |
etlify/functions/send.js:94 |
| 36 | Alias @: '/src' inexistente no vite.config.js | ite.config.js:27 |
| 37 | Seletor CSS [style*='display: none'] frágil | style.css:99 |
| 38 | Uppercase forçado em todos inputs | style.css:549-573 |
| 39 |
ormalizeText no módulo errado | scripts/email.js |
| 40 | \_deletesDone/\_pendingPuts declaradas não usadas | scripts/db.js:138-139 |
| 41 | Backend sem JSDoc |
etlify/functions/send.js |
| 42 | Cache-first do SW causa staleness em JS modules | sw.js:86-113 |

### 🟢 Baixa Prioridade

| #                           | Problema                                               | Localização                    |
| --------------------------- | ------------------------------------------------------ | ------------------------------ |
| 43                          | sort sem tratamento de updatedAt inválido              | scripts/sidebar.js:41          |
| 44                          | Import com caminho absoluto inconsistente              | scripts/sw-update.js:1         |
| 45                          | Unicode escapes em vez de caracteres literais          | sidebar.js:91, duplicate.js:15 |
| 46                          | \_createdAt com underscore enganoso                    | scripts/state.js:19            |
| 47                          | @import bloqueante para Google Fonts                   | style.css:1                    |
| 48                          | Apenas 2 tamanhos de ícone PWA, sem maskable           | manifest.json                  |
| 49                          | ackground_color não corresponde à página real          | manifest.json:7                |
| 50                          | Falta og: meta tags                                    | index.html                     |
| 51                          | Sanitização de filename destrói Unicode                |
| etlify/functions/send.js:65 |
| 52                          | Assertion placeholder expect(true).toBe(true)          | ests/gaps-edge-cases.test.js   |
| 53                          | Listeners acumulam em ddBlurValidation/showUpdateModal | alidation.js, sw-update.js     |
| 54                          | Container fixo max-w-[640px] em desktop                | index.html:22                  |
| 55                          | itest@^4 bleeding edge                                 | package.json:37                |

---

## 19. Roadmap

### Fase 1 — Segurança e Estabilidade (Semanas 1-2)

- Corrigir 10 vulnerabilidades críticas do backend
- Corrigir Service Worker (tailwind.css, error handling do addAll)
- Sincronizar package.json com package-lock.json
- Remover sharp e ite.config.js

### Fase 2 — Acessibilidade e CSS (Semanas 3-4)

- Adicionar ARIA essentials (botões, alertas, modais, labels)
- Envolver formulário em <form>, usar <h2> para headings
- Isolar regras Outdoor com prefers-contrast media query
- Reduzir !important (alvo: <10)
- Substituir seletor [style*='display: none'] por classe

### Fase 3 — Qualidade de Código (Semanas 5-6)

- Extrair setup DOM de testes para factory compartilhada
- Criar factories de dados de teste
- Decompor 8 funções longas
- Consolidar listener ipoOrdem via event delegation
- Implementar Observer para estado
- Remover código morto

### Fase 4 — Cobertura de Testes (Semanas 7-8)

- Testes para
  etlify/functions/send.js
- Reescrever send.test.js (testar comportamento, não mocks)
- Testes para sw.js, initApp(), ddEquip()
- Substituir timers reais por i.useFakeTimers()

### Fase 5 — Escalabilidade e Funcionalidades (Semanas 9+)

- Pool/fila de envio SMTP
- Migração para estado unidirecional
- Ícones maskable no PWA manifest
- UX: scroll para erro, indicador de progresso no envio
- CI/CD:
  pm audit, testes de acessibilidade

---

## 20. Conclusão

### Maiores Problemas

1. **Segurança do backend é frágil**:
   ejectUnauthorized: false + vazamento de informações + sem rate limiting = vulnerável a MITM, enumeração e DoS. **Problema mais urgente.**

2. **Débito técnico no CSS**: 32 !important e regras permanentemente ativas criam base frágil para evolução visual.

3. **Infraestrutura de testes insustentável**: 25+ arquivos duplicando estrutura DOM completa. Uma mudança no HTML pode quebrar dezenas de testes.

4. **Acessibilidade inexistente**: Zero ARIA, zero
   ole, zero abindex. Aplicação inutilizável por pessoas com deficiência.

### Pontos Fortes

1. **Arquitetura bem pensada para MVP**: Padrão collectors, cache DOM com Proxy, sistema declarativo de campos e templates demonstram maturidade arquitetural.
2. **Código limpo e navegável**: 27 módulos pequenos com responsabilidades claras. AGENTS.md é documentação excelente.
3. **Sistema extensível**: Adicionar Tipo de Ordem requer apenas configuração declarativa, sem tocar em lógica.
4. **Persistência robusta**: IndexedDB com migração transparente, backup localStorage, debounced save.

### Nível de Maturidade

**MVP funcional** com decisões arquiteturais sólidas, mas com débito técnico significativo impedindo classificação como produção-ready.

### O Que Impediria Uso em Produção

1.  ejectUnauthorized: false — qualquer auditoria de segurança reprovaria
2.  Vazamento de informações sensíveis (emails, mensagens de erro)
3.  Falta de rate limiting — vulnerável a abuso financeiro
4.  Acessibilidade zero — potencial violação legal (LBI, ADA, WCAG)
5.  Service Worker com falha catastrófica (um asset falha → SW não instala)
6.  CSS com 32 !important — manutenção visual frágil

**Resumo:** O projeto tem uma **base arquitetural sólida** e demonstra **conhecimento de boas práticas**, mas precisa de **investimento focado em segurança e qualidade** antes de produção. As correções críticas são pontuais e de baixo esforço — o maior desafio será a reestruturação dos testes e do CSS.

---

_Relatório gerado em 12/07/2026. Análise baseada exclusivamente no código-fonte do repositório._

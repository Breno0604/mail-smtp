# Análise Técnica Rigorosa — Projeto `mail-smtp`

> **Repositório analisado:** https://github.com/Breno0604/mail-smtp
> **Commit analisado:** `8fd9f3d` (HEAD no momento da análise)
> **Metodologia:** leitura integral do código-fonte (scripts, função Netlify, configs), execução real de `npm install`, `npm run lint`, `npx vitest run`, `npm audit`, `npm outdated` e detecção de dependências circulares (`madge`), além de inspeção do histórico Git.
> **Stack:** SPA vanilla JS (ES6 modules, sem bundler), Tailwind CSS estático, IndexedDB + localStorage, backend serverless único (Netlify Function + Nodemailer), testes Vitest/jsdom + Playwright.

Todas as conclusões abaixo são baseadas em evidência direta do código, saída de comandos executados ou histórico Git deste repositório. Quando uma afirmação não pôde ser confirmada com evidência suficiente, isso é declarado explicitamente.

---

## Índice

1. [Arquitetura](#1-arquitetura)
2. [Qualidade do código](#2-qualidade-do-código)
3. [Boas práticas (SOLID/Clean Code/KISS/DRY/YAGNI)](#3-boas-práticas)
4. [Manutenibilidade](#4-manutenibilidade)
5. [Performance](#5-performance)
6. [Segurança](#6-segurança)
7. [Tratamento de erros](#7-tratamento-de-erros)
8. [Consistência](#8-consistência)
9. [Reutilização](#9-reutilização)
10. [Escalabilidade](#10-escalabilidade)
11. [Testabilidade](#11-testabilidade)
12. [Interface (UI/UX)](#12-interface-uiux)
13. [Documentação](#13-documentação)
14. [Dependências](#14-dependências)
15. [Organização geral do projeto](#15-organização-geral-do-projeto)
16. [Pontuação](#16-pontuação)
17. [Plano de melhorias](#17-plano-de-melhorias)
18. [Roadmap](#18-roadmap)
19. [Conclusão](#19-conclusão)

---

## Verificações automatizadas executadas

| Comando                            | Resultado                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| `npm install`                      | ✅ Sucesso, 262 pacotes                                                           |
| `npm run lint` (ESLint + Prettier) | ✅ 0 erros, 0 avisos                                                              |
| `npx vitest run`                   | ✅ 28 arquivos de teste, **527 testes passando**, 0 falhas                        |
| `npm audit`                        | ⚠️ **2 vulnerabilidades de severidade alta** (`nodemailer`, `undici`)             |
| `npm outdated`                     | 8 pacotes desatualizados (nenhum major crítico exceto `nodemailer`/`tailwindcss`) |
| `madge --circular`                 | ⚠️ **1 dependência circular** encontrada                                          |
| `npx vitest run --coverage`        | ❌ Falha — dependência `@vitest/coverage-v8` ausente                              |

Esses resultados fundamentam várias das constatações a seguir.

---

## 1. Arquitetura

**Visão geral do fluxo:** `index.html` carrega dois módulos ES6 (`app.js`, `sw-update.js`). `app.js` é o orquestrador central: importa praticamente todos os outros 20+ módulos, faz `cacheDOM()`, registra listeners delegados e inicializa o formulário. Não há roteamento — as 5 "seções" do formulário são todas renderizadas na mesma página (`sec-inicio`, `sec-retorno`, `sec-equipamentos`, `sec-anexos`, `sec-revisao`), confirmado pelo próprio `AGENTS.md` ("No JS navigation between sections").

A separação de responsabilidades é, em geral, **boa para uma SPA vanilla JS**: existe um módulo por responsabilidade (`dom.js` para cache de elementos, `state.js` para estado global, `db.js` para IndexedDB, `persistence.js` para orquestração de salvamento, `validation.js` para regras de validação, `email.js` para composição do corpo do e-mail, `send.js` para o envio em si). Isso é uma estrutura em camadas relativamente disciplinada para um projeto sem framework.

### Achado A1 — Dependência circular entre módulos

- **Localização exata:** `scripts/app.js` → `scripts/sidebar.js` → `scripts/restore.js` → importa `updateAllFilledClasses` de volta em `scripts/app.js` (linha `import { updateAllFilledClasses } from './app.js';` em `restore.js`).
- **Gravidade:** Média
- **Categoria:** Arquitetura / Acoplamento
- **Explicação simples:** Três arquivos formam um ciclo: A depende de B, que depende de C, que depende de A de volta. Isso é confirmado por análise estática (`madge --circular`), que apontou exatamente 1 ciclo neste grafo.
- **Motivo técnico:** Módulos ES6 toleram ciclos, mas eles quebram a árvore de dependências unidirecional esperada em Clean Architecture, tornam a ordem de inicialização implícita e frágil, e dificultam tree-shaking/bundling futuro caso o projeto adote um bundler.
- **Impacto atual:** Nenhum bug visível hoje (os testes passam), mas o ciclo já é um sintoma de que `app.js` está fazendo "coisa demais" (orquestração + utilitário de UI) e sendo consumido por módulos que deveriam ser "folhas" na árvore de dependência.
- **Impacto futuro:** Ao adicionar um bundler (Vite, esbuild) ou migrar para módulos assíncronos, ciclos como este podem causar `undefined` em tempo de import (efeito de "temporal dead zone" em exports circulares) — risco real caso a equipe retome a tentativa de migração para Vite mencionada no próprio histórico de commits (`chore: remover resquicios da tentativa de migracao Vue+Vite+TS`).
- **Como corrigir:** Extrair `updateAllFilledClasses` (e `updateFilledClass`) de `app.js` para um módulo de utilitário de UI (ex.: `scripts/filled-state.js`), sem dependências de `app.js`, e importar esse módulo tanto em `app.js` quanto em `restore.js`.
- **Exemplo de implementação corrigida:**
  ```js
  // scripts/filled-state.js
  export function updateFilledClass(el) {
    if (el.value && el.value.trim() !== '') el.classList.add('is-filled');
    else el.classList.remove('is-filled');
  }
  export function updateAllFilledClasses() {
    document.querySelectorAll('input, select, textarea').forEach(updateFilledClass);
  }
  ```
  ```js
  // scripts/restore.js
  import { updateAllFilledClasses } from './filled-state.js'; // não depende mais de app.js
  ```
- **Benefícios da correção:** Grafo de dependências acíclico, mais fácil de testar isoladamente, compatível com bundlers e com tree-shaking, elimina risco de `undefined` em imports circulares.

### Achado A2 — Estado global mutável compartilhado por ~15 módulos

- **Localização exata:** `scripts/state.js` (objeto `export const state = {...}`) importado diretamente por `app.js`, `persistence.js`, `validation.js`, `equipment.js`, `retornos.js`, `collectors.js`, `send.js`, `duplicate.js`, `restore.js`, `reset.js`, `sidebar.js`, `attachments.js`.
- **Gravidade:** Baixa (esperado para o tamanho do projeto, mas é um limitador real de escala)
- **Categoria:** Arquitetura / Escalabilidade / Testabilidade
- **Explicação simples:** Existe um único objeto de estado global que qualquer módulo pode ler e escrever diretamente, sem um contrato claro (não há getters/setters/eventos de mudança centralizados, exceto para UUID).
- **Motivo técnico:** É o padrão "estado global mutável"; funciona bem em escala pequena, mas qualquer módulo pode mutar `state.iniciais`, `state.retorno`, etc. diretamente sem passar por validação centralizada, o que dificulta rastrear _quem_ alterou o quê e exige que os testes façam reset manual do estado (`tests/setup.js`).
- **Impacto atual:** Nenhum bug relatado; a suíte de 527 testes mitiga bem o risco atual.
- **Impacto futuro:** Se o formulário crescer (mais seções, mais campos condicionais, colaboração entre abas), a ausência de um mecanismo de assinatura de mudanças (`observer`/`pub-sub`) tornará difícil sincronizar UI e estado sem duplicar lógica de re-render em cada módulo.
- **Como corrigir:** Não é urgente corrigir agora (YAGNI se aplica), mas se o projeto crescer, considerar um padrão simples de _store_ com `subscribe(callback)` para notificar mudanças, ao invés de cada módulo chamar `updateLivePreview()`/`debouncedSave()` manualmente após cada mutação.
- **Benefícios da correção:** Reduziria a necessidade de "lembrar" de chamar `debouncedSave()`/`updateLivePreview()` em todo handler novo — hoje isso depende 100% de disciplina manual do desenvolvedor.

**Conclusão da seção:** a arquitetura é adequada e disciplinada para o escopo atual (um formulário PWA offline-first), mas tem um ponto real de acoplamento circular e um teto de escalabilidade natural do padrão "estado global + vanilla JS", que a equipe já está gerenciando razoavelmente bem através de convenções documentadas no `AGENTS.md`.

---

## 2. Qualidade do código

| Métrica                                          | Observação                                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Tamanho médio de arquivo em `scripts/`           | ~110 linhas (mín. 8 em `styles.js`, máx. 324 em `validation.js`)                                                   |
| Total de linhas de produção (scripts + function) | 2.866 linhas                                                                                                       |
| Maior arquivo                                    | `scripts/validation.js` (324 linhas)                                                                               |
| Funções mais longas                              | `renderRetorno()` (~70 linhas, `retornos.js`), `netlify/functions/send.js:handler` (~100 linhas em um único `try`) |

Nenhum arquivo passa de 350 linhas — isso é positivo e indica boa fragmentação por responsabilidade. Nomenclatura é consistente e majoritariamente em português (domínio de negócio: `iniciais`, `retorno`, `equipamentos`), o que é aceitável dado que a aplicação é 100% em português e para uso interno.

### Achado Q1 — Função `handler` do Netlify monolítica com múltiplas responsabilidades

- **Localização exata:** `netlify/functions/send.js`, função `exports.handler` (linhas 3–103, ~100 linhas em um único bloco `try/catch`).
- **Gravidade:** Baixa
- **Categoria:** Qualidade do código / Complexidade de função
- **Explicação simples:** Uma única função faz: parsing do body, validação de payload, validação de e-mails, validação de anexos, sanitização de nomes de arquivo, configuração do transporte SMTP, envio e log de auditoria — tudo em sequência linear sem extração em funções nomeadas.
- **Motivo técnico:** Complexidade ciclomática alta pela quantidade de `if` sequenciais de validação (pelo menos 8 pontos de decisão early-return), o que é aceitável em uma função serverless simples, mas dificulta testes unitários granulares (o próprio projeto não testa este arquivo — ver Achado K1 na seção de testabilidade).
- **Impacto atual:** Nenhum bug funcional aparente; a lógica está correta e coberta por validações defensivas.
- **Impacto futuro:** Qualquer novo requisito (ex.: novo tipo de anexo, novo campo obrigatório) tende a ser adicionado como mais um `if` no mesmo bloco, aumentando ainda mais a complexidade.
- **Como corrigir:** Extrair funções puras: `validatePayload(body)`, `validateAttachments(attachments)`, `buildTransportConfig(env)`, mantendo o `handler` como um orquestrador curto.
- **Exemplo de implementação corrigida:**
  ```js
  function validateAttachments(attachments) {
    if (!attachments) return { ok: true };
    if (attachments.length > 12) return { ok: false, error: 'Máximo de 12 anexos permitido.' };
    for (const att of attachments) {
      att.filename = (att.filename || 'arquivo').replace(/[^a-zA-Z0-9._-]/g, '_');
      const size = Buffer.from(att.content, 'base64').length;
      if (size > 8 * 1024 * 1024) {
        return { ok: false, error: `Anexo '${att.filename}' excede 8 MB.` };
      }
    }
    return { ok: true };
  }
  ```
- **Benefícios da correção:** Cada função de validação pode ser testada isoladamente com `vitest`, sem precisar mockar toda a função `handler` (hoje impossível de testar por completo, dado que os testes explicitamente pulam este arquivo).

### Achado Q2 — Filename de anexo pode causar exceção não tratada

- **Localização exata:** `netlify/functions/send.js`, linha `att.filename = att.filename.replace(...)`.
- **Gravidade:** Média
- **Categoria:** Qualidade do código / Robustez
- **Explicação simples:** Se um cliente externo enviar um anexo sem a propriedade `filename` (por exemplo, chamando a API diretamente, fora do fluxo normal do app), o código tentará chamar `.replace` em `undefined`, o que lança uma exceção.
- **Motivo técnico:** Ausência de verificação `att.filename &&` antes do `.replace()`. Como o `handler` está em um `try/catch` amplo, a exceção não derruba a função, mas resulta em uma resposta genérica 500 sem indicar a causa real ao chamador, dificultando debug.
- **Impacto atual:** Não afeta o fluxo normal da UI (que sempre define `filename` em `compress.js`), mas é uma superfície de erro para qualquer chamada direta à API (ver Achado S1 sobre falta de validação de origem).
- **Impacto futuro:** Se o endpoint for exposto a mais integrações no futuro, chamadas malformadas causarão 500 silenciosos difíceis de diagnosticar em produção.
- **Como corrigir:** Validar `att.filename` e `att.content` antes de processar cada anexo, retornando 400 com mensagem clara.
- **Exemplo de implementação corrigida:**
  ```js
  if (!att.filename || typeof att.filename !== 'string') {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Anexo sem nome de arquivo válido.' }),
    };
  }
  ```
- **Benefícios da correção:** Erros de payload malformado retornam 400 com mensagem clara em vez de 500 genérico, facilitando diagnóstico e evitando dependência de exceções para controle de fluxo.

**Conclusão da seção:** o código de produção é limpo, arquivos curtos, nomes claros. Os poucos problemas são de robustez em bordas específicas, não de qualidade geral — a base é sólida.

---

## 3. Boas práticas

Avaliação objetiva dos princípios solicitados, com evidência do próprio código:

| Princípio                        | Avaliação                 | Evidência                                                                                                                                                                                                                                                                                                              |
| -------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DRY**                          | Bom                       | `EQUIPMENT_KEYS` como fonte única de verdade para os 9 tipos de equipamento (`equipment-keys.js`), reaproveitada em `state.js`, `equipment.js`, `email.js`; `INPUT_CLASS`/`SELECT_CLASS` centralizados em `styles.js`; `SECTION_VALIDATORS` e `INPUT_CREATORS` como tabelas de despacho em vez de `if/else` repetidos. |
| **KISS**                         | Bom                       | Templates de e-mail declarativos em `retorno-templates.js` (dados, não código), sem lógica condicional espalhada pela UI.                                                                                                                                                                                              |
| **YAGNI**                        | Bom, com uma exceção      | O histórico Git mostra reversão explícita de uma feature ("Revert 'indicadores online/offline...'") e remoção de uma tentativa de migração para Vue+Vite+TS não utilizada — sinal saudável de que a equipe evita over-engineering e reverte experimentos que não agregam valor.                                        |
| **Single Responsibility**        | Bom, com exceção pontual  | A maioria dos módulos tem um propósito único e nomeado claramente; exceção é `netlify/functions/send.js` (Achado Q1).                                                                                                                                                                                                  |
| **Separation of Concerns**       | Bom                       | DOM (`dom.js`), estado (`state.js`), persistência (`db.js`/`persistence.js`) e UI (`ui.js`) são módulos distintos.                                                                                                                                                                                                     |
| **SOLID – Open/Closed**          | Bom                       | Adicionar um novo "Tipo de Ordem" não exige alterar `retornos.js`/`email.js` — basta adicionar entrada em `fields-data.js`/`retorno-templates.js` (dados).                                                                                                                                                             |
| **SOLID – Dependency Inversion** | Não avaliável formalmente | O projeto não usa injeção de dependência (aceitável em vanilla JS de pequena escala); módulos importam implementações concretas diretamente (`db.js`, `dom.js`), o que é uma limitação natural do paradigma escolhido, não um erro isolado.                                                                            |

### Achado B1 — Violação da própria convenção documentada de acesso ao DOM

- **Localização exata:** `scripts/validation.js` (`validateSection1`, `validateSection2`, `validateEquipmentGroup`), `scripts/collectors.js` (`collectIniciais`, `collectRetorno`) — todos usam `document.getElementById(...)` diretamente, dezenas de ocorrências.
- **Gravidade:** Baixa
- **Categoria:** Boas práticas / Consistência
- **Explicação simples:** O próprio `AGENTS.md` do projeto declara como convenção: _"All DOM lookups happen once in cacheDOM(). Import DOM from dom.js; never call getElementById elsewhere."_ Porém `validation.js` e `collectors.js` fazem exatamente isso — chamam `document.getElementById` fora de `dom.js`.
- **Motivo técnico:** Esses módulos lidam com campos **dinâmicos** (gerados em runtime a partir de `iniciaisFields`/`retornoFieldsByTipo`), que não têm — e não poderiam ter — uma entrada fixa no cache de `DOM` (que é pensado para elementos estáticos do HTML). Ou seja, a regra documentada não cobre esse caso de uso, mas o texto da regra não deixa isso explícito.
- **Impacto atual:** Nenhum bug — a exceção é funcionalmente necessária, mas a documentação induz um novo desenvolvedor (ou um agente de IA seguindo o `AGENTS.md` ao pé da letra) a acreditar que está violando uma regra ao escrever esse código, ou a tentar "corrigir" isso adicionando complexidade desnecessária ao cache do DOM.
- **Impacto futuro:** Ambiguidade documental gera retrabalho e discussões desnecessárias em revisões de código.
- **Como corrigir:** Atualizar o `AGENTS.md` para explicitar a exceção: _"Regra vale para elementos estáticos do HTML. Campos dinâmicos gerados a partir de `fields.js` são buscados via `getElementById` diretamente em `collectors.js`/`validation.js`, pois não têm entrada fixa em `dom.js`."_
- **Benefícios da correção:** Elimina ambiguidade na documentação, evitando "correções" desnecessárias por futuros contribuidores (humanos ou agentes).

**Conclusão da seção:** o projeto demonstra maturidade real nos princípios de boas práticas — DRY e Open/Closed são particularmente bem executados via padrões de tabela de despacho e dados declarativos. O único ponto é uma inconsistência documental menor, não uma falha de código.

---

## 4. Manutenibilidade

### Achado M1 — Acoplamento frágil por _string matching_ entre listas de opções

- **Localização exata:** `scripts/fields.js` (`tipoOrdemOptions` em `data/fields-data.js`) vs. chaves de `retornoFieldsByTipo` em `data/fields-data.js` vs. chaves de `retornoTemplates` em `data/retorno-templates.js`.
- **Gravidade:** Alta
- **Categoria:** Manutenibilidade / Robustez
- **Explicação simples:** O sistema depende de que o texto exato de cada "Tipo de Ordem" (ex.: `'LIGACAO NOVA MEDIA TENSAO'`) seja digitado de forma **idêntica** em três lugares diferentes do código para funcionar. Se houver uma letra diferente, um espaço a mais, ou um acento inconsistente em um dos três lugares, o tipo de ordem correspondente simplesmente não terá campos de retorno nem template de e-mail — **silenciosamente**, sem erro.
- **Motivo técnico:** Não há um identificador estável (slug/enum) desacoplado do texto de exibição; o próprio label visível ao usuário é usado como chave de lookup (`retornoFieldsByTipo[tipo]`, `retornoTemplates[tipo]`). O próprio `AGENTS.md` reconhece o risco: _"Tipo de Ordem names in scripts/fields.js must match exactly between iniciaisFields dropdown options and retornoFieldsByTipo keys."_
- **Impacto atual:** Não é possível confirmar, com as evidências disponíveis, que isso já causou um bug em produção; porém, o histórico Git mostra múltiplos commits de correção pontual em tipos de ordem específicos (ex.: `fix: corrigir 9 itens criticos da analise do projeto`, `fix: remover nomes e placas descontinuados + corrigir migration-validator`), o que é consistente com — mas não prova definitivamente — esse tipo de fragilidade.
- **Impacto futuro:** Conforme a lista de 36 tipos de ordem crescer, o risco de divergência textual entre os três arquivos aumenta proporcionalmente, e o erro resultante (campo de retorno ausente, template não aplicado) é **silencioso** — não gera exceção, apenas um formulário incompleto para o técnico de campo.
- **Como corrigir:** Introduzir uma chave estável (slug), independente do texto de exibição, e usar essa chave como índice em `retornoFieldsByTipo`/`retornoTemplates`, mantendo o label apenas para exibição.
- **Exemplo de implementação corrigida:**
  ```js
  // fields-data.js
  export const tipoOrdemOptions = [
    { slug: 'ligacao-nova-mt', label: 'LIGACAO NOVA MEDIA TENSAO' },
    // ...
  ];
  // um teste automatizado simples garante integridade:
  test('todo slug de tipoOrdemOptions tem entrada em retornoFieldsByTipo', () => {
    tipoOrdemOptions.forEach(t => {
      expect(retornoFieldsByTipo[t.slug]).toBeDefined();
    });
  });
  ```
- **Benefícios da correção:** Elimina a classe inteira de bugs "silenciosos" por divergência de texto; um teste unitário de integridade (poucas linhas) passaria a detectar automaticamente qualquer novo tipo de ordem cadastrado sem os campos correspondentes — hoje **não existe** esse teste de integridade cruzada entre as três estruturas de dados.

### Achado M2 — Ausência de teste de integridade entre `fields-data.js` e `retorno-templates.js`

- **Localização exata:** Não existe nenhum arquivo em `tests/` que valide que toda chave usada em `retorno-templates.js` corresponde a um `tipoOrdemOptions` válido (busca por `grep` confirmou ausência desse teste específico).
- **Gravidade:** Média
- **Categoria:** Manutenibilidade / Testabilidade
- **Explicação simples:** Mesmo com 527 testes passando, nenhum deles verifica a consistência estrutural entre as duas fontes de dados de negócio mais importantes do projeto.
- **Motivo técnico:** É um teste de dados (fixture validation), não de lógica de função — categoria de teste frequentemente esquecida.
- **Impacto atual:** Sem impacto detectável hoje (os 36 tipos parecem consistentes na leitura manual do código).
- **Impacto futuro:** Sem esse teste, a correção do Achado M1 perde parte do seu valor preventivo.
- **Como corrigir:** Adicionar teste conforme exemplo do Achado M1.
- **Benefícios da correção:** Rede de segurança automatizada contra a fragilidade estrutural descrita acima.

**Conclusão da seção:** a manutenibilidade do código em si é boa (arquivos pequenos, nomes claros, documentação de convenções no `AGENTS.md`), mas existe uma fragilidade estrutural de dados que a própria equipe já identificou informalmente e que ainda não tem uma rede de segurança automatizada.

---

## 5. Performance

De modo geral, o projeto **não apresenta problemas de performance significativos** para o seu contexto de uso (formulário de campo, poucos usuários simultâneos, sem listas grandes de dados). Os pontos abaixo são otimizações possíveis, não gargalos críticos.

### Achado P1 — Compressão de imagens sequencial, não paralela

- **Localização exata:** `scripts/compress.js`, função `compressAttachments`, laço `for (const file of files)`.
- **Gravidade:** Baixa
- **Categoria:** Performance
- **Explicação simples:** Ao enviar o formulário com até 12 fotos anexadas, cada imagem é comprimida **uma de cada vez**, esperando a anterior terminar (incluindo até 11 tentativas de redução por imagem, cada uma envolvendo `canvas.toBlob`, uma operação assíncrona relativamente cara).
- **Motivo técnico:** `for...of` com `await` dentro do loop serializa as operações de I/O/CPU, em vez de despachá-las em paralelo com `Promise.all`.
- **Impacto atual:** Em um celular de campo com conexão instável e 12 fotos grandes, o tempo total de "Enviando..." pode ser proporcional à soma do tempo de cada imagem, não ao máximo — no pior caso (todas as 12 fotos grandes, cada uma exigindo várias tentativas de redução), o atraso percebido pelo técnico pode ser significativo.
- **Impacto futuro:** Se o limite de anexos for aumentado no futuro (hoje 12), o problema se agrava linearmente.
- **Como corrigir:** Usar `Promise.all` para comprimir todas as imagens em paralelo, respeitando que cada compressão é independente.
- **Exemplo de implementação corrigida:**
  ```js
  export async function compressAttachments(files) {
    return Promise.all(files.map(compressOne));
  }
  async function compressOne(file) {
    /* lógica atual de uma imagem */
  }
  ```
- **Benefícios da correção:** Tempo total de compressão passa a ser aproximadamente o tempo da imagem mais lenta, não a soma de todas — ganho relevante em dispositivos móveis com múltiplos anexos grandes. **Ressalva:** processamento paralelo de `canvas` pode aumentar o pico de uso de memória simultânea; se o dispositivo alvo for um celular de baixo custo, recomenda-se um `Promise.all` com concorrência limitada (ex.: 3 por vez) em vez de ilimitada.

### Achado P2 — `saveState()` sempre lê o registro existente do IndexedDB antes de salvar

- **Localização exata:** `scripts/persistence.js`, função `saveState()`, chamadas a `getRecord(state.currentUUID)` a cada execução (inclusive dentro do debounce de 1s a cada tecla digitada).
- **Gravidade:** Baixa
- **Categoria:** Performance
- **Explicação simples:** A cada vez que o formulário é salvo automaticamente (a cada segundo de inatividade após digitação), o código primeiro busca o registro inteiro do banco local só para comparar se o status mudou de "enviado" para "alterado".
- **Motivo técnico:** É uma leitura assíncrona adicional de IndexedDB por ciclo de salvamento, quando o `status` já poderia ser mantido em `state.status` e comparado apenas quando necessário (ex.: apenas quando `state.status === 'sent'`).
- **Impacto atual:** Impacto mínimo — IndexedDB local é rápido e o debounce de 1s já limita a frequência de chamadas.
- **Impacto futuro:** Não é um gargalo relevante a menos que o volume de dados por registro cresça consideravelmente.
- **Como corrigir:** Só executar a leitura de `getRecord` quando `state.status === 'sent'` (única situação em que a transição para `'changed'` importa), pulando a leitura em todos os outros casos.
- **Benefícios da correção:** Reduz uma leitura assíncrona por save automático na maioria dos casos (formulário ainda em rascunho).

**Conclusão da seção:** performance não é uma preocupação séria neste projeto — os dois achados são otimizações de baixo impacto, não gargalos. Não foram encontrados loops aninhados custosos, vazamentos de memória óbvios (o código inclusive já cuida de revogar `Object URLs` de preview corretamente em `attachments.js`) ou processamento redundante relevante.

---

## 6. Segurança

Esta é a seção com os achados de maior gravidade do relatório.

### Achado S1 — Dependência `nodemailer` com 8 vulnerabilidades de severidade alta conhecidas

- **Localização exata:** `package.json`, `"nodemailer": "^6.9.0"` (resolvido para `6.10.1` em `package-lock.json`); confirmado por `npm audit`.
- **Gravidade:** **Crítica**
- **Categoria:** Segurança / Dependências
- **Explicação simples:** A biblioteca usada para enviar e-mails tem vulnerabilidades públicas conhecidas e corrigidas em versões mais novas, incluindo injeção de comandos SMTP, injeção CRLF em cabeçalhos, bypass de validação de certificado TLS e um problema de SSRF via opção `raw`.
- **Motivo técnico:** `npm audit` reporta explicitamente: _"nodemailer <=9.0.0 — Severity: high"_, com 8 avisos de segurança distintos (GHSA-mm7p-fcc7-pg87, GHSA-c7w3-x93f-qmm8, GHSA-vvjj-xcjg-gr5g, entre outros), todos endereçados apenas na major `9.x`.
- **Impacto atual:** O risco prático depende de quem controla os dados que chegam à função de envio. Como o `subject`, `text` e `filename` de anexos vêm de campos preenchidos por usuários (mesmo que validados no cliente), e a validação client-side pode ser contornada por uma chamada direta à API (ver Achado S2), existe uma superfície real de injeção de cabeçalho/comando SMTP via esses campos antes de chegarem ao `nodemailer`.
- **Impacto futuro:** Enquanto não atualizado, cada novo CVE futuro do `nodemailer` também afeta o projeto automaticamente.
- **Como corrigir:** Atualizar para `nodemailer@9.x` (correção de todas as vulnerabilidades reportadas). É uma mudança de versão maior (breaking change segundo o próprio `npm audit fix --force`), portanto requer testar o fluxo de envio manualmente após a atualização (o projeto já pula testes automatizados de `send.js` — ver Achado K1).
- **Exemplo de implementação corrigida:**
  ```bash
  npm install nodemailer@9
  # revisar netlify/functions/send.js quanto a mudanças de API do createTransport
  ```
- **Benefícios da correção:** Elimina 8 vulnerabilidades conhecidas e publicamente documentadas de uma dependência que processa diretamente conteúdo controlado por usuários (e-mail, um vetor clássico de ataque).

### Achado S2 — Endpoint de envio de e-mail sem autenticação, CSRF/origem ou rate limiting

- **Localização exata:** `netlify/functions/send.js`, `exports.handler`; redirecionamento público em `netlify.toml` (`/api/send` → `/.netlify/functions/send`).
- **Gravidade:** Alta
- **Categoria:** Segurança / Autorização
- **Explicação simples:** Qualquer pessoa que descubra a URL da função (que é pública, pois é um endpoint Netlify sem autenticação) pode enviar requisições `POST` diretamente para ela, sem passar pelo formulário e sem qualquer limite de quantas vezes por minuto/hora isso pode ser feito.
- **Motivo técnico:** Não há verificação de `Origin`/`Referer`, não há token CSRF, não há chave de API, não há reCAPTCHA/hCaptcha, e a Netlify Function não tem rate limiting configurado no `netlify.toml` nem no próprio handler. A única barreira é o limite de payload (10 MB) e de anexos (12), que não impede múltiplas requisições sequenciais.
- **Impacto atual:** Como os destinatários (`SMTP_TO`) são fixos no ambiente (não vêm do formulário — isso é positivo e documentado como decisão consciente), o risco não é "enviar e-mail para qualquer destinatário arbitrário", mas sim: (1) usar a caixa de e-mail configurada como **retransmissor de spam/phishing** para os destinatários fixos, com `subject`/`text`/anexos arbitrários controlados pelo atacante; (2) esgotar a cota de envio do provedor SMTP configurado (possível suspensão da conta por abuso); (3) usar o endpoint como vetor de exfiltração de dados via anexos, empacotando conteúdo arbitrário para os destinatários fixos.
- **Impacto futuro:** Sem correção, o endpoint continuará exposto a scripts automatizados de varredura na internet (Netlify Functions costumam ter padrões de URL previsíveis).
- **Como corrigir:** Adicionar pelo menos uma camada de proteção: (a) verificação do cabeçalho `Origin`/`Referer` contra o domínio esperado; (b) rate limiting simples por IP (ex.: usando um serviço externo como Upstash Redis, dado que Netlify Functions são stateless); (c) um segredo compartilhado simples (header customizado) conhecido apenas pelo frontend legítimo, como mitigação mínima.
- **Exemplo de implementação corrigida:**
  ```js
  const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN; // ex: https://seusite.netlify.app
  exports.handler = async event => {
    const origin = event.headers.origin || event.headers.referer || '';
    if (ALLOWED_ORIGIN && !origin.startsWith(ALLOWED_ORIGIN)) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Origem não autorizada.' }) };
    }
    // ... restante do handler
  };
  ```
- **Benefícios da correção:** Reduz drasticamente a superfície de abuso automatizado por bots que não simulam o cabeçalho `Origin` corretamente (mitigação básica, não uma solução definitiva contra atacantes sofisticados, mas eleva significativamente o custo do ataque).

### Achado S3 — Validação de formato de campos existe apenas no cliente

- **Localização exata:** `scripts/validation.js` (regex de UC, OS, datas) vs. `netlify/functions/send.js` (só valida presença de `subject` e `text`, não formato).
- **Gravidade:** Média
- **Categoria:** Segurança / Validação de entradas
- **Explicação simples:** As regras específicas (UC só números, OS com padrão específico, datas não futuras) só são aplicadas na tela; o servidor aceita qualquer string em `subject` e `text`, desde que não vazias.
- **Motivo técnico:** Não há revalidação server-side dos formatos de negócio, apenas validações genéricas de payload (tamanho, presença de campos).
- **Impacto atual:** Combinado com o Achado S2 (endpoint público sem autenticação), um chamador que não passe pela UI pode enviar `subject`/`text` completamente arbitrários, incluindo conteúdo malicioso, contornando toda a lógica de negócio do formulário.
- **Impacto futuro:** Cresce em severidade proporcionalmente à exposição do endpoint (Achado S2) e à atualização do `nodemailer` (Achado S1) — os três achados se reforçam mutuamente.
- **Como corrigir:** Ao menos validar tamanho máximo razoável de `subject` (hoje sem limite) e sanitizar/normalizar `text` no backend, não confiando exclusivamente na UI.
- **Benefícios da correção:** Defesa em profundidade — mesmo que o frontend seja contornado, o backend mantém garantias mínimas de formato.

### Achado S4 — `rejectUnauthorized: false` desabilita validação de certificado TLS na conexão SMTP

- **Localização exata:** `netlify/functions/send.js`, `transportConfig.tls = { rejectUnauthorized: false }`; documentado como intencional no `AGENTS.md` ("self-signed certs in production").
- **Gravidade:** Média
- **Categoria:** Segurança / Comunicação segura
- **Explicação simples:** A conexão entre o servidor da função e o servidor SMTP aceita **qualquer** certificado, mesmo inválido ou forjado, o que abre a porta para um ataque de interceptação (man-in-the-middle) na conexão SMTP.
- **Motivo técnico:** `rejectUnauthorized: false` é a forma padrão do Node.js/`tls` de desabilitar completamente a validação da cadeia de certificados.
- **Impacto atual:** Não é possível confirmar, com as evidências disponíveis, se o provedor SMTP real usa de fato um certificado autoassinado (a decisão foi documentada como intencional pela equipe, sugerindo que sim). Se for esse o caso, a mitigação correta normalmente é **fixar (pin)** o certificado ou CA específico do servidor SMTP, e não desabilitar toda a validação.
- **Impacto futuro:** Enquanto a configuração permanecer assim, qualquer atacante capaz de interceptar o tráfego de rede do servidor da função (cenário menos provável, mas não nulo em ambientes serverless com proxies/gateways) poderia interceptar ou adulterar e-mails em trânsito sem que o cliente perceba.
- **Como corrigir:** Se o servidor SMTP realmente usa certificado autoassinado, prefira fixar o certificado esperado (`ca` na configuração TLS do Nodemailer) em vez de desabilitar toda a validação; se o provedor suportar certificado válido (Let's Encrypt, por exemplo), a solução ideal é simplesmente remover essa configuração.
- **Benefícios da correção:** Mantém proteção contra interceptação de tráfego SMTP sem abrir mão da flexibilidade de usar um certificado específico.

### Achado S5 — Dados pessoais de funcionários (nomes completos) hardcoded em repositório público

- **Localização exata:** `scripts/data/fields-data.js`, array `nomesTecnicos` (10 nomes completos reais de técnicos) e `placaOptions` (placas de veículos).
- **Gravidade:** Alta
- **Categoria:** Segurança / Exposição de informações sensíveis / Privacidade (LGPD)
- **Explicação simples:** Nomes completos de funcionários e placas de veículos da empresa estão escritos diretamente no código-fonte, que está em um repositório GitHub **publicamente acessível** (confirmado — foi possível clonar via `git clone` sem qualquer autenticação).
- **Motivo técnico:** Não há mecanismo de configuração externa (variável de ambiente, painel administrativo, arquivo `.env` ignorado pelo Git) para esses dados; eles fazem parte do código versionado e público.
- **Impacto atual:** Nomes completos e placas de veículos de uma empresa (pelo domínio de e-mail encontrado no histórico, aparentemente do setor de energia elétrica) estão publicamente visíveis para qualquer pessoa na internet, o que pode caracterizar exposição de dados pessoais sob a LGPD (Lei Geral de Proteção de Dados) — **nota: esta é uma observação técnica sobre exposição de dados, não uma opinião jurídica; a análise de conformidade legal deve ser feita por profissional qualificado**.
- **Impacto futuro:** Cada nova pessoa adicionada à equipe exigirá um novo commit público expondo mais um nome real; se a empresa decidir tornar o repositório privado tardiamente, os nomes já expostos permanecerão no histórico Git público (forks, caches do GitHub, etc.) mesmo após a mudança de visibilidade.
- **Como corrigir:** Mover `nomesTecnicos` e `placaOptions` para uma fonte de dados não versionada publicamente — variável de ambiente, endpoint de configuração privado, ou repositório separado privado — e, dado que a exposição já ocorreu, avaliar a rotação/atualização dessas listas e considerar o uso de `git filter-repo`/BFG para remover o histórico exposto se o repositório permanecer público.
- **Exemplo de implementação corrigida:**
  ```js
  // fields-data.js — passa a buscar de uma API interna ao invés de hardcode
  export async function fetchNomesTecnicos() {
    const res = await fetch('/api/config/tecnicos');
    return res.json();
  }
  ```
- **Benefícios da correção:** Remove dados pessoais identificáveis do código público, permite atualizar a lista de técnicos sem exigir um novo deploy, e reduz a superfície de exposição de dados da empresa.

### Achado S6 — Domínio e e-mail de SMTP real expostos no histórico Git

- **Localização exata:** Histórico Git (`git log -p`), commits antigos de um `README.md` removido, contendo `smtp.beq.com.br` e `contato@beq.com.br` como exemplos de configuração.
- **Gravidade:** Baixa
- **Categoria:** Segurança / Exposição de informações
- **Explicação simples:** Em versões antigas da documentação (já removida do estado atual do repositório, mas ainda visível no histórico), aparecem o domínio real de e-mail da empresa e um endereço de contato real como "exemplo" de configuração.
- **Motivo técnico:** O histórico Git é imutável por padrão e publicamente acessível junto com o repositório; remover um arquivo em um commit novo não apaga sua presença em commits antigos.
- **Impacto atual:** Exposição de nome de domínio de e-mail real da organização (não uma senha, apenas um identificador de infraestrutura), o que por si só tem impacto baixo, mas contribui como informação de reconhecimento (_OSINT_) para um possível atacante direcionado à organização.
- **Impacto futuro:** Nenhum novo dano incremental, a menos que mais segredos reais sejam commitados por engano no futuro seguindo o mesmo padrão.
- **Como corrigir:** Se o domínio for considerado sensível, reescrever o histórico Git (`git filter-repo`) para remover essas menções, ou aceitar o risco como baixo dado que é apenas um nome de domínio (não uma credencial).
- **Benefícios da correção:** Reduz a quantidade de informação de reconhecimento disponível publicamente sobre a infraestrutura de e-mail da organização.

**Resumo da seção de segurança:** o backend implementa boas práticas defensivas pontuais (limite de payload, limite de anexos, validação de formato de e-mail via regex, log de auditoria estruturado, sanitização de nome de arquivo) — isso é louvável e mostra que a equipe já pensou em segurança. Porém, a combinação de dependência vulnerável (S1) + endpoint público sem autenticação/rate limit (S2) + validação só client-side (S3) formam uma cadeia de risco real que deveria ser tratada com prioridade antes de qualquer uso em produção com dados sensíveis.

---

## 7. Tratamento de erros

O tratamento de erros é, em geral, **consistente e bem pensado no fluxo principal**: `send.js` (frontend) tem `try/catch/finally` reabilitando o botão de envio mesmo em falha; `persistence.js` trata especificamente `QuotaExceededError` do IndexedDB mostrando um toast amigável ao usuário; a função Netlify loga erros estruturados em JSON com `timestamp`, `message`, `code`, `command` e `stack` — uma prática de observabilidade acima da média para um projeto deste porte.

### Achado E1 — Erros silenciosamente ignorados em ações destrutivas da sidebar

- **Localização exata:** `scripts/sidebar.js`, blocos `catch (_err) { /* ignore */ }` nos handlers de "Editar" e "Excluir" registro.
- **Gravidade:** Média
- **Categoria:** Tratamento de erros / Robustez
- **Explicação simples:** Se a exclusão ou a busca de um registro falhar (por exemplo, por corrupção do IndexedDB ou erro de transação), o usuário não recebe nenhum feedback — a ação simplesmente não acontece, sem explicação.
- **Motivo técnico:** O padrão `catch (_err) { /* ignore */ }` suprime completamente o erro, sem log no console e sem `showToast` para o usuário.
- **Impacto atual:** Em caso de falha (rara, mas possível — ex.: armazenamento cheio, banco corrompido), o usuário pode achar que "clicou errado" e tentar novamente repetidamente, sem entender que há um problema real.
- **Impacto futuro:** Dificulta diagnóstico de bugs relatados por usuários de campo, já que não há nenhum rastro do erro (nem no console, nem em UI).
- **Como corrigir:** Ao menos logar o erro no console (`console.error`) e mostrar um toast de erro genérico ao usuário.
- **Exemplo de implementação corrigida:**
  ```js
  } catch (err) {
    console.error('Erro ao excluir registro:', err);
    showToast('Não foi possível excluir o registro. Tente novamente.', false);
  }
  ```
- **Benefícios da correção:** Usuário recebe feedback imediato de que algo deu errado, e desenvolvedores ganham visibilidade de erros reais ocorrendo em campo.

### Achado E2 — Ausência de testes automatizados para o código com tratamento de erro mais crítico

Ver Achado K1 na seção de Testabilidade — o arquivo com a lógica de tratamento de erro mais sensível a segurança (`netlify/functions/send.js`) é justamente o único sem cobertura de teste automatizada.

**Conclusão da seção:** o tratamento de erros no fluxo principal (envio, persistência) é maduro; a lacuna está em ações secundárias da sidebar (excluir/editar), onde erros são descartados silenciosamente.

---

## 8. Consistência

O projeto é notavelmente consistente em convenções de nomenclatura (`camelCase` para funções/variáveis JS, nomes de domínio em português), formatação (Prettier + ESLint aplicados e **passando sem nenhum erro** na verificação realizada), e estrutura de imports (sempre relativos, sempre no topo do arquivo, sem imports dinâmicos exceto um caso justificado em `persistence.js` para evitar dependência circular ao importar `ui.js` sob demanda).

### Achado C1 — Mistura de convenção de nomes entre inglês e português nos mesmos arquivos

- **Localização exata:** Exemplos: `scripts/retornos.js` (`agruparPorLinha`, `hasConditionalDependents` — mistura português e inglês na mesma função de utilidade); `data-field-nome` (atributo HTML em português) ao lado de `data-tipo`, `data-equip` (mesma convenção, mas em contraste com nomes de função majoritariamente em inglês em outros módulos como `dom.js`, `db.js`, `persistence.js`).
- **Gravidade:** Baixa
- **Categoria:** Consistência / Convenção de nomenclatura
- **Explicação simples:** Alguns arquivos usam nomes de função e variável em português (domínio de negócio) e outros em inglês (infraestrutura técnica), o que é uma prática comum e defensável (dados de domínio em PT, infraestrutura em EN), mas às vezes a fronteira não é totalmente limpa dentro do mesmo arquivo.
- **Motivo técnico:** Não há um guia de estilo documentado que declare explicitamente essa regra (ex.: "todo nome relacionado a UI/negócio em português, todo nome de infraestrutura em inglês"), então a consistência observada parece ser fruto de convenção implícita, não de uma regra escrita.
- **Impacto atual:** Nenhum impacto funcional; é uma questão estética/de padronização.
- **Impacto futuro:** Sem uma regra escrita, novos contribuidores podem introduzir inconsistências maiores ao longo do tempo.
- **Como corrigir:** Adicionar uma seção curta ao `AGENTS.md` formalizando a convenção observada (nomes de domínio/negócio em português, nomes de infraestrutura/utilitários em inglês).
- **Benefícios da correção:** Padronização explícita reduz debate subjetivo em revisões de código futuras.

**Conclusão da seção:** consistência é um dos pontos mais fortes do projeto — confirmado objetivamente pelo lint 100% limpo. O único ponto é a falta de uma regra explícita para a mistura (aceitável) de idiomas.

---

## 9. Reutilização

Este é outro ponto forte, com evidências concretas:

- `EQUIPMENT_KEYS` (fonte única para 9 equipamentos) evita duplicação em pelo menos 4 arquivos diferentes.
- `INPUT_CREATORS`/`SECTION_VALIDATORS` (tabelas de despacho) evitam blocos `if/else if` repetidos.
- `showModalElements()` em `ui.js` é uma função genérica reutilizada por **três modais diferentes** (confirmação, duplicidade, e potencialmente outros futuros), retornando uma Promise — um padrão de reutilização de qualidade profissional.
- `formatDate()` em `utils.js` é usada tanto para exibição na sidebar quanto para formatação de datas no corpo do e-mail.

### Achado R1 — Lógica de "re-renderizar todas as seções" duplicada entre `reset.js` e `restore.js`

- **Localização exata:** `scripts/reset.js` (`resetForm`) e `scripts/restore.js` (`applyRecord`) — ambos chamam, em sequência muito similar, `renderIniciais()`, re-anexam o listener de `tipoOrdem`, chamam `renderEquipamentos()`, `updateFileCount()`/`renderPreviews()`, e `updateLivePreview()`.
- **Gravidade:** Baixa
- **Categoria:** Reutilização / DRY
- **Explicação simples:** Duas funções diferentes (uma para "limpar o formulário", outra para "carregar um registro salvo") repetem a mesma sequência de passos de re-renderização, com pequenas variações apenas nos dados usados para preencher os campos.
- **Motivo técnico:** Não há uma função `reRenderAllSections()` compartilhada; a sequência de chamadas está duplicada em ambos os arquivos.
- **Impacto atual:** Nenhum bug — ambas as sequências estão corretas hoje.
- **Impacto futuro:** Se uma nova seção for adicionada ao formulário (ex.: seção 6), será necessário lembrar de atualizar **dois** lugares (reset e restore) com a mesma nova chamada de renderização, criando risco de esquecimento em um dos dois.
- **Como corrigir:** Extrair uma função comum `reRenderAllSections()` que ambos os fluxos chamem, recebendo apenas os dados que diferem (vazio vs. registro existente).
- **Benefícios da correção:** Um único ponto de manutenção para a sequência de re-renderização, reduzindo risco de divergência entre "novo formulário" e "editar registro".

**Conclusão da seção:** reutilização é um ponto forte geral do projeto (padrões de tabela de despacho, funções genéricas de modal), com apenas uma duplicação pontual e de baixo risco entre dois fluxos de re-render.

---

## 10. Escalabilidade

O projeto foi claramente desenhado para uma **escala pequena e conhecida**: uma equipe de campo com ~10 técnicos, 36 tipos de ordem, uso offline-first via PWA. Para esse escopo, as escolhas arquiteturais (vanilla JS, sem bundler, estado global, IndexedDB local) são adequadas e até elogiáveis pela simplicidade (YAGNI bem aplicado).

Os limitadores de escala já identificados nas seções anteriores (e não repetidos aqui em detalhe) são:

- **Achado M1** (acoplamento por string entre tipos de ordem) — limita o crescimento seguro do catálogo de tipos de ordem.
- **Achado A2** (estado global mutável) — limita a complexidade de fluxo que a aplicação pode suportar sem refatoração.
- **Achado S5** (dados hardcoded de técnicos) — limita a capacidade de gerenciar uma equipe maior sem exigir deploy de código a cada mudança.

### Achado ES1 — Ausência de paginação/virtualização na listagem de registros da sidebar

- **Localização exata:** `scripts/sidebar.js`, `renderSidebar()` — chama `getAllRecords()` (busca **todos** os registros do IndexedDB) e renderiza todos no DOM de uma vez, sem paginação ou virtualização de lista.
- **Gravidade:** Baixa
- **Categoria:** Escalabilidade
- **Explicação simples:** Se o número de registros salvos localmente crescer muito (ex.: um técnico que nunca limpa registros antigos, acumulando centenas ao longo de meses), a sidebar terá que renderizar todos eles de uma vez, cada um com múltiplos elementos DOM e listeners.
- **Motivo técnico:** Ausência de `LIMIT`/paginação na consulta a `getAllRecords()` e ausência de virtualização de lista (ex.: renderizar apenas os itens visíveis na viewport).
- **Impacto atual:** Não é possível confirmar, com as evidências disponíveis, se isso já causa lentidão perceptível — depende do volume real de dados de cada dispositivo em campo, que não é observável a partir do código-fonte.
- **Impacto futuro:** Em uso de longo prazo sem limpeza periódica de registros antigos, a performance de abertura da sidebar tende a degradar de forma proporcional ao total acumulado de registros.
- **Como corrigir:** Adicionar paginação simples (ex.: mostrar os 50 mais recentes com opção de "carregar mais") ou uma rotina de expurgo automático de registros com status `'sent'` mais antigos que N dias.
- **Benefícios da correção:** Performance de abertura da sidebar deixa de depender do volume histórico total de dados do dispositivo.

**Conclusão da seção:** a escalabilidade é adequada ao propósito atual do projeto; os limitadores identificados só se tornam relevantes se o escopo de uso crescer significativamente além do cenário atual (equipe pequena, uso de campo).

---

## 11. Testabilidade

Este é um ponto de **contraste forte** no projeto: excelente no frontend, ausente no backend.

| Área                                  | Cobertura                                                                                                                                                                                                         |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/*.js` (frontend)             | 24 arquivos de teste unitário cobrindo praticamente todos os módulos (`db.test.js`, `validation.test.js`, `email.test.js`, `retornos.test.js`, `persistence-flow.test.js`, etc.) — **527 testes, todos passando** |
| Testes E2E (Playwright)               | 6 specs cobrindo fluxos de persistência multi-aba, reload, IndexedDB, anexos                                                                                                                                      |
| `netlify/functions/send.js` (backend) | **Zero testes automatizados** — explicitamente documentado: _"Tests skip send.js (SMTP not available in CI)"_                                                                                                     |
| Script `test:coverage`                | **Quebrado** — depende de `@vitest/coverage-v8`, que não está listado em `devDependencies` (confirmado por execução real: `Cannot find dependency '@vitest/coverage-v8'`)                                         |
| CI (Integração Contínua)              | **Inexistente** — não há pasta `.github/workflows`; o build da Netlify roda apenas `npm install`, sem `npm run lint` nem `npm test`                                                                               |

### Achado K1 — Backend de envio de e-mail sem nenhum teste automatizado

- **Localização exata:** `netlify/functions/send.js` (129 linhas); ausência confirmada de qualquer arquivo `tests/send-function.test.js` ou equivalente cobrindo este arquivo especificamente (o `tests/send.test.js` existente testa `scripts/send.js`, o módulo **frontend**, não a função serverless).
- **Gravidade:** Alta
- **Categoria:** Testabilidade
- **Explicação simples:** O arquivo mais sensível a segurança do projeto — o único que lida com credenciais SMTP, monta e envia e-mails reais — é justamente o único sem nenhuma rede de segurança automatizada.
- **Motivo técnico:** O `nodemailer.createTransport` faz conexão de rede real com um servidor SMTP, o que a equipe optou por não simular em CI (decisão razoável dado o custo/complexidade de mockar SMTP), mas isso não justifica testar **zero** da lógica de validação que **antecede** o envio (validação de payload, de e-mails, de anexos, sanitização) — essa parte não depende de rede e é perfeitamente testável com `vi.mock('nodemailer')`.
- **Impacto atual:** Qualquer regressão futura na lógica de validação de payload/anexos (ex.: uma alteração acidental na regex de e-mail, ou na checagem de tamanho de payload) não seria pega automaticamente antes do deploy.
- **Impacto futuro:** Combinado com a ausência de CI (não há verificação automática antes do merge/deploy), uma regressão de segurança neste arquivo específico só seria descoberta em produção.
- **Como corrigir:** Mockar `nodemailer` com `vi.mock('nodemailer')` e testar exclusivamente a lógica de validação (que é pura e não depende de rede real), deixando de fora apenas a chamada real de `sendMail`.
- **Exemplo de implementação corrigida:**

  ```js
  import { vi, describe, it, expect } from 'vitest';
  vi.mock('nodemailer', () => ({
    default: { createTransport: () => ({ sendMail: vi.fn().mockResolvedValue({}) }) },
  }));
  import { handler } from '../netlify/functions/send.js';

  describe('send function validation', () => {
    it('rejeita payload sem subject', async () => {
      const res = await handler({ httpMethod: 'POST', body: JSON.stringify({ text: 'x' }) });
      expect(res.statusCode).toBe(400);
    });
  });
  ```

- **Benefícios da correção:** Cobre automaticamente a lógica de validação/segurança mais crítica do projeto, sem exigir uma conexão SMTP real em CI.

### Achado K2 — Script `test:coverage` quebrado (dependência ausente)

- **Localização exata:** `package.json`, script `"test:coverage": "vitest run --coverage"`, sem `@vitest/coverage-v8` em `devDependencies`.
- **Gravidade:** Média
- **Categoria:** Testabilidade / Dependências
- **Explicação simples:** O comando documentado para gerar relatório de cobertura de testes **não funciona** — falha imediatamente com erro de dependência ausente (confirmado por execução real neste relatório).
- **Motivo técnico:** O Vitest, a partir da v3+, requer um provedor de cobertura como pacote separado (`@vitest/coverage-v8`), que nunca foi adicionado ao `package.json` apesar do script já existir.
- **Impacto atual:** Ninguém na equipe consegue medir a cobertura real de testes com o comando documentado, apesar de ter 527 testes — não é possível, a partir do repositório, saber qual percentual real do código está coberto.
- **Impacto futuro:** Sem visibilidade de cobertura, é fácil introduzir código não testado sem perceber, especialmente em áreas de borda (edge cases).
- **Como corrigir:** `npm install --save-dev @vitest/coverage-v8`.
- **Benefícios da correção:** Restaura a capacidade de medir cobertura real, permitindo identificar objetivamente áreas do código sem teste (por exemplo, o próprio `netlify/functions/send.js`, Achado K1).

### Achado K3 — Ausência de Integração Contínua (CI)

- **Localização exata:** Ausência confirmada de `.github/workflows/` ou qualquer outro arquivo de CI (GitLab CI, CircleCI etc.) no repositório.
- **Gravidade:** Alta
- **Categoria:** Testabilidade / Processo
- **Explicação simples:** Não existe nenhuma verificação automática (lint + testes) rodando a cada `push`/Pull Request antes do merge. O único "build" automático é o da Netlify, que roda apenas `npm install` (conforme `netlify.toml`, `command = "npm install"`), **sem rodar lint nem testes**.
- **Motivo técnico:** O `husky` está configurado apenas para o hook local `pre-commit` (lint-staged + bump de cache), que só roda na máquina do desenvolvedor que fez `npm install` localmente — não é uma garantia de qualidade centralizada e obrigatória para todo o time.
- **Impacto atual:** É tecnicamente possível fazer merge de um Pull Request com testes quebrados ou lint falhando, desde que o autor não tenha o hook do Husky ativo localmente (ex.: colaborador externo, ambiente CI de terceiros, ou simplesmente `git commit --no-verify`).
- **Impacto futuro:** À medida que mais pessoas contribuem, a garantia de qualidade "por convenção local" tende a falhar; é o tipo de proteção que só CI centralizado garante de forma confiável.
- **Como corrigir:** Adicionar um workflow simples de GitHub Actions que rode `npm ci && npm run lint && npm test` em cada push/PR.
- **Exemplo de implementação corrigida:**
  ```yaml
  # .github/workflows/ci.yml
  name: CI
  on: [push, pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: 20 }
        - run: npm ci
        - run: npm run lint
        - run: npm test
  ```
- **Benefícios da correção:** Garante que nenhum código com lint/testes quebrados chegue à branch principal, independentemente do ambiente local de quem contribui — essencial antes de considerar o projeto pronto para colaboração em equipe ou produção crítica.

**Conclusão da seção:** o projeto tem uma cultura de testes unitários **genuinamente forte** no frontend (527 testes é um número expressivo para este porte de aplicação), mas essa disciplina não se estende ao backend nem ao processo de integração — são as duas lacunas mais importantes de todo o relatório em termos de risco de regressão.

---

## 12. Interface (UI/UX)

Com base na leitura de `index.html` e `style.css`, sem execução visual real do navegador (não foi possível renderizar a aplicação neste ambiente de análise, portanto as observações abaixo se baseiam exclusivamente na estrutura HTML/CSS/ARIA do código-fonte, não em teste manual de usabilidade).

**Pontos fortes observados no código:**

- Uso consistente de atributos ARIA (`aria-label`, `aria-expanded`, `aria-live="assertive"` na mensagem de erro, `role="alert"`, `role="button"` com `tabindex="0"` na área de upload) — um nível de cuidado com acessibilidade **acima da média** para um projeto interno de pequeno porte.
- Feedback visual claro para o usuário: classes `is-filled`, mensagens de erro por campo (`field-error`), toast de sucesso/erro, modais de confirmação para ações destrutivas (excluir registro, reenvio de registro já enviado).
- Layout responsivo simples via Tailwind (`max-sm:grid-cols-2` no grid de anexos), adequado ao uso majoritariamente mobile (técnicos de campo).
- PWA com manifest e ícones configurados corretamente para instalação em tela inicial (`display: standalone`, ícones 192/512).

### Achado I1 — Falta de indicador de carregamento explícito durante compressão de anexos

- **Localização exata:** `scripts/send.js`, `sendEmail()` — o botão muda para "Enviando..." apenas após a validação e checagem de duplicidade, mas a etapa de `compressAttachments()` (que pode envolver até 12 imagens com múltiplas tentativas de recompressão cada) ocorre **dentro** do mesmo período "Enviando...", sem indicação de progresso (ex.: "comprimindo imagem 3 de 12").
- **Gravidade:** Baixa
- **Categoria:** Interface / Feedback ao usuário
- **Explicação simples:** Durante o envio, se a compressão de fotos demorar (ver Achado P1), o usuário só vê "Enviando..." parado, sem saber se o processo está travado ou apenas processando imagens grandes.
- **Motivo técnico:** Não há callback de progresso passado para `compressAttachments`, nem atualização incremental do texto do botão.
- **Impacto atual:** Em conexões/dispositivos lentos, o usuário pode achar que o app travou e fechar o aplicativo no meio do processo, perdendo o envio.
- **Impacto futuro:** Piora proporcionalmente ao Achado P1 se o número de anexos por envio crescer.
- **Como corrigir:** Adicionar um callback de progresso simples que atualize o texto do botão (ex.: "Comprimindo 3/12...").
- **Benefícios da correção:** Reduz a percepção de "travamento" e a chance de o usuário interromper um envio em andamento.

**Conclusão da seção:** com base na leitura estática do código, a interface parece ter recebido atenção genuína a acessibilidade e feedback ao usuário — não há evidência suficiente no código para avaliar aspectos puramente visuais/estéticos (hierarquia visual, contraste de cores reais renderizados, etc.), pois isso exigiria inspeção visual em navegador, que não foi realizada nesta análise.

---

## 13. Documentação

### Achado D1 — Ausência de README.md voltado a onboarding humano

- **Localização exata:** Raiz do repositório — existe apenas `AGENTS.md`, sem `README.md`.
- **Gravidade:** Média
- **Categoria:** Documentação
- **Explicação simples:** O único documento de referência do projeto (`AGENTS.md`) é escrito explicitamente para orientar agentes de IA (Claude Code/"OpenCode") sobre convenções de código e skills a carregar — não é uma introdução para um novo desenvolvedor humano entender rapidamente do que se trata o projeto, como instalá-lo e como contribuir.
- **Motivo técnico:** `AGENTS.md` cobre bem o "como" técnico (stack, comandos, convenções não óbvias) mas não contextualiza o "o quê" e "por quê" do projeto (para quem é usado, qual problema de negócio resolve, capturas de tela do formulário, etc.) — informação tipicamente esperada em um `README.md`.
- **Impacto atual:** Um novo desenvolvedor humano que abrir o repositório pela primeira vez não tem uma introdução amigável ao propósito do projeto; precisa inferir a partir do código e do `AGENTS.md` técnico.
- **Impacto futuro:** Dificulta onboarding de novos contribuidores humanos e a apresentação do projeto a terceiros (ex.: um cliente ou stakeholder que queira entender o produto sem ler código).
- **Como corrigir:** Criar um `README.md` enxuto com: propósito do projeto, screenshot do formulário, instruções de instalação/execução local, link para `AGENTS.md` para detalhes de convenções de desenvolvimento.
- **Benefícios da correção:** Onboarding mais rápido para humanos, complementando (não substituindo) o `AGENTS.md` já existente e bem cuidado.

### Achado D2 — Ausência de `LICENSE`

- **Localização exata:** Raiz do repositório — nenhum arquivo `LICENSE`/`LICENSE.md`.
- **Gravidade:** Baixa
- **Categoria:** Documentação
- **Explicação simples:** Não há um arquivo de licença explícito, o que — sendo um repositório público no GitHub — deixa ambíguos os termos legais de uso/reprodução do código por terceiros.
- **Motivo técnico:** Ausência de arquivo `LICENSE`.
- **Impacto atual:** Baixo, dado que aparenta ser uma ferramenta interna de uso privado de uma empresa específica (não um projeto open source com intenção de reutilização por terceiros).
- **Impacto futuro:** Se a intenção for manter o código privado, isso reforça a recomendação já feita (Achado S5) de tornar o repositório privado, já que a ausência de licença em um repo público **não impede legalmente terceiros de visualizar/clonar o código** (apenas restringe redistribuição sob leis de direitos autorais padrão).
- **Como corrigir:** Definir explicitamente a intenção — se privado, tornar o repositório privado no GitHub; se público intencionalmente, adicionar uma licença apropriada (ex.: proprietária, "All rights reserved", ou MIT se for realmente open source).
- **Benefícios da correção:** Clareza jurídica sobre o uso do código.

**Conclusão da seção:** o `AGENTS.md` é, na verdade, um documento de **qualidade excepcional** para seu propósito (orientar desenvolvimento assistido por IA) — é detalhado, específico, e revela uma equipe que documenta ativamente armadilhas conhecidas (ex.: o próprio Achado M1 já é mencionado ali). A lacuna real é a ausência de documentação voltada a humanos/onboarding geral e de um arquivo de licença.

---

## 14. Dependências

| Dependência                                      | Versão instalada           | Situação                                                           |
| ------------------------------------------------ | -------------------------- | ------------------------------------------------------------------ |
| `nodemailer`                                     | 6.10.1                     | ⚠️ **Vulnerável** — ver Achado S1                                  |
| `eslint`                                         | 10.5.0 → 10.7.0 disponível | Desatualizado (minor)                                              |
| `tailwindcss`                                    | 3.4.19 → 4.x disponível    | Desatualizado (major) — ver Achado DP1                             |
| `vitest`                                         | 4.1.8 → 4.1.10 disponível  | Desatualizado (patch)                                              |
| `prettier`, `postcss`, `autoprefixer`, `globals` | —                          | Desatualizados (patch/minor, baixo risco)                          |
| `@vitest/coverage-v8`                            | **Ausente**                | Necessário para o script `test:coverage` funcionar — ver Achado K2 |

### Achado DP1 — Tailwind CSS travado na v3, com v4 disponível

- **Localização exata:** `package.json`, `"tailwindcss": "^3.4.19"`; `tailwind.config.js`, `postcss.config.js` usando sintaxe da v3.
- **Gravidade:** Baixa
- **Categoria:** Dependências
- **Explicação simples:** O projeto usa a versão 3 do Tailwind CSS, enquanto a versão 4 (com engine reescrita em Rust, mais rápida e com nova sintaxe de configuração via CSS) já está disponível.
- **Motivo técnico:** Migração de major version do Tailwind é uma mudança significativa de configuração (a v4 muda a forma de configurar temas, de `tailwind.config.js` para diretivas CSS), não uma atualização trivial.
- **Impacto atual:** Nenhum — a v3 continua funcional e recebendo, até certo ponto, suporte da comunidade.
- **Impacto futuro:** Ficar cada vez mais distante da versão atual aumenta o esforço de migração futura e eventualmente perde acesso a correções de segurança/performance feitas apenas na v4.
- **Como corrigir:** Não é urgente; considerar migração planejada quando houver tempo dedicado, dado que envolve reescrever `tailwind.config.js`.
- **Benefícios da correção:** Build mais rápido (a v4 é significativamente mais rápida que a v3) e acesso a novos recursos de CSS nativo.

### Achado DP2 — `undici` vulnerável (dependência transitiva)

- **Localização exata:** `node_modules/undici` (dependência transitiva, não direta do projeto), reportada pelo `npm audit`.
- **Gravidade:** Média
- **Categoria:** Dependências / Segurança
- **Explicação simples:** Uma biblioteca interna usada por outra dependência (não escolhida diretamente pelo projeto) tem vulnerabilidades conhecidas relacionadas a manipulação de proxy SOCKS5 e cabeçalhos HTTP.
- **Motivo técnico:** `npm audit` indica correção disponível via `npm audit fix` (sem necessidade de `--force`, ou seja, não é uma mudança breaking).
- **Impacto atual:** Como é uma dependência transitiva (provavelmente de alguma ferramenta de desenvolvimento/teste, não usada em runtime de produção — **não foi possível confirmar com certeza absoluta qual pacote direto a introduz**, isso exigiria uma árvore de dependências completa fora do escopo desta análise), o risco prático em produção provavelmente é baixo, mas ainda assim vale corrigir.
- **Como corrigir:** Rodar `npm audit fix` (correção não-breaking, segundo o próprio relatório de auditoria).
- **Benefícios da correção:** Elimina uma vulnerabilidade de severidade alta com esforço mínimo (correção automática disponível).

**Conclusão da seção:** o conjunto de dependências é enxuto e apropriado ao projeto (sem bibliotecas supérfluas — nenhuma dependência "pesada" ou redundante foi encontrada); os problemas são desatualização normal de um projeto ativo, com uma exceção genuinamente importante (`nodemailer`, Achado S1).

---

## 15. Organização geral do projeto

```
mail-smtp/
├── index.html               # Único ponto de entrada (SPA sem roteamento)
├── scripts/                 # 24 módulos ES6, um por responsabilidade
│   └── data/                 # Dados estáticos (fields, templates) separados da lógica
├── netlify/functions/        # 1 função serverless (send.js)
├── tests/                   # 28 arquivos de teste unitário (Vitest + jsdom)
├── tests-e2e/                # 6 specs Playwright
├── dados_projeto/            # ⚠️ arquivos .xlsx/.html não referenciados pelo código
├── docs/superpowers/          # Specs de skills para agentes de IA
├── AGENTS.md                  # Documentação técnica voltada a agentes de IA/dev workflow
└── (configs: eslint, prettier, tailwind, playwright, vitest, netlify.toml)
```

### Achado O1 — Diretório `dados_projeto/` (96 KB) não referenciado pelo código

- **Localização exata:** `dados_projeto/analise_completa_ordens_servico.xlsx`, `tipos_ordem.xlsx`, `tipos_ordem_template.xlsx`, `tipos_ordens_e_retornos.html` — confirmado por `grep` que nenhum arquivo `.js` do projeto referencia esse diretório.
- **Gravidade:** Baixa
- **Categoria:** Organização geral
- **Explicação simples:** Existem quatro arquivos de planilha/HTML dentro do repositório de código que parecem ter sido a fonte original de dados usada para escrever manualmente `fields-data.js`/`retorno-templates.js`, mas que não são lidos programaticamente pela aplicação — são apenas peso morto dentro do repositório de código.
- **Motivo técnico:** Ausência de qualquer `import`, `fetch` ou `require` apontando para `dados_projeto/` em todo o código-fonte JS.
- **Impacto atual:** Nenhum impacto funcional; apenas aumenta o tamanho do repositório (96 KB) e pode confundir um novo desenvolvedor sobre se esses arquivos são ou não consumidos pela aplicação em tempo de execução.
- **Impacto futuro:** Conforme mais planilhas de referência forem adicionadas ao longo do tempo, o repositório de **código** acumula cada vez mais material de **dados de referência/planejamento**, misturando dois tipos de artefato com ciclos de vida e donos diferentes.
- **Como corrigir:** Mover esses arquivos para uma pasta `docs/reference-data/` com um `README.md` explicando claramente que são apenas fontes históricas de referência (não consumidas em runtime), ou removê-los do repositório de código e guardá-los em um Drive/wiki interno da equipe.
- **Benefícios da correção:** Repositório de código mais enxuto e sem ambiguidade sobre o que é consumido programaticamente versus o que é material de apoio administrativo.

**Conclusão da seção:** a organização de diretórios do código-fonte propriamente dito é limpa e convencional (separação clara entre `scripts/`, `netlify/functions/`, `tests/`); o único ponto de desorganização é a presença de material de referência não técnico dentro do mesmo repositório de código.

---

## 16. Pontuação

| Critério             | Nota (0–10) | Justificativa resumida                                                                               |
| -------------------- | :---------: | ---------------------------------------------------------------------------------------------------- |
| **Arquitetura**      |     7,0     | Boa separação por responsabilidade para SPA vanilla JS; 1 dependência circular real (Achado A1)      |
| **Organização**      |     7,5     | Estrutura de pastas limpa; material não técnico (dados_projeto) misturado ao repo de código          |
| **Modularidade**     |     8,0     | Arquivos pequenos (média ~110 linhas), padrões de tabela de despacho bem aplicados                   |
| **Performance**      |     7,5     | Sem gargalos críticos; duas otimizações possíveis de baixo impacto                                   |
| **Segurança**        |     4,0     | Dependência com 8 CVEs ativos, endpoint público sem rate limit/auth, PII exposta em repo público     |
| **Escalabilidade**   |     6,0     | Adequada ao escopo atual; acoplamento por string e estado global limitam crescimento                 |
| **Legibilidade**     |     8,0     | Nomes claros, JSDoc presente, lint 100% limpo                                                        |
| **Manutenibilidade** |     6,5     | Boa modularidade, mas fragilidade estrutural de dados (Achado M1) sem rede de segurança automatizada |
| **Documentação**     |     6,0     | `AGENTS.md` excelente para dev/IA, mas sem README humano nem LICENSE                                 |
| **Testabilidade**    |     6,5     | Excelente no frontend (527 testes); zero cobertura no backend crítico e sem CI                       |

### Nota geral do projeto: **6,7 / 10**

> Cálculo: média aritmética simples das 10 notas acima = (7,0+7,5+8,0+7,5+4,0+6,0+8,0+6,5+6,0+6,5) / 10 = **6,7**.
> A nota geral reflete um projeto **tecnicamente bem construído no frontend, com disciplina de testes e lint acima da média para o porte**, mas que carrega riscos de segurança concretos e mensuráveis (dependência vulnerável, endpoint público, dados pessoais expostos) que impedem uma nota mais alta e que devem ser tratados antes de qualquer uso ampliado em produção.

---

## 17. Plano de melhorias

### 🔴 Críticas (corrigir imediatamente)

1. **[S1]** Atualizar `nodemailer` para a versão 9.x, corrigindo 8 vulnerabilidades de severidade alta.
2. **[S5]** Remover dados pessoais (nomes completos de funcionários, placas de veículos) do código-fonte público; avaliar tornar o repositório privado.

### 🟠 Alta prioridade

3. **[S2]** Adicionar verificação de origem/CSRF e rate limiting ao endpoint `netlify/functions/send.js`.
4. **[K3]** Configurar CI (GitHub Actions) rodando `lint` + `test` em cada push/PR.
5. **[K1]** Adicionar testes unitários para a lógica de validação de `netlify/functions/send.js` (mockando `nodemailer`).
6. **[M1]** Desacoplar o texto de exibição de "Tipo de Ordem" da chave de lookup usada em `retornoFieldsByTipo`/`retornoTemplates` (introduzir slugs estáveis).
7. **[S3]** Adicionar validação server-side mínima de formato/tamanho para `subject`/`text` no `send.js`.

### 🟡 Média prioridade

8. **[A1]** Resolver a dependência circular `app.js → sidebar.js → restore.js`.
9. **[K2]** Adicionar `@vitest/coverage-v8` como devDependency para restaurar o script `test:coverage`.
10. **[M2]** Adicionar teste de integridade cruzada entre `tipoOrdemOptions`, `retornoFieldsByTipo` e `retornoTemplates`.
11. **[S4]** Revisar a necessidade de `rejectUnauthorized: false` na configuração TLS do SMTP; considerar fixar o certificado esperado em vez de desabilitar toda a validação.
12. **[Q2]** Validar `filename`/`content` de anexos antes de processá-los na função Netlify, evitando exceções não tratadas.
13. **[E1]** Adicionar feedback ao usuário (toast) em erros hoje silenciosamente ignorados na sidebar (excluir/editar registro).
14. **[D1]** Criar `README.md` voltado a onboarding humano.
15. **[DP2]** Rodar `npm audit fix` para corrigir a vulnerabilidade de `undici` (correção não-breaking).

### 🟢 Baixa prioridade

16. **[P1]** Paralelizar a compressão de anexos em `compress.js` com `Promise.all` (com limite de concorrência).
17. **[O1]** Mover `dados_projeto/` para fora do repositório de código ou para uma pasta claramente documentada como material de referência.
18. **[R1]** Extrair função comum de re-renderização compartilhada entre `reset.js` e `restore.js`.
19. **[ES1]** Adicionar paginação/expurgo de registros antigos na sidebar.
20. **[I1]** Adicionar indicador de progresso durante compressão de anexos no envio.
21. **[B1]** Atualizar `AGENTS.md` esclarecendo a exceção de acesso a DOM para campos dinâmicos.
22. **[C1]** Formalizar no `AGENTS.md` a convenção de idioma (domínio em português, infraestrutura em inglês).
23. **[D2]** Definir explicitamente a licença do repositório (ou confirmar intenção de mantê-lo privado).
24. **[DP1]** Planejar migração futura do Tailwind CSS v3 → v4.
25. **[P2]** Evitar leitura desnecessária de `getRecord` em `saveState()` quando o registro ainda não foi enviado.

---

## 18. Roadmap

### Fase 1 — Estancar riscos de segurança (1–2 semanas)

- Atualizar `nodemailer` para v9.x e validar manualmente o fluxo de envio.
- Remover/rotacionar dados pessoais do código-fonte; decidir sobre visibilidade do repositório.
- Adicionar verificação básica de `Origin` e um limite simples de requisições ao endpoint de envio.
- Rodar `npm audit fix` para o `undici`.

### Fase 2 — Rede de segurança de engenharia (2–4 semanas)

- Configurar CI com GitHub Actions (lint + test obrigatórios antes de merge).
- Adicionar testes de validação para `netlify/functions/send.js` (mockando `nodemailer`).
- Corrigir o script `test:coverage` e estabelecer uma meta mínima de cobertura visível.
- Adicionar teste de integridade cruzada entre as três fontes de dados de "Tipo de Ordem".

### Fase 3 — Redução de dívida técnica estrutural (1–2 meses)

- Introduzir slugs estáveis para desacoplar o texto de exibição da chave de lookup de tipos de ordem.
- Resolver a dependência circular `app.js`/`sidebar.js`/`restore.js`.
- Criar `README.md` de onboarding humano e revisar `AGENTS.md` com os pequenos ajustes de clareza identificados.
- Mover `dados_projeto/` para fora do repositório de código.

### Fase 4 — Evolução de médio/longo prazo (contínuo)

- Avaliar um pequeno painel/endpoint de configuração para gerenciar a lista de técnicos/municípios sem exigir deploy de código.
- Avaliar adoção incremental de JSDoc + `tsc --checkJs` (sem migrar para TypeScript completo) para checagem estática de tipos, mitigando parte do risco do Achado M1.
- Planejar migração do Tailwind CSS v3 → v4 quando houver janela de manutenção dedicada.
- Revisitar a arquitetura de estado global caso o escopo do formulário cresça substancialmente (mais seções, mais colaboração simultânea).

---

## 19. Conclusão

**Maiores problemas:** os riscos mais sérios deste projeto não estão na qualidade geral do código — que é boa — mas concentrados em três pontos específicos e corrigíveis: (1) uma dependência de terceiros (`nodemailer`) com vulnerabilidades de segurança ativas e publicamente conhecidas; (2) um endpoint de backend público, sem nenhuma camada de autenticação, verificação de origem ou limite de requisições, que processa e envia e-mails reais; e (3) dados pessoais reais de funcionários (nomes completos, placas de veículo) expostos em um repositório de código publicamente acessível. Nenhum desses três problemas exige uma reescrita do projeto — são correções pontuais e bem delimitadas.

**Pontos fortes:** a disciplina de testes unitários do frontend é genuinamente impressionante para um projeto deste porte — 527 testes passando, cobrindo praticamente todos os 24 módulos de `scripts/`. O lint está 100% limpo. A modularidade é boa, com padrões de tabela de despacho (Strategy pattern) bem aplicados para evitar `if/else` repetitivos, e um verdadeiro cuidado com DRY nos dados de domínio (`EQUIPMENT_KEYS`, `retorno-templates.js` declarativo). A documentação técnica em `AGENTS.md` é excepcionalmente detalhada e revela uma equipe que já reconhece e documenta ativamente as próprias armadilhas conhecidas do sistema — um sinal maduro de engenharia, mesmo quando a correção definitiva ainda não foi implementada.

**O que mais merece atenção:** a combinação dos três achados críticos de segurança (dependência vulnerável + endpoint desprotegido + dados pessoais expostos) forma uma cadeia de risco que deve ser tratada com prioridade máxima, independentemente de qualquer outra melhoria de arquitetura ou performance. Em segundo lugar, a ausência total de CI e de testes no backend significa que a qualidade observada hoje depende inteiramente da disciplina manual de quem está commitando — não há uma garantia estrutural de que isso continuará assim conforme o projeto ou a equipe crescerem.

**Nível de maturidade do projeto:** este é um projeto em estágio de **MVP maduro e ativamente mantido** — não um protótipo descartável. Isso é evidenciado pelo volume de testes, pela disciplina de lint/formatação, pelo uso de hooks de pre-commit, PWA funcional com service worker versionado, e por um histórico de commits que mostra correções reativas a problemas reais identificados (`fix: corrigir 9 itens criticos da analise do projeto`). Ao mesmo tempo, práticas fundamentais de um processo de engenharia "pronto para produção séria" — CI obrigatório, gestão segura de dados de configuração/pessoais, hardening de endpoint público — ainda não foram implementadas.

**Segue padrões profissionais?** Em parte, sim: a estrutura de módulos, a suíte de testes, o uso de ESLint/Prettier/Husky e a documentação de convenções técnicas (`AGENTS.md`) são práticas de nível profissional. Porém, a ausência de CI, a falta de testes no componente mais sensível a segurança, e a exposição de dados pessoais em repositório público são desvios claros de práticas profissionais padrão de engenharia de software, especialmente para uma aplicação que lida com dados de uma operação real (ordens de serviço de energia elétrica).

**O que impediria este projeto de ser usado em produção hoje, com segurança:** especificamente, os Achados **S1** (dependência vulnerável), **S2** (endpoint público sem proteção) e **S5** (dados pessoais expostos publicamente) são, isoladamente, motivos suficientes para não considerar este projeto "pronto para produção sensível" no seu estado atual — não porque a lógica de negócio esteja incorreta (ela parece sólida e bem testada), mas porque a superfície de segurança tem lacunas concretas e verificáveis que qualquer auditoria de segurança formal apontaria como bloqueantes. Corrigidos esses três pontos — o que é um esforço relativamente contido, na ordem de dias a poucas semanas — o projeto estaria em uma posição consideravelmente mais sólida para uso continuado em produção.

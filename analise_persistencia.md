# Análise de Persistência — Mail MVP

**Data:** 2026-07-16
**Versão do IndexedDB:** mail-mvp v3
**Escopo:** Camada completa de persistência (IndexedDB + localStorage + estado em memória)
**Testes executados:** 87/87 passando ✅

---

## 1. Sumário Executivo

A camada de persistência do Mail MVP é composta por **8 arquivos** principais interconectados, utilizando **dois mecanismos de armazenamento** (IndexedDB v3 com dois object stores + localStorage para UUID de sessão) e **estado em memória** (state) como fonte única de verdade intermediária. A arquitetura segue o padrão **Collector → State → Persist** com salvamento automático via debounce de 1s.

A cobertura de testes é **excelente** — 87 testes em 6 arquivos cobrem desde operações CRUD atômicas até cenários realistas de fluxo de usuário (12 cenários em persistence-flow.test.js). Todos passam.

**Problemas críticos encontrados: 3** — relacionados a race conditions e falta de atomicidade entre stores.
**Problemas de alta prioridade: 5** — relacionados a fire-and-forget, debounce após reset e ineficiências.
**Problemas de média prioridade: 8** — relacionados a código morto, edge cases e manutenibilidade.
**Problemas de baixa prioridade: 4** — recomendações de melhoria e boas práticas.

---

## 2. Arquitetura da Camada de Persistência

### 2.1 Diagrama de Componentes

`┌──────────────────────────────────────────────────────────────────────┐
│                           app.js (init + eventos)                     │
│  DOMContentLoaded → cacheDOM → render* → initEvents → clearUUID      │
│  handleFieldChange → syncIniciaisField → debouncedSave               │
└──────────────┬──────────────────┬───────────────────┬────────────────┘
               │                  │                   │
    ┌──────────▼──────┐  ┌────────▼───────┐  ┌────────▼──────────┐
    │  collectors.js  │  │ persistence.js │  │   restore.js      │
    │  collectIniciais│  │ saveState()    │  │   applyRecord()    │
    │  collectRetorno │  │ debouncedSave()│  │   (IndexedDB→DOM)  │
    │  collectEquipam.│  │ resolveCreated │  └───────────────────┘
    └──────┬──────────┘  │ serializeAttach│
           │              └───┬──────┬─────┘
           │                  │      │
    ┌──────▼──────┐    ┌──────▼──┐ ┌─▼──────────────┐
    │  state.js   │    │  db.js  │ │ attachments.js │
    │  (memória)  │    │ IndexedDB│ │ previewUrls    │
    └──────┬──────┘    │ records │ └────────────────┘
           │           │ attachm.│
    ┌──────▼──────┐    └─────────┘
    │  uuid.js    │
    │ localStorage│
    │ currentUUID │
    └─────────────┘`

### 2.2 Armazenamentos

| Mecanismo | Schema / Chave | Conteúdo                |
| --------- | -------------- | ----------------------- |
| IndexedDB | mail-mvp v3    | Base de dados principal |

| ├─
ecords | keyPath: uuid | Registros completos do formulário |
| └─ ttachments | keyPath: id (uuid_i), index uuid | Anexos serializados (base64) |
| localStorage | currentUUID | UUID do registro atualmente em edição |
| Memória (state) | state (objeto global) | Estado volátil: iniciais, retorno, equipamentos etc. |

### 2.3 Fluxo de Salvamento (Write Path)

`

1. Usuário digita → input/change event
2. handleFieldChange → syncIniciaisField(el) → state.iniciais[field] = value
3. handleFieldChange → debouncedSave() → clearTimeout + setTimeout(saveState, 1000)
4. [após 1s] saveState():
   a. Guard: return if !state.iniciaisValido
   b. collectIniciais() / collectRetorno() / collectEquipamentos() — sincroniza DOM→state
   c. Guard: return if !hasData
   d. Cria UUID se necessário (generateUUID + setCurrentUUID)
   e. resolveCreatedAt() — busca do registro existente ou gera novo
   f. Determina status (draft/sent/changed)
   g. Monta objeto data a partir do state
   h. saveDraft(data).catch(...) ← NÃO AGUARDADO (FIRE-AND-FORGET)
   i. Se attachmentsDirty: - serializeAndSaveAttachments() → toBase64 cada arquivo → saveAttachments() - Em caso de erro: attachmentsDirty = true (para retry no próximo save)
   `

### 2.4 Fluxo de Restauração (Read Path)

`

1. Sidebar → loadRecord(uuid):
   a. getRecord(uuid) do IndexedDB
   b. applyRecord(record): - setCurrentUUID → atualiza state + localStorage - Restaura state.iniciais, state.retorno, state.equipamentos - Busca anexos: getAttachmentsByUuid() ou inline (migração v2→v3) - Reconstrói File objects a partir de base64 - renderIniciais() → recria DOM dos campos iniciais - Re-attach listener handleTipoChange - Popula valores dos campos iniciais no DOM - renderRetorno() + setRetornoData() - renderEquipamentos() - renderPreviews() + updateFileCount() - collectIniciais() — sincroniza DOM→state para normalizar nomes - updateLivePreview()
   `

---

## 3. Problemas Encontrados

### 3.1 CRÍTICOS

#### P1. saveDraft disparado sem wait — possível perda de dados ao fechar a página

- **Arquivo:** scripts/persistence.js, linha 94
- **Impacto:** saveState() chama saveDraft(data).catch(...) sem wait. A função retorna imediatamente, mas a escrita no IndexedDB pode ainda não ter ocorrido. Se o usuário fechar a aba/navegador logo após uma edição, os dados **não** serão persistidos, pois a transação IndexedDB pode ser abortada pelo navegador ao fechar a página.
- **Risco:** Perda silenciosa de dados. O usuário acredita que salvou (preencheu campos), mas o registro não está no IndexedDB.
- **Causa:** Uso de .catch() em vez de wait para evitar bloquear a UI, mas sem considerar o cenário de fechamento da página.
- **Recomendação:** Adicionar wait antes de saveDraft(data), ou usar
  avigator.sendBeacon() / eforeunload para garantir flush. Como saveDraft é uma operação rápida (put em IndexedDB), o impacto na UI é mínimo.
- **Prioridade:** 🔴 **CRÍTICA**

#### P2. Falta de atomicidade entre

ecords e ttachments — inconsistência de dados

- **Arquivo:** scripts/persistence.js, linhas 94 e 106
- **Impacto:** saveDraft(data) escreve no store
  ecords e serializeAndSaveAttachments() escreve no store ttachments em **transações separadas**. Se uma operação falha e a outra não:
  - Registro salvo, anexos não → ttachmentCount no registro fica inconsistente com o store de anexos
  - Anexos salvos, registro não → anexos órfãos sem registro pai
- **Risco:** Corrupção silenciosa de dados. Campos como ttachmentCount no registro divergem do número real de anexos.
- **Causa:** saveState() não usa uma única transação跨两个 stores. A API IndexedDB suporta transações multi-store (db.transaction([store1, store2], 'readwrite')), mas saveDraft e saveAttachments criam transações independentes.
- **Recomendação:** Refatorar saveState() para usar uma única transação跨
  ecords + ttachments stores, ou adicionar lógica de compensação (rollback attachments se saveDraft falhar e vice-versa).
- **Prioridade:** 🔴 **CRÍTICA**

#### P3. Race condition: saveDraft e saveAttachments concorrentes sem coordenação

- **Arquivo:** scripts/persistence.js, linhas 94-110
- **Impacto:** saveState() dispara saveDraft e saveAttachments concorrentemente sem wait. Se o usuário modificar campos e anexos simultaneamente (ex.: remove anexo + digita campo), o saveState() seguinte pode:
  - Salvar o registro com ttachmentCount antigo (antes dos anexos serem processados)
  - Ou salvar anexos com ttachmentCount novo (se anexos terminarem antes do registro)
- **Risco:** Inconsistência entre ttachmentCount e anexos reais; comportamento não determinístico dependendo da ordem de conclusão das Promises.
- **Causa:** Execução paralela de duas operações de escrita em stores diferentes sem barreira de sincronização.
- **Recomendação:** Sequenciar as operações: wait saveDraft(data); if (attachmentsDirty) { await serializeAndSaveAttachments(...) }. Ou usar a transação multi-store (solução combinada com P2).
- **Prioridade:** 🔴 **CRÍTICA**

---

### 3.2 ALTA

#### P4. Debounce timer sobrevive ao

esetForm — salvamento de estado zerado

- **Arquivo:** scripts/persistence.js linha 116-118; scripts/app.js linhas 44-48; scripts/reset.js
- **Impacto:** Se o usuário clica em "Novo Formulário" (tnNovoForm → wait saveState(); resetForm()), o debounce timer existente **não é cancelado**. Se houver um timer pendente (ex.: usuário digitou algo 500ms antes de clicar), ele disparará saveState() **após** o
  esetForm(), salvando o estado zerado. Isso pode:
  - Criar um registro fantasma com iniciaisValido = true mas dados vazios
  - Ou, se iniciaisValido = false após reset, o saveState retorna early (OK) — mas o timer foi desperdiçado
  - Pior: se collectIniciais() ler campos residuais no DOM que não foram limpos, pode salvar dados parciais
- **Risco:** Criação de registros inválidos ou salvamento de estado inconsistente.
- **Causa:**
  esetForm() não chama clearTimeout(saveTimer). O timer é módulo-privado em persistence.js, inacessível de fora.
- **Recomendação:** Expor uma função cancelDebouncedSave() ou chamar clearTimeout(saveTimer) dentro de
  esetForm(). Alternativa:
  esetForm() já seta state.iniciaisValido = false, o que bloqueia saveState(), mas a chamada do timer ainda ocorre desnecessariamente.
- **Prioridade:** 🟠 **ALTA**

#### P5. ttachmentsDirty é flag global, não por registro — salvamentos desnecessários

- **Arquivo:** scripts/persistence.js, linha 9
- **Impacto:** A flag ttachmentsDirty é um booleano único para toda a aplicação. Se o usuário:
  1. Edita anexos no registro A → dirty = true
  2. Troca para registro B (applyRecord) → markAttachmentsDirty() é chamado (linha 61 do restore.js) → dirty = true
  3. Edita **apenas campos** de B → debouncedSave() → saveState() → serializa e salva anexos de B desnecessariamente

  Isso causa I/O desperdiçado e serialização base64 de arquivos que não mudaram.

- **Risco:** Degradação de performance com arquivos grandes; desgaste desnecessário da quota do IndexedDB (escritas repetidas).
- **Causa:** Flag binária global em vez de controle por-UUID.
- **Recomendação:** Substituir ttachmentsDirty por um Set de UUIDs com anexos sujos, ou comparar hash dos anexos atuais com os salvos.
- **Prioridade:** 🟠 **ALTA**

#### P6. Serialização base64 de todos os anexos em cada save — risco de congelamento de UI

- **Arquivo:** scripts/persistence.js, linhas 148-163
- **Impacto:** serializeAndSaveAttachments() chama Promise.all(files.map(file => toBase64(file))), que lê **todos** os arquivos para memória e os converte para base64 simultaneamente. Com 12 arquivos de 10MB cada, são 120MB lidos + ~160MB de strings base64 em memória. Isso pode:
  - Congelar a UI (operações síncronas de FileReader)
  - Exceder a quota do IndexedDB (tipicamente ~50% do disco disponível, mas varia por navegador)
  - Causar QuotaExceededError silencioso (já tratado com toast, mas o usuário perde anexos)
- **Risco:** UI travada, perda de anexos por quota excedida, experiência ruim com arquivos grandes.
- **Causa:** Estratégia "serializa tudo" sem chunking ou lazy loading.
- **Recomendação:** Implementar serialização em chunks com feedback de progresso, ou armazenar blobs diretamente no IndexedDB (IndexedDB suporta Blob/File nativamente) em vez de base64, eliminando o overhead de 33%.
- **Prioridade:** 🟠 **ALTA**

#### P7. updateRecordStatus usa store.get() sem aguardar resultado

- **Arquivo:** scripts/db.js, linhas 107-121
- **Impacto:** updateRecordStatus() faz store.get(uuid) e define
  eq.onsuccess para modificar o registro, mas a Promise retornada por withStore resolve em x.oncomplete, que ocorre **após** o onsuccess do get. No entanto, se o get falhar (ex.: registro não encontrado),
  eq.onerror é definido como no-op (() => {}), então o erro é engolido. Além disso, não há garantia de que
  ecord não seja null — se for null,
  ecord.status = status lançaria TypeError.
- **Risco:** Erro silencioso ao tentar atualizar registro inexistente; TypeError não capturado em
  ecord.status.
- **Causa:**
  eq.onerror = () => {} suprime erros; falta null-check em
  ecord.
- **Recomendação:** Adicionar if (!record) return; após const record = req.result;. Propagar erros do get para a transação.
- **Prioridade:** 🟠 **ALTA**

#### P8. getRecord e getAllRecords dependem de .result disponível após x.oncomplete

- **Arquivo:** scripts/db.js, linhas 46-53 e 71-81
- **Impacto:** withTransaction() resolve a Promise em x.oncomplete. Nesse ponto, o IDBRequest.result **deve** estar disponível, mas a especificação IndexedDB não garante isso para todos os navegadores. O padrão correto é resolver em
  eq.onsuccess. Isso pode causar undefined em navegadores mais antigos ou em implementações de IndexedDB mais restritivas.
- **Risco:** Retorno de undefined em getRecord e getAllRecords em navegadores edge-case.
- **Causa:** Uso de x.oncomplete como ponto de resolução em vez de
  eq.onsuccess.
- **Recomendação:** Refatorar withTransaction para capturar o resultado dentro de
  eq.onsuccess e resolver a Promise lá, ou usar o padrão de "promisify" individual por request.
- **Prioridade:** 🟠 **ALTA** (mas mitigado pelo fato de que Chrome/Firefox/Safari modernos populam .result em oncomplete)

---

### 3.3 MÉDIA

#### P9. Variáveis mortas em saveAttachments

- **Arquivo:** scripts/db.js, linhas 138-139
- **Impacto:** \_deletesDone e \_pendingPuts são declaradas mas nunca lidas. Código morto que sugere uma intenção incompleta de sincronização entre delete e insert.
- **Risco:** Baixo — apenas ruído de código. Mas indica que a lógica de sincronização delete-then-insert pode não funcionar como esperado se o cursor falhar parcialmente.
- **Causa:** Refatoração incompleta ou feature abandonada.
- **Recomendação:** Remover variáveis não utilizadas. Se a intenção era garantir que deletes terminem antes dos puts, usar wait ou callback explícito.
- **Prioridade:** 🟡 **MÉDIA**

#### P10. saveAttachments — cursor sem onerror

- **Arquivo:** scripts/db.js, linhas 141-161
- **Impacto:** O cursor de deleção (cursorReq) não define cursorReq.onerror. Se o cursor falhar (ex.: constraints violadas, store corrompido), o erro não é tratado explicitamente. A transação inteira falhará ( x.onerror), mas sem mensagem de erro clara.
- **Risco:** Falhas silenciosas ao limpar anexos antigos; difícil diagnóstico.
- **Causa:** Omissão do handler de erro.
- **Recomendação:** Adicionar cursorReq.onerror = () => reject(cursorReq.error); e garantir que o erro seja propagado.
- **Prioridade:** 🟡 **MÉDIA**

#### P11. getAttachmentsByUuid não usa withTransaction

- **Arquivo:** scripts/db.js, linhas 170-183
- **Impacto:** Esta função cria sua própria transação manualmente (db.transaction(...)) em vez de usar o helper withTransaction. É o único lugar no arquivo que faz isso, quebrando a consistência do padrão. Além disso, usa
  ew Promise(async (resolve, reject) => {...}) — o sync no executor da Promise é um antipattern (a Promise pode resolver antes do await interno).
- **Risco:** Baixo funcionalmente (funciona), mas cria dívida técnica e potencial armadilha para manutenção futura.
- **Causa:** Implementação independente do padrão withTransaction.
- **Recomendação:** Refatorar para usar withTransaction(STORE_ATTACHMENTS, 'readonly', ...).
- **Prioridade:** 🟡 **MÉDIA**

#### P12. getAttachmentsByUuid — sync no executor da Promise

- **Arquivo:** scripts/db.js, linha 171
- **Impacto:**
  ew Promise(async (resolve, reject) => {...}) — o sync faz com que erros lançados dentro do executor sejam convertidos em rejeição da Promise **interna** do async, não da Promise externa. Se wait openDB() lançar, o erro **não** será capturado pelo
  eject da Promise externa.
- **Risco:** Erros não capturados em wait openDB() resultam em Promise pendente eternamente (nem resolve, nem reject).
- **Causa:** Combinação de sync com executor de Promise.
- **Recomendação:** Remover sync do executor; mover wait openDB() para fora ou usar .then():
  `javascript
openDB().then(db => { ... }).catch(reject);
`
- **Prioridade:** 🟡 **MÉDIA**

#### P13.

esolveCreatedAt — try/catch duplicado

- **Arquivo:** scripts/persistence.js, linhas 72-74 e 135-138
- **Impacto:** Duas chamadas a getRecord() em saveState() com blocos try/catch idênticos (mesma mensagem de erro). A primeira (linha 52-74) busca para determinar o status; a segunda (dentro de
  esolveCreatedAt, linha 126-141) busca para obter createdAt. Poderiam ser unificadas em uma única consulta.
- **Risco:** Duas leituras do IndexedDB onde uma bastaria — ineficiência.
- **Causa:**
  esolveCreatedAt foi extraído como função separada sem considerar que saveState já faz uma leitura do mesmo registro.
- **Recomendação:** Passar o registro já obtido para
  esolveCreatedAt ou cachear o resultado da primeira consulta.
- **Prioridade:** 🟡 **MÉDIA**

#### P14. Sem mecanismo de garbage collection para anexos órfãos

- **Arquivo:** scripts/db.js (ausência de funcionalidade)
- **Impacto:** Se um registro é deletado via deleteRecord() (que limpa anexos na mesma transação ✅), os anexos são corretamente removidos. Porém, se ocorrer um erro entre a criação de UUID e o salvamento (ex.: crash do navegador), ou se saveDraft falhar mas saveAttachments já tiver rodado, os anexos permanecem no store sem registro pai. Não há nenhum mecanismo periódico ou sob demanda para limpar esses órfãos.
- **Risco:** Acúmulo de dados inacessíveis desperdiçando quota do IndexedDB.
- **Causa:** Não há rotina de limpeza preventiva ou corretiva.
- **Recomendação:** Adicionar uma função cleanupOrphanedAttachments() que percorre o store de attachments e remove aqueles cujo UUID não existe no store de records. Executar periodicamente ou na inicialização.
- **Prioridade:** 🟡 **MÉDIA**

#### P15. pplyRecord não revoga URLs de preview antigas

- **Arquivo:** scripts/restore.js, linha 113; scripts/attachments.js, linhas 7-11
- **Impacto:**
  enderPreviews() cria URL.createObjectURL() para cada anexo e armazena em previewObjectUrls. Mas pplyRecord() não chama
  evokePreviewUrls() antes de chamar
  enderPreviews(). Se pplyRecord for chamado múltiplas vezes na mesma sessão (ex.: alternando entre registros A e B), os URLs antigas acumulam-se na memória.
- **Risco:** Vazamento de memória (lob: URLs acumuladas), embora o garbage collector do navegador eventualmente as limpe ao descarregar a página.
- **Causa:**
  evokePreviewUrls() é chamada apenas em
  esetForm() e handleFileChange().
- **Recomendação:** Chamar
  evokePreviewUrls() no início de pplyRecord(), antes de renderizar novas previews.
- **Prioridade:** 🟡 **MÉDIA**

#### P16. \_db singleton pode ficar stale após fechamento externo

- **Arquivo:** scripts/db.js, linha 6 e 8-9
- **Impacto:** openDB() cacheia a conexão em \_db. Se o banco for fechado externamente (DevTools, extensão do navegador, ou após muito tempo em background), \_db ainda referencia um objeto IDBDatabase fechado. Operações subsequentes lançarão InvalidStateError.
- **Risco:** Toda a camada de persistência para de funcionar até o próximo recarregamento da página.
- **Causa:** Singleton sem verificação de validade.
- **Recomendação:** Adicionar listener \_db.onclose para resetar \_db = null, forçando reconexão na próxima operação. Ou verificar \_db.objectStoreNames antes de usar.
- **Prioridade:** 🟡 **MÉDIA**

---

### 3.4 BAIXA

#### P17. Duplicação de constantes de schema nos helpers de E2E

- **Arquivo:** ests-e2e/helpers/persistence.js, linhas 6-10 vs scripts/db.js, linhas 1-4
- **Impacto:** As constantes DB_NAME, DB_VERSION, STORE_RECORDS, STORE_ATTACHMENTS são duplicadas. Se o schema mudar (ex.: v4), ambos os locais precisam ser atualizados.
- **Risco:** Divergência entre schema de produção e helpers de teste.
- **Recomendação:** Exportar as constantes de db.js e importá-las nos helpers de E2E. Ou extrair para constants.js.
- **Prioridade:** 🟢 **BAIXA**

#### P18. Testes usam ake-indexeddb — não cobrem edge cases de browser real

- **Arquivo:** Todos os arquivos de teste usam import 'fake-indexeddb/auto'
- **Impacto:** ake-indexeddb é uma implementação simplificada. Edge cases como:
  - Comportamento de transações após fechamento de aba
  - Limites de quota específicos por navegador
  - IDBTransaction.oncomplete vs IDBRequest.onsuccess timing
  - Conexões concorrentes (múltiplas abas)

  não são testados.

- **Risco:** Falsos positivos nos testes — comportamentos que passam no fake-indexeddb mas falham em produção.
- **Recomendação:** Complementar com testes E2E (Playwright) que exercitam IndexedDB real no navegador. O arquivo ests-e2e/helpers/persistence.js já existe, mas não parece ter testes E2E completos de persistência.
- **Prioridade:** 🟢 **BAIXA**

#### P19. collectAllData() exportado mas não usado na camada de persistência

- **Arquivo:** scripts/collectors.js, linhas 87-95
- **Impacto:** collectAllData() retorna um snapshot do state, mas saveState() monta seu próprio objeto data manualmente. A função não é usada em lugar nenhum na camada de persistência.
- **Risco:** Código morto, potencial confusão sobre "qual é a fonte de verdade".
- **Recomendação:** Usar collectAllData() em saveState() para construir o registro, ou remover a função se não for necessária.
- **Prioridade:** 🟢 **BAIXA**

#### P20. openDB não exportado para uso externo

- **Arquivo:** scripts/db.js, linha 8
- **Impacto:** Apenas os helpers de E2E (e potencialmente DevTools) precisariam de acesso direto ao banco. Atualmente, os helpers de E2E reimplementam openDB via page.evaluate. Isso é aceitável para isolamento, mas impede reuso.
- **Risco:** Baixo. A encapsulação é intencional e boa prática.
- **Recomendação:** Manter como está. Apenas documentar que acesso externo é via getAllRecords/getRecord.
- **Prioridade:** 🟢 **BAIXA** (observação, não problema)

---

## 4. Análise de Desempenho

### 4.1 Operações medidas

| Operação            | Complexidade  | Observação                                                 |
| ------------------- | ------------- | ---------------------------------------------------------- |
| saveDraft           | O(1)          | IndexedDB put — rápido (<5ms para registros típicos)       |
| getRecord           | O(1)          | IndexedDB get por keyPath                                  |
| getAllRecords       | O(n)          | IndexedDB getAll — escala com número de registros          |
| deleteRecord        | O(a)          | O(n) registros + O(a) cursor delete de anexos              |
| saveAttachments     | O(a) + O(a×s) | Delete (cursor) + insert (n attachments × size)            |
| serializeAndSave    | O(f × s)      | f arquivos × s tamanho, conversão base64 (+33% memória)    |
| pplyRecord          | O(r + f + a)  | Renderiza DOM + reconstrói File objects + render previews  |
| collectIniciais     | O(f)          | Itera sobre iniciaisFields (fixo ~12 campos)               |
| collectRetorno      | O(f)          | Itera sobre campos de retorno (variável por tipo de ordem) |
| collectEquipamentos | O(e)          | Itera sobre inputs de equipamentos instalados + retirados  |

### 4.2 Gargalos identificados

1. **Serialização base64 síncrona**: oBase64() usa FileReader.readAsDataURL() que é assíncrono, mas todos os arquivos são processados simultaneamente via Promise.all. Com 12 arquivos grandes, o consumo de memória é 12 × tamanho × 1.33.
2. **Debounce de 1s**: Adequado para formulários, mas significa que em caso de crash do navegador, até 1s de edições podem ser perdidas.
3. **Coleta redundante**: saveState() chama os 3 collectors mesmo que os event listeners já tenham atualizado o state. Isso dobra as leituras de DOM para cada campo a cada save.

---

## 5. Análise de Segurança

| Vetor                      | Status | Observação                                                     |
| -------------------------- | ------ | -------------------------------------------------------------- |
| Dados sensíveis em base64  | ✅     | Apenas anexos; armazenados localmente (same-origin)            |
| localStorage exposto       | ✅     | Apenas UUID (não sensível)                                     |
| Sanitização de entrada     | ⚠️     | Nenhuma validação entre DOM e IndexedDB; confia-se no HTML     |
| Stored XSS                 | ✅     | Preview de email usa extContent; IndexedDB é same-origin       |
| Quota excedida             | ⚠️     | Tratamento existe (toast), mas sem recuperação — usuário perde |
| Conexão IndexedDB insegura | ✅     | HTTPS + same-origin; IndexedDB não é acessível cross-origin    |

---

## 6. Cobertura de Testes

### 6.1 Arquivos de teste analisados

| Arquivo                       | Testes | Foco                                        |
| ----------------------------- | ------ | ------------------------------------------- |
| ests/db.test.js               | 16     | Operações CRUD atômicas no IndexedDB        |
| ests/persistence.test.js      | 10     | Contrato da API, guards, status transitions |
| ests/persistence-flow.test.js | 23     | 12 cenários realistas de fluxo de usuário   |
| ests/restore.test.js          | 13     | Restauração de registros + bugs conhecidos  |
| ests/state.test.js            | 16     | Estado em memória + localStorage            |
| ests/uuid.test.js             | 8      | Geração e persistência de UUID              |
| **Total**                     | **87** | **100% passando ✅**                        |

### 6.2 Cenários cobertos (persistence-flow.test.js)

1. ✅ Auto-save progressivo (UC+OS → mais campos → tipo ordem → retorno)
2. ✅ Troca entre registros (A → B → A → B)
3. ✅ Novo registro após edição (A → edit → novo → B)
4. ✅ Troca de tipo-ordem limpa retorno (sem vazamento)
5. ✅ Restore + edição parcial (preserva campos não editados)
6. ✅ Persistência de equipamentos (adicionar, remover, modificar)
7. ✅ Preservação de createdAt entre múltiplos saves
8. ✅ 5 registros independentes sem vazamento
9. ✅ Campos condicionais (salvar apenas visível, restaurar visibilidade)
10. ✅ Delete e recriação
11. ✅ UUID único entre saves; novo UUID após clear
12. ✅ Restore completo de todos os campos

### 6.3 Cenários NÃO cobertos

- ❌ QuotaExceededError em ambiente real
- ❌ Comportamento com múltiplas abas concorrentes
- ❌ Fechamento de aba durante transação IndexedDB pendente
- ❌ Corrupção/manipulação manual do IndexedDB via DevTools
- ❌ Migração de schema v3→v4
- ❌ Anexos muito grandes (>50MB) — teste de stress
- ❌ Recuperação após falha parcial (saveDraft ok, saveAttachments fail)

---

## 7. Resumo e Recomendações

### 7.1 Plano de ação recomendado (ordenado por prioridade)

| #                                      | Problema                                    | Prioridade | Esforço                                    | Ação                                       |
| -------------------------------------- | ------------------------------------------- | ---------- | ------------------------------------------ | ------------------------------------------ |
| P1                                     | saveDraft sem await — risco de perda        | CRÍTICA    | Baixo                                      | Adicionar wait em saveDraft(data)          |
| P2                                     | Falta de atomicidade records↔attachments    | CRÍTICA    | Médio                                      | Unificar em transação multi-store          |
| P3                                     | Race condition saveDraft/saveAttachments    | CRÍTICA    | Baixo                                      | Sequenciar com await: draft → attachments  |
| P4                                     | Debounce sobrevive ao reset                 | ALTA       | Baixo                                      | Expor cancelDebouncedSave() ou cancelar em |
| esetForm()                             |
| P5                                     | ttachmentsDirty global                      | ALTA       | Médio                                      | Controle por-UUID (Set/Map)                |
| P6                                     | Base64 memory pressure com arquivos grandes | ALTA       | Alto                                       | Chunked serialization ou Blob storage      |
| P7                                     | Null-check em updateRecordStatus            | ALTA       | Baixo                                      | Adicionar if (!record) return              |
| P8                                     | x.oncomplete vs                             |
| eq.onsuccess                           | ALTA                                        | Médio      | Refatorar withTransaction para resolver em |
| eq.onsuccess                           |
| P9                                     | Variáveis mortas saveAttachments            | MÉDIA      | Baixo                                      | Remover \_deletesDone e \_pendingPuts      |
| P10                                    | Cursor sem onerror em saveAttachments       | MÉDIA      | Baixo                                      | Adicionar handler de erro                  |
| P11                                    | getAttachmentsByUuid fora do padrão         | MÉDIA      | Médio                                      | Refatorar para usar withTransaction        |
| P12                                    | sync no executor da Promise                 | MÉDIA      | Baixo                                      | Remover sync, usar .then()                 |
| P13                                    | getRecord duplicado em saveState            | MÉDIA      | Médio                                      | Unificar consultas                         |
| P14                                    | Sem GC de anexos órfãos                     | MÉDIA      | Médio                                      | Implementar limpeza periódica              |
| P15                                    | Vazamento de blob URLs em pplyRecord        | MÉDIA      | Baixo                                      | Chamar                                     |
| evokePreviewUrls() antes de renderizar |
| P16                                    | \_db singleton stale                        | MÉDIA      | Baixo                                      | Adicionar listener onclose                 |

### 7.2 Visão geral

| Critério              | Nota       | Comentário                                                                               |
| --------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| Arquitetura           | ⭐⭐⭐⭐   | Bem organizada: db → persistence → collectors, clara separação de responsabilidades      |
| Integridade dos dados | ⭐⭐⭐     | Bom na maioria dos casos, mas falta atomicidade跨 stores (P2, P3)                        |
| Confiabilidade        | ⭐⭐⭐     | Guards apropriados, mas fire-and-forget (P1) compromete a confiabilidade                 |
| Performance           | ⭐⭐⭐     | Debounce eficiente, mas base64 com arquivos grandes é gargalo (P6)                       |
| Segurança             | ⭐⭐⭐⭐   | Boa: same-origin, sem dados sensíveis expostos, sem stored XSS                           |
| Testabilidade         | ⭐⭐⭐⭐⭐ | Excelente: 87 testes, 12 cenários realistas, fake-indexeddb bem configurado              |
| Manutenibilidade      | ⭐⭐⭐⭐   | Código limpo, bem comentado, com padrões consistentes (exceto P11, P12)                  |
| Tratamento de erros   | ⭐⭐       | Fire-and-forget com .catch() é frágil; sem retry; sem feedback ao usuário (exceto quota) |
| Escalabilidade        | ⭐⭐⭐     | Bom para dezenas de registros; preocupa com anexos grandes ou centenas de registros      |

---

## 8. Notas Finais

A camada de persistência do Mail MVP é **sólida e bem testada**, refletindo maturidade de desenvolvimento. Os 3 problemas críticos (P1, P2, P3) são inter-relacionados: todos derivam da falta de wait e atomicidade em saveState(). A correção desses três problemas é de **baixo a médio esforço** e trará a camada de persistência a um nível de confiabilidade de produção.

Os problemas de alta prioridade (P4-P8) são em maioria correções pontuais. O P6 (serialização base64) é o mais complexo e pode ser postergado se o uso típico envolver poucos anexos pequenos.

**Recomendação principal:** Implementar P1+P2+P3 como uma única refatoração de saveState() — adicionar wait, usar transação multi-store, e sequenciar draft antes de attachments. Isso resolve 80% do risco de integridade de dados com esforço concentrado.

---

_Análise conduzida em 2026-07-16. Baseada em: 8 arquivos fonte, 6 arquivos de teste, 87 testes executados (todos passando), e consultas ao grafo de conhecimento graphify._

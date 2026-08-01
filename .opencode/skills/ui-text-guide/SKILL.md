---
name: ui-text-guide
description: Use quando o usuário pedir para mudar texto visível na UI — labels, placeholders, mensagens de erro, modais, botões, títulos, estados vazios. Sintomas: 'mudar o texto de...', 'alterar o label...', 'trocar a mensagem...'. Para template de email, prefira email-composition-guide.
---

# Guia de Alteração de Textos da UI

## Quando usar

Use esta skill quando:

- O usuário pedir para "mudar o texto de...", "alterar o label...", "trocar a mensagem..."
- O usuário quiser renomear um campo, botão, título, placeholder
- A tarefa envolver texto visível em qualquer parte da interface
- O usuário mencionar "texto", "mensagem", "label", "placeholder", "erro", "modal", "confirmação", "botão"

## Estrutura

O projeto **não tem i18n nem constantes de texto** — todo texto é hardcoded inline nos arquivos. Esta skill é um mapa de referência organizado por **tipo de texto**.

| #   | Seção                         | Exemplos                                          |
| --- | ----------------------------- | ------------------------------------------------- |
| 1   | Labels de campo               | Líder, UC, OS, Descrição do Serviço, MEDIDOR      |
| 2   | Opções de SELECT              | Técnicos, municípios, placas, SIM/NAO, situações  |
| 3   | Títulos e seções              | Headings, sidebar, PWA name, subtítulos           |
| 4   | Mensagens de erro/validação   | UC inválida, campo obrigatório, offline           |
| 5   | Modais e confirmações         | Reenvio, exclusão, duplicate, GPS                 |
| 6   | Botões e ações                | Enviar, Editar, Excluir, status (Rascunho)        |
| 7   | Textos de email               | Subject, templates, headers                       |
| 8   | Placeholders e estados vazios | Selecione, Nenhum registro, Coletando coordenadas |

## Checklist geral

### Antes de mudar qualquer texto

- [ ] Identificar o tipo de texto (label? erro? modal?)
- [ ] Consultar a seção correspondente abaixo para localizar o arquivo exato
- [ ] Verificar se o mesmo texto aparece em múltiplos lugares (ex: header de equipamento no HTML E no email)

### Durante

- [ ] Fazer a mudança no arquivo correto
- [ ] Se o texto contém placeholder `${var}` ou `{campo}`, preservar a interpolação

### Após

- [ ] Rodar `npm test` — testes não devem quebrar por mudança de texto (exceto se o teste faz assert no texto exato)
- [ ] Husky bumpa `CACHE_NAME` automaticamente no commit

---

## 1. Labels de campo

Labels são os nomes visíveis dos campos do formulário. Dependendo da seção, estão em arquivos diferentes.

### Labels da seção Iniciais

**Arquivo:** `scripts/fields.js` — busca por `export const iniciaisFields = [`

```js
{ nome: "lider", label: "Líder", tipo: "select", opcoes: nomesTecnicos, obrigatorio: true },
{ nome: "uc", label: "UC", tipo: "text", obrigatorio: true },
{ nome: "os", label: "OS", tipo: "text", obrigatorio: true },
```

**Regras:**

- Editar a propriedade `label` no objeto do campo
- Se mudar `nome` também, verificar referências em `collectors.js` e `state.js`
- O sistema já põe `*` vermelho em campos obrigatórios — não incluir no label
- Estes labels também servem como placeholder — busca por `input.placeholder = field.label` em `renderIniciais()`

### Labels da seção Retorno

**Arquivo:** `scripts/data/fields-data.js` — busca por `export const FIELD_DESCRICAO = {` e `export const retornoFieldsByTipo = {`

```js
// FIELD_DESCRICAO (usado por ~31 tipos)
export const FIELD_DESCRICAO = {
  nome: 'descricao',
  label: 'Descrição do Serviço',
  tipo: 'textarea',
};

// Campos customizados (exemplo)
{ linha: 1, nome: "situacao_corte", label: "Situação", tipo: "select", opcoes: [...] },
```

**Regras:**

- Labels definidos nos arrays de campos ou constantes compartilhadas
- **Nunca** editar labels em `retornos.js` — ele só renderiza, não define
- Se um label aparece em múltiplos Tipos de Ordem, verificar se é constante compartilhada (editar 1x) ou duplicado inline (editar em cada)
- Mudar label de retorno pode exigir atualizar placeholder no template de email em `retorno-templates.js`

### Labels de equipamentos

**Arquivo:** `scripts/equipment-keys.js` — busca por `export const EQUIPMENT_KEYS = [`

```js
export const EQUIPMENT_KEYS = [
  { nome: 'medidor', label: 'MEDIDOR' },
  { nome: 'conjunto', label: 'CONJUNTO' },
  { nome: 'display', label: 'DISPLAY' },
  // ... TC FASE A/B/C, TP FASE A/B/C
];
```

**Regras:**

- Afeta renderização, coleta (`collectors.js`) e email (`email.js`)
- Labels em MAIÚSCULAS por convenção — manter ou mudar consistente

---

## 2. Opções de SELECT

Valores exibidos nos dropdowns do formulário.

### Listas estáticas

**Arquivo:** `scripts/data/fields-data.js`

| Array              | Busca por                           | Exemplos                         |
| ------------------ | ----------------------------------- | -------------------------------- |
| `nomesTecnicos`    | `export const nomesTecnicos = [`    | `'ANDRE DE SOUSA CARVALHO'`      |
| `municipioOptions` | `export const municipioOptions = [` | `'ACARAPE'`, `'FORTALEZA'`       |
| `placaOptions`     | `export const placaOptions = [`     | `'RIE0D84'`, `'PNZ6C24'`         |
| `tipoOrdemOptions` | `export const tipoOrdemOptions = [` | `'CORTE POR FALTA DE PAGAMENTO'` |

**Regras:**

- Arrays simples de strings — adicionar/remover direto
- A ordem no array define a ordem no dropdown
- Mudar um nome em `tipoOrdemOptions` **exige** atualizar a chave correspondente em `retornoFieldsByTipo` e `retornoTemplates`

### Opções de campos de retorno

**Arquivo:** `scripts/data/fields-data.js`

```js
// Exemplos de opcoes em campos de retorno
opcoes: ['CORTADO', 'AUTO RELIGADO CORTE EXECUTADO', 'COM MEDICAO'];
opcoes: ['SIM', 'NAO'];
opcoes: ['COM RAMAL', 'SEM RAMAL'];
```

**Regras:**

- Definidas na propriedade `opcoes` do campo
- Se o mesmo array aparece em múltiplos campos, extrair para constante compartilhada
- Se uma opção é usada como `condicao.valor` em templates de email (`retorno-templates.js`), atualizar lá também
- O placeholder "Selecione" é adicionado automaticamente — não incluir no array

### Opções de equipamentos

**Arquivo:** `index.html` — busca por `option value="NAO"` e `option value="SIM"` dentro dos selects de equipamentos

```html
<option value="NAO">NAO</option>
<option value="SIM">SIM</option>
```

**Regras:**

- Hardcoded no HTML — são campos fixos da seção 3
- Valores de `value` são usados na lógica de show/hide dos campos de equipamento

---

## 3. Títulos e seções

### HTML principal

**Arquivo:** `index.html`

| Local             | Busca por                            | Elemento         |
| ----------------- | ------------------------------------ | ---------------- |
| `<title>`         | `<title>Formulário de Envio</title>` | Página           |
| `<h1>`            | `<h1>Retorno de Ordens`              | Título principal |
| Seção 1           | `1 Início`                           | Section heading  |
| Seção 2           | `2 Retorno`                          | Section heading  |
| Seção 3           | `3 Equipamentos`                     | Section heading  |
| Seção 4           | `4 Anexos`                           | Section heading  |
| Seção 5           | `5 Revisão`                          | Section heading  |
| Equip. Instalados | `EQUIPAMENTOS INSTALADOS`            | Subheading       |
| Equip. Retirados  | `EQUIPAMENTOS RETIRADOS`             | Subheading       |
| Sidebar título    | `sidebar-title` ou `Registros`       | `<h2>`           |
| Sidebar filtro    | `BUSCAR UC, OS OU TIPO`              | Filter label     |
| Update modal      | `Sistema atualizado`                 | Título + corpo   |

**Regras:**

- Headings de seção são puramente visuais — sem referência cruzada em JS
- Subtítulos de equipamentos aparecem TAMBÉM como headers no email — busca por `'EQUIPAMENTOS INSTALADOS:'` em `email.js` — **mudar nos dois lugares**
- Update modal: título + corpo no HTML

### Manifest PWA

**Arquivo:** `manifest.json`

```json
{
  "name": "Retorno - Formulário de Envio",
  "short_name": "Retorno",
  "description": "Formulário de retorno para serviços de campo"
}
```

**Regras:**

- `name`: nome completo (tela de instalação)
- `short_name`: nome curto (atalho na home screen)
- `description`: descrição do app

---

## 4. Mensagens de erro e validação

### Validação de formulário

**Arquivo:** `scripts/validation.js`

| Mensagem                                         | Busca por                                     | Contexto             |
| ------------------------------------------------ | --------------------------------------------- | -------------------- |
| `Descrição deve ter no mínimo 5 caracteres`      | `minLength: 5` em `FIELD_VALIDATIONS`         | min descrição        |
| `Descrição deve ter no máximo 2000 caracteres`   | `maxLength: 2000` em `FIELD_VALIDATIONS`      | max descrição        |
| `Campo obrigatório`                              | `'Campo obrigatório'` em `validateSection1()` | campo required vazio |
| `UC deve conter apenas números`                  | `'UC deve conter apenas números'`             | UC inválida          |
| `UC deve ter entre 5 e 10 dígitos`               | `'UC deve ter entre 5 e 10'`                  | UC tamanho           |
| `OS deve conter apenas números e a letra A`      | `'OS deve conter apenas números'`             | OS inválida          |
| `OS deve ter entre 5 e 10 dígitos`               | `'OS deve ter entre 5 e 10'`                  | OS tamanho           |
| `Data não pode ser futura.`                      | `'Data não pode ser futura'`                  | data futura          |
| `Hora fim deve ser diferente da hora início.`    | `'Hora fim deve ser diferente'`               | hora                 |
| `Selecione e preencha pelo menos um equipamento` | `'Selecione e preencha pelo menos um'`        | equip vazio          |

**Regras:**

- Strings literais — mudar o texto não quebra lógica
- Usadas apenas para exibição via `showFieldError()`
- "Campo obrigatório" aparece em múltiplos contextos — mudar afeta todos

### Envio de email

**Arquivo:** `scripts/send.js`

| Mensagem                                                             | Busca por                                                       |
| -------------------------------------------------------------------- | --------------------------------------------------------------- |
| `Este registro já foi enviado anteriormente e sofreu alterações...`  | `'Este registro já foi enviado anteriormente'` em `sendEmail()` |
| `Enviando...` (botão)                                                | `'Enviando...'` em `sendEmail()`                                |
| `Sem internet — dados salvos. Conecte-se e clique Enviar novamente.` | `'Sem internet'` em `sendEmail()`                               |
| `Erro de conexão com o servidor. Verifique sua internet...`          | `'Erro de conexão com o servidor'`                              |
| `Email enviado com sucesso!`                                         | `'Email enviado com sucesso'`                                   |
| `data.error \|\| 'Erro ao enviar email.'`                            | `'Erro ao enviar email'`                                        |
| `📨 Enviar` (botão pós-envio)                                        | `'📨 Enviar'` em `sendEmail()`                                  |

### Sidebar

**Arquivo:** `scripts/sidebar.js`

| Mensagem                                                 | Busca por                                           |
| -------------------------------------------------------- | --------------------------------------------------- |
| `Erro ao carregar registros.`                            | `'Erro ao carregar registros'` em `renderSidebar()` |
| `Nenhum registro encontrado.`                            | `'Nenhum registro encontrado'` em `renderSidebar()` |
| `` `Nenhum registro encontrado para "${filterTerm}".` `` | `'Nenhum registro encontrado para'`                 |
| `Não foi possível carregar o registro. Tente novamente.` | `'Não foi possível carregar'`                       |
| `Não foi possível excluir o registro. Tente novamente.`  | `'Não foi possível excluir'`                        |

**Regras:**

- Template literals com `${}` — preservar interpolação

### Outros erros

| Arquivo                  | Busca por                  | Mensagem                                     |
| ------------------------ | -------------------------- | -------------------------------------------- |
| `scripts/attachments.js` | `'arquivo(s) ignorado(s)'` | `${rejectedCount} arquivo(s) ignorado(s)...` |
| `scripts/attachments.js` | `'Máximo de 12 anexos'`    | `Máximo de 12 anexos...`                     |
| `scripts/persistence.js` | `'Espaço insuficiente'`    | `Espaço insuficiente no navegador...`        |
| `scripts/utils.js`       | `'Não disponível'`         | `Não disponível` (geolocalização)            |

### Backend (Netlify Function)

**Arquivo:** `netlify/functions/send.cjs`

| Mensagem                                           | Busca por                          |
| -------------------------------------------------- | ---------------------------------- |
| `Payload excede o limite de 10 MB.`                | `'Payload excede'`                 |
| `Campo 'assunto' é obrigatório.`                   | `'assunto' é obrigatório`          |
| `Campo 'text' é obrigatório.`                      | `'text' é obrigatório`             |
| `Máximo de 12 anexos permitido.`                   | `'Máximo de 12 anexos permitido'`  |
| `` `Anexo '${att.filename}' excede 8 MB.` ``       | `'excede 8 MB'`                    |
| `Erro interno ao enviar o email. Tente novamente.` | `'Erro interno ao enviar o email'` |

**Regras:**

- Mensagens retornadas como JSON `{ error: "..." }`
- Frontend exibe `data.error` como fallback — busca por `data.error || 'Erro ao enviar email'` em `sendEmail()`

---

## 5. Modais e confirmações

### Modal de registro duplicado

**Arquivo:** `scripts/duplicate.js` — busca por `checkDuplicate` e `'Registro já enviado'`

```js
const title = 'Registro já enviado';
const body = `Este registro (OS #${os}) já foi enviado com sucesso em ${sentAt}. Deseja realizar um novo envio mesmo assim?`;
```

### Confirmação de exclusão

**Arquivo:** `scripts/sidebar.js` — busca por `await showConfirm('Excluir este registro?`

```js
const confirmado = await showConfirm('Excluir este registro? Esta ação não pode ser desfeita.');
```

### Confirmação de GPS

**Arquivo:** `scripts/iniciais.js` — busca por `'Deseja atualizar as coordenadas GPS?`

```js
const confirmed = await showConfirm(
  'Deseja atualizar as coordenadas GPS? A localização atual será substituída.'
);
```

### Confirmação de reenvio

**Arquivo:** `scripts/send.js` — busca por `'Este registro já foi enviado anteriormente'` em `sendEmail()`

```js
const doSend = await showConfirm(
  'Este registro já foi enviado anteriormente e sofreu alterações após o envio. Deseja reenviá-lo?'
);
```

### Validação de anexos

**Arquivo:** `scripts/ui.js` — busca por `showModal('anexos-modal'`

```js
showModal('anexos-modal', 'O formulário deve conter no mínimo 2 e no máximo 12 anexos.');
```

### Botões dos modais

**Arquivo:** `index.html` — botões definidos como elementos HTML com IDs: `dup-modal-cancel`, `dup-modal-confirm`, `confirm-modal-cancel`, `confirm-modal-ok`, `anexos-modal-close`, `send-modal-close`

| Texto       | Busca por              | Modal     |
| ----------- | ---------------------- | --------- |
| `Cancelar`  | `dup-modal-cancel`     | Duplicate |
| `Reenviar`  | `dup-modal-confirm`    | Duplicate |
| `Cancelar`  | `confirm-modal-cancel` | Confirm   |
| `Confirmar` | `confirm-modal-ok`     | Confirm   |
| `Fechar`    | `anexos-modal-close`   | Anexos    |
| `Fechar`    | `send-modal-close`     | Send      |

**Regras:**

- `showConfirm(message)` é genérica — editar a mensagem em quem chama, não na função
- `showDuplicateModal(title, body)` recebe parâmetros — textos em `duplicate.js`
- Botões são estáticos no HTML — mudar em todos os modais se quiser consistência

---

## 6. Botões e ações

### Botões principais

**Arquivo:** `index.html`

| Texto                                       | Busca por                        | Elemento                     |
| ------------------------------------------- | -------------------------------- | ---------------------------- |
| `Abrir menu de registros`                   | `'Abrir menu de registros'`      | `aria-label` hamburger       |
| `Novo formulário` / `Criar novo formulário` | `btn-novo-form`                  | `title`/`aria-label` botão + |
| `📨 Enviar`                                 | `id="btn-enviar"`                | Botão enviar                 |
| `Fechar menu de registros`                  | `'Fechar menu de registros'`     | `aria-label` sidebar close   |
| `Fechar visualização ampliada`              | `'Fechar visualização ampliada'` | `aria-label` lightbox        |

### Botões durante envio

**Arquivo:** `scripts/send.js`

| Texto         | Busca por                        |
| ------------- | -------------------------------- |
| `Enviando...` | `'Enviando...'` em `sendEmail()` |
| `📨 Enviar`   | `'📨 Enviar'` em `sendEmail()`   |

### Botões do sidebar

**Arquivo:** `scripts/sidebar.js`

| Texto        | Busca por      |
| ------------ | -------------- |
| `✏️ Editar`  | `'✏️ Editar'`  |
| `🗑️ Excluir` | `'🗑️ Excluir'` |

### Labels de status

**Arquivo:** `scripts/sidebar.js` — busca por `const statusConfig = {` em `getRecordSummary()`

```js
'Enviado';
'Alterado';
'Rascunho';
```

### Orientation overlay

**Arquivo:** `index.html` — busca por `'Gire o celular na vertical'`

```html
<p>Gire o celular na vertical</p>
<p>O formulário funciona melhor no modo retrato.</p>
```

**Regras:**

- Botões com emoji: o emoji faz parte da string — cuidado ao editar
- `aria-label` e `title` frequentemente duplicam — mudar nos dois
- Status labels aparecem no sidebar como badges

---

## 7. Textos de email

### Linha de assunto

**Arquivo:** `scripts/send.js` — busca por `const subject =` em `sendEmail()`

```js
const subject = `RETORNO DE ORDEM UC ${uc} OS ${os} - ${tipoLabel}`;
```

**Regras:** Template literal — manter `${uc}`, `${os}`, `${tipoLabel}`.

### Templates de corpo por Tipo de Ordem

**Arquivo:** `scripts/data/retorno-templates.js` — busca por `export const retornoTemplates = {`

Este arquivo concentra ~90% do texto dos emails. Exemplos:

```js
// Template simples
export const DESCRICAO_TEMPLATE = [{ blocos: [{ texto: '{descricao}' }] }];

// Template com variantes
export const TELEMEDICAO_TEMPLATE = [
  {
    condicao: { campo: 'executado_telemedicao', valor: 'SIM' },
    blocos: [
      { texto: 'EXECUTADO: SIM' },
      { texto: 'ATENDENTE: {atentende_com}' },
      { texto: 'REALIZADO: {realizado_telemedicao}' },
    ],
  },
  // ...
];
```

**Regras:**

- Placeholders `{campo}` resolvem de `data.retorno` primeiro, depois `data.iniciais` — mudar nome do placeholder quebra a resolução
- Texto estático (sem `{}`) pode ser mudado livremente
- Condições (`condicao.valor`) devem bater com as opções do SELECT correspondente em `fields-data.js`
- Templates compartilhados: editar a constante uma vez afeta todos os tipos que a usam

### Headers no email

**Arquivo:** `scripts/email.js` — busca por `'EQUIPAMENTOS INSTALADOS:'` e `'EQUIPAMENTOS RETIRADOS:'` em `composeEmail()`

| Texto                      | Busca por                    |
| -------------------------- | ---------------------------- |
| `EQUIPAMENTOS INSTALADOS:` | `'EQUIPAMENTOS INSTALADOS:'` |
| `EQUIPAMENTOS RETIRADOS:`  | `'EQUIPAMENTOS RETIRADOS:'`  |
| `(nao preenchido)`         | `'nao preenchido'`           |

**Regras:**

- Headers de equipamentos espelham o HTML — manter sincronizado
- `(nao preenchido)` é fallback para campo de retorno vazio em templates não-customizados

---

## 8. Placeholders e estados vazios

### Placeholders de input

| Texto                            | Busca por                                                | Contexto                        |
| -------------------------------- | -------------------------------------------------------- | ------------------------------- |
| `Selecione`                      | `placeholder.textContent = 'Selecione'` em `iniciais.js` | Placeholder de todos os SELECTs |
| `Coletando coordenadas...`       | `'Coletando coordenadas'` em `iniciais.js`               | Input de coordenadas            |
| `field.label` (auto)             | `input.placeholder = field.label` em `renderIniciais()`  | Placeholder = label do campo    |
| `field.label` (auto)             | `input.placeholder = field.label` em `renderRetorno()`   | Placeholder = label do campo    |
| `Buscar por UC, OS ou tipo...`   | `'Buscar por UC, OS ou tipo'`                            | Filtro do sidebar               |
| `Clique para selecionar imagens` | `'Clique para selecionar imagens'`                       | Área de upload                  |

**Regras:**

- "Selecione" em `iniciais.js` — busca por `'Selecione'` em `createSelectInput()` — é **genérico** para TODOS os SELECTs
- Retorno e Iniciais usam `field.label` como placeholder automaticamente — busca por `input.placeholder = field.label` — se quiser placeholder diferente do label, precisa mudar a lógica

### Estados vazios

| Texto                                                    | Busca por                                           |
| -------------------------------------------------------- | --------------------------------------------------- |
| `Nenhum registro encontrado.`                            | `'Nenhum registro encontrado'` em `renderSidebar()` |
| `` `Nenhum registro encontrado para "${filterTerm}".` `` | `'Nenhum registro encontrado para'`                 |
| `(rascunho vazio)`                                       | `'rascunho vazio'`                                  |
| `Selecione o Tipo de Ordem na seção "Início"...`         | `'Selecione o Tipo de Ordem'`                       |
| `—` (em dash)                                            | `DOM.retornoDesc.innerHTML = '—'` em `reset.js`     |

**Regras:**

- `(rascunho vazio)`: fallback para registros sem UC+OS no sidebar
- Mensagem de retorno prompt — busca por `'Selecione o Tipo de Ordem'` em `index.html` — aparece quando nenhum Tipo de Ordem está selecionado

---

## Arquivos de referência rápida

| Arquivo                             | O que contém                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| `index.html`                        | Títulos, botões, modais, subtítulos, placeholders HTML, labels de equipamento |
| `scripts/fields.js`                 | Labels dos campos iniciais                                                    |
| `scripts/data/fields-data.js`       | Labels de retorno, opções de SELECT, listas estáticas                         |
| `scripts/data/retorno-templates.js` | Templates de email, placeholders, texto de corpo                              |
| `scripts/email.js`                  | Headers de email, fallback "(nao preenchido)"                                 |
| `scripts/validation.js`             | Erros de validação                                                            |
| `scripts/send.js`                   | Assunto do email, mensagens de envio, botão Enviando...                       |
| `scripts/sidebar.js`                | Erros, estados vazios, botões Editar/Excluir, status                          |
| `scripts/iniciais.js`               | "Selecione", coordenadas, confirmação GPS                                     |
| `scripts/duplicate.js`              | Modal de registro duplicado                                                   |
| `scripts/ui.js`                     | Modal de anexos                                                               |
| `scripts/attachments.js`            | Erros de anexos                                                               |
| `scripts/persistence.js`            | Erro de cota                                                                  |
| `scripts/utils.js`                  | Erro de geolocalização                                                        |
| `scripts/equipment-keys.js`         | Labels de equipamentos                                                        |
| `scripts/reset.js`                  | Em dash de estado vazio                                                       |
| `manifest.json`                     | Nome e descrição do PWA                                                       |
| `netlify/functions/send.cjs`        | Erros do backend                                                              |

## Situações a evitar

- ❌ Mudar label de retorno em `retornos.js` em vez de `fields-data.js` — `retornos.js` só renderiza
- ❌ Mudar nome de opção de SELECT sem atualizar `condicao.valor` no template de email
- ❌ Mudar texto de placeholder sem verificar se é o "Selecione" genérico (afeta todos os SELECTs)
- ❌ Mudar subtítulo de equipamento no HTML e esquecer o mesmo texto no email (`email.js`)
- ❌ Mudar nome em `tipoOrdemOptions` sem atualizar chaves em `retornoFieldsByTipo` e `retornoTemplates`
- ❌ Quebrar template literals removendo `${var}` ou `{campo}`
- ❌ Assumir que mudar label de campo muda automaticamente o placeholder — o placeholder é o label, mas via código

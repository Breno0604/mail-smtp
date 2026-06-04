# Plan — Mail MVP (próxima versão)

## Visão geral

- Aplicação single-page com formulário multi-seção (wizard)
- Seções na ordem: **Iniciais → Equipamentos → Retorno → Anexos → Revisão**
- Navegação: avançar/voltar uma seção por vez
- Dados mantidos em memória (objeto JS) durante a sessão
- Assunto e corpo do email montados automaticamente a partir dos campos

---

## Seção 1 — Campos Iniciais

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| UC | number | sim |
| OS | text | sim |
| Cliente | text | sim |
| Tipo de ordem | select | sim |

**Tipo de ordem** (valores possíveis):
- Ordem de Serviço
- Garantia
- Orçamento

---

## Seção 2 — Equipamentos

Lista dinâmica (botão "Adicionar equipamento" / "Remover").

| Campo | Tipo |
|-------|------|
| Tipo | select: "Instalado" / "Retirado" |
| N° | number |

Pode haver 0 ou mais itens.

---

## Seção 3 — Retorno de Ordem

Campos variam conforme o **Tipo de ordem** selecionado:

| Tipo de ordem | Campos |
|---------------|--------|
| Ordem de Serviço | Serviço realizado (textarea), Observações (textarea) |
| Garantia | Defeito relatado (textarea), Ação tomada (textarea) |
| Orçamento | Descrição (textarea), Valor estimado (number) |

---

## Seção 4 — Anexos

- Upload de imagens, máx. 12 arquivos
- Compressão automática via Canvas (funcionalidade existente)
- Preview das miniaturas

---

## Seção 5 — Revisão

- Preview completo do email como será enviado
  - **Assunto** montado automaticamente: ex. `OS #123 - Empresa ABC - Ordem de Serviço`
  - **Corpo**: todos os campos formatados em texto
  - **Anexos**: listados com nomes e quantidade
- Botão **Voltar** → seção anterior (e assim por diante)
- Botão **Enviar**:
  - Sucesso: feedback verde + salva no IndexedDB (`sent_emails`) + limpa formulário
  - Offline: salva na **fila de envios pendentes** e tenta reenviar quando houver conectividade

---

## Fila de envios pendentes

- IndexedDB: nova store `pending_queue`
- Registro: `{ id, payload, attachments, createdAt, retries }`
- Ao detectar `navigator.onLine`, tenta enviar os pendentes
- Máx. 3 tentativas, depois marca como `failed`

---

## Composição do email

**Assunto** (montado automaticamente):
```
OS #{OS} - {Cliente} - {Tipo de ordem}
```

**Corpo** (montado automaticamente):
```
UC: {UC}
OS: {OS}
Cliente: {Cliente}
Tipo de ordem: {Tipo de ordem}

Equipamentos:
- {Tipo} - N° {N°}
- {Tipo} - N° {N°}

Retorno:
{campo1}: {valor1}
{campo2}: {valor2}
```

---

## Fluxo de navegação

```
[Iniciais] → [Equipamentos] → [Retorno] → [Anexos] → [Revisão] → Enviar
     ←            ←              ←            ←            ←
```

- Botão "Avançar" na seção atual valida campos obrigatórios antes de prosseguir
- Botão "Voltar" retorna para a seção imediatamente anterior
- Na Revisão: "Voltar" → Anexos, "Enviar" → tenta envio

---

## Backend (send.js)

- Mantém a mesma estrutura atual
- Payload vindo do frontend: `{ subject, text, attachments }`
- Subject e text montados no frontend
- Sempre envia para `SMTP_TO` (env var)

---

## Histórico (IndexedDB)

Store `sent_emails` (já implementada):
- `to`, `subject`, `sentAt`, `status`, `payload` (opcional)

Store `pending_queue` (nova):
- `id`, `payload`, `attachments`, `createdAt`, `retries`, `status`

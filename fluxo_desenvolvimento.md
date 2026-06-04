# Fluxo de Desenvolvimento — Mail MVP

## Escopo

**Stack:**
- Frontend: HTML5 + CSS3 + Tailwind CSS (via CDN) + JavaScript puro
- Backend: Netlify Function (Node.js + `nodemailer`)
- Armazenamento local: IndexedDB (registros de envios)
- Build step zero (sem bundlers, sem transpilação)
- Hospedagem: Netlify com deploy automático via `git push`

**Funcionalidades incluídas:**
- Formulário com 3 campos: **Assunto**, **Corpo** (texto livre) e **Anexos** (imagens, máx. 12)
- Destinatário(s) configurado(s) via variável de ambiente `SMTP_TO` (múltiplos emails separados por vírgula)
- Compressão automática de imagens grandes via Canvas API no navegador: anexos > 670 KB são redimensionados progressivamente e convertidos para JPEG (`_red.jpg`)
- Envio assíncrono via `fetch` para `/api/send`
- Validações no **frontend**: limite de 12 anexos
- Validações no **backend**: método HTTP, campos obrigatórios, formato de email, limite de 12 anexos, tamanho máximo de 8 MB por anexo
- Remetente fixo (`SMTP_FROM`), não editável pelo usuário
- Servidor SMTP configurável via variáveis de ambiente
- TLS com `rejectUnauthorized: false` (para servidores com certificado auto-assinado)
- Salvamento automático no IndexedDB após cada envio bem-sucedido (registro local do histórico)
- Feedback visual de sucesso (verde) ou erro (vermelho)

## Pré-requisitos

- Site na Netlify conectado a um repositório GitHub
- 6 variáveis de ambiente configuradas no dashboard da Netlify:

| Variável | Exemplo |
|----------|---------|
| `SMTP_HOST` | smtp.beq.com.br |
| `SMTP_PORT` | 465 |
| `SMTP_USER` | contato@beq.com.br |
| `SMTP_PASS` | sua-senha |
| `SMTP_FROM` | contato@beq.com.br |
| `SMTP_TO` | email1@teste.com,email2@teste.com |

> `SMTP_TO` aceita um ou mais emails separados por vírgula. O backend divide e envia para todos.

## Fluxo de uso

1. **Usuário acessa o site** — O navegador carrega `index.html` (formulário com Tailwind), `style.css` (customizações) e `app.js` (lógica de envio). Tudo arquivo estático servido pela Netlify.

2. **Preenche o formulário** — O formulário tem 3 campos:
   - **Assunto** (obrigatório)
   - **Corpo** (texto livre, opcional)
   - **Anexos** (múltiplos arquivos de imagem, máximo 12)

   > O destinatário não aparece no formulário — ele é definido via variável de ambiente `SMTP_TO`.

3. **Clica em "Enviar"** — O `app.js` entra em ação:
   - Valida limite de 12 anexos
   - Desabilita o botão e mostra "Enviando email..."
   - Para cada anexo:
     - Se ≤ 670 KB: converte para base64 diretamente
     - Se > 670 KB: redimensiona via Canvas com redução progressiva de resolução (até 10 tentativas), salva como JPEG com qualidade reduzida e renomeia para `_red.jpg`
   - Monta um JSON com `subject`, `text` e `attachments` (base64)
   - Envia via POST para `/api/send`

4. **Requisição chega na Netlify** — O `netlify.toml` redireciona `/api/send` para a Function `send.js` em `netlify/functions/`.

5. **Function processa o email** — O `send.js`:
   - Valida método (apenas POST)
   - Valida campos obrigatórios (`subject`)
   - Valida limite de 12 anexos e tamanho máximo de 8 MB por anexo
   - Lê `SMTP_TO` e divide por vírgula para obter a lista de destinatários
   - Configura transporte SMTP com `nodemailer` usando variáveis de ambiente
   - Envia o email para todos os destinatários
   - TLS com validação desabilitada (`rejectUnauthorized: false`)

6. **Salva no IndexedDB** — Após envio bem-sucedido, o `app.js` registra no IndexedDB:
   - `to` — lista de destinatários
   - `subject` — assunto enviado
   - `sentAt` — data e hora do envio
   - `status` — "sucesso"

7. **Resposta volta para o usuário** — A function retorna JSON. O `app.js` exibe:
   - "Email enviado com sucesso!" em verde (e limpa o formulário)
   - Ou mensagem de erro em vermelho

## Estrutura de arquivos

```
mail-smtp/
├── index.html                 → Formulário (Tailwind CSS via CDN)
├── style.css                  → Customizações adicionais
├── app.js                     → Lógica: valida, comprime anexos, envia, salva IndexedDB
├── netlify.toml               → Config: build, functions, redirects
├── package.json               → Dependência: nodemailer
├── fluxo_desenvolvimento.md   → Este arquivo
├── netlify/functions/
│   └── send.js                → Function Node.js que envia o email
└── docs/
    └── superpowers/plans/
        └── 2026-06-03-mail-mvp.md → Plano de implementação original
```

## Fluxo de deploy

1. `git add -A && git commit -m "mensagem" && git push`
2. Netlify detecta o push, executa `npm install`, e faz deploy automático

## Fora do escopo

- **Frameworks JavaScript**: Vue, React, Next.js, Angular, Svelte, Solid, etc.
- **Bundlers / build tools**: Webpack, Vite, esbuild, Babel, TypeScript compiler, etc.
- Autenticação de usuários (login, senha, sessão)
- Banco de dados online ou servidor próprio
- Campo "Para" editável pelo usuário (destinatário fixo via `SMTP_TO`)
- Envio para mais de 12 anexos
- Anexos com mais de 8 MB
- Templates de email com HTML rich, layouts ou placeholders
- Testes automatizados (unitários, integração, e2e)
- API pública documentada ou endpoints versionados
- Modo de desenvolvimento local (depende das Netlify Functions)
- Suporte a i18n ou múltiplos idiomas

## Limitações

- Máximo de 12 anexos por envio
- Cada anexo limitado a 8 MB (após compressão)
- Anexos > 670 KB são redimensionados e convertidos para JPEG (`_red.jpg`)
- Destinatário fixo via `SMTP_TO` (não editável no formulário)
- Registros salvos apenas no IndexedDB (local, por navegador)
- TLS com validação desabilitado (`rejectUnauthorized: false`)
- Sem histórico de envios entre dispositivos (apenas local)

## Futuras implementações (pós-MVP)

- **Logs e monitoramento de envios** — rastreamento centralizado de falhas e sucessos
- **Deleção automática de registros antigos** — registros com data de envio ≥ 90 dias serão removidos permanentemente do IndexedDB

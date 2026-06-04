# Fluxo de Desenvolvimento — Mail MVP

## Pré-requisitos

- Site na Netlify conectado a um repositório GitHub
- 5 variáveis de ambiente configuradas no dashboard da Netlify:

| Variável | Exemplo |
|----------|---------|
| `SMTP_HOST` | smtp.beq.com.br |
| `SMTP_PORT` | 465 |
| `SMTP_USER` | contato@beq.com.br |
| `SMTP_PASS` | sua-senha |
| `SMTP_FROM` | contato@beq.com.br |

## Como funciona

1. **Usuário acessa o site** — O navegador carrega `index.html` (formulário), `style.css` (visual) e `app.js` (lógica de envio). Tudo arquivo estático, servido pela Netlify.

2. **Preenche o formulário** — O formulário tem 5 campos:
   - **De** (email do remetente, obrigatório)
   - **Para** (email do destinatário, obrigatório)
   - **Assunto** (obrigatório)
   - **Corpo** (texto livre, opcional)
   - **Anexos** (múltiplos arquivos de imagem, opcional)

3. **Clica em "Enviar"** — O `app.js` entra em ação:
   - Desabilita o botão e mostra "Enviando..."
   - Lê cada anexo, converte o arquivo para base64
   - Monta um JSON com todos os campos e os anexos em base64
   - Envia esse JSON via POST para o endereço `/api/send`

4. **Requisição chega na Netlify** — O arquivo `netlify.toml` tem uma regra que redireciona toda requisição para `/api/send` para a Function `send.js`, que fica na pasta `netlify/functions/`.

5. **Function processa o email** — O `send.js` faz o seguinte:
   - Pega as configurações do SMTP das variáveis de ambiente (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`)
   - Cria uma conexão com o servidor SMTP usando o nodemailer
   - Monta o email com remetente, destinatário, assunto, corpo e anexos
   - Envia o email pelo servidor SMTP

6. **Resposta volta para o usuário** — A function retorna um JSON dizendo se deu certo ou não. O `app.js` recebe essa resposta e mostra na tela:
   - "Email enviado com sucesso!" em verde (e limpa o formulário)
   - Ou a mensagem de erro em vermelho

## Estrutura de arquivos

```
mail/
├── index.html              → Formulário (inputs + botão)
├── style.css               → Aparência (mobile-first, ~60 linhas)
├── app.js                  → Lógica: valida, converte anexos, envia requisição
├── netlify.toml            → Config: redirect /api/send → Function
├── package.json            → Dependência: nodemailer
└── netlify/functions/
    └── send.js             → Function Node.js que envia o email
```

## Fluxo de deploy

1. `git add -A && git commit -m "mensagem" && git push`
2. Netlify detecta o push, instala dependências e faz deploy automático

## Limitações

- Anexos limitados a ~6-7 MB (limite de 10 MB da Netlify Function + overhead do base64)
- Sem histórico de envios (stateless)
- TLS com validação desabilitado (`rejectUnauthorized: false`)

# Dependências — mail-mvp

> Gerado pelo Scout em 2026-06-15

## Gerenciador de Pacotes

- **npm**

## Dependências de Produção

| Pacote      | Versão  | Finalidade                              |
|-------------|---------|-----------------------------------------|
| nodemailer  | ^6.9.0  | Envio de emails via SMTP (Netlify Function) |

## Dependências de Desenvolvimento

| Pacote           | Versão   | Finalidade                              |
|------------------|----------|-----------------------------------------|
| vitest           | ^4.1.8   | Framework de testes                      |
| jsdom            | ^29.1.1  | Simulação de DOM para testes             |
| tailwindcss      | ^3.4.19  | Framework CSS utilitário                 |
| autoprefixer     | ^10.5.0  | Prefixos CSS automáticos                 |
| postcss          | ^8.5.15  | Processador CSS                          |
| sharp            | ^0.34.5  | Processamento de imagens (compressão)    |
| fake-indexeddb   | ^6.2.5   | Mock do IndexedDB para testes            |

## Scripts npm

| Script          | Comando                        |
|-----------------|---------------------------------|
| `build:css`     | `tailwindcss -i tailwind-input.css -o tailwind.css --minify` |
| `test`          | `vitest run`                    |
| `test:watch`    | `vitest`                        |
| `test:coverage` | `vitest run --coverage`         |

## Stack Tecnológica

| Camada          | Tecnologia                     |
|-----------------|--------------------------------|
| Frontend        | HTML5 + CSS3 + JavaScript (ES6 modules) |
| Estilo          | Tailwind CSS 3 (compilado estático) |
| Armazenamento   | IndexedDB + localStorage       |
| Backend         | Netlify Functions (Node.js)    |
| Email           | nodemailer (SMTP)              |
| PWA             | Service Worker + Manifest      |
| Testes          | Vitest + jsdom                 |
| Build/Deploy    | Netlify (auto-deploy via git)  |
| Processamento   | sharp (compressão de imagens)  |

## Variáveis de Ambiente (Netlify Function)

| Variável     | Descrição                    |
|-------------|------------------------------|
| SMTP_HOST   | Servidor SMTP                |
| SMTP_PORT   | Porta SMTP                   |
| SMTP_USER   | Usuário SMTP                 |
| SMTP_PASS   | Senha SMTP                   |
| SMTP_FROM   | Remetente                    |
| SMTP_TO     | Destinatário(s)              |

# Globals, Tarefas de Implementação

> Gerado pelo Redator em 2026-06-15

---

## Pré-requisitos

- [ ] Node.js 18+ instalado
- [ ] Netlify CLI (`npm install -g netlify-cli`)
- [ ] Conta Netlify para deploy
- [ ] 6 variáveis SMTP configuradas no Netlify

## Tarefas

- [ ] T-01, Criar `index.html` com 5 seções flat + sidebar + modais
  - Origem no legado: `index.html`
  - Critério de pronto: Estrutura completa com sec-inicio, retorno, equipamentos, anexos, revisao; sidebar; 4 modais; orientation overlay
  - Confiança: 🟢

- [ ] T-02, Configurar `style.css` com estilos customizados (sec-card, preview, sidebar, modais, toast, etc.)
  - Origem no legado: `style.css`
  - Critério de pronto: Complementa Tailwind com estilos de seção, botões, modais, toast, sidebar
  - Confiança: 🟢

- [ ] T-03, Configurar `tailwind.css` via build script
  - Origem no legado: `tailwind-input.css` + `tailwind.css`
  - Critério de pronto: `npm run build:css` compila Tailwind com purge
  - Confiança: 🟢

- [ ] T-04, Criar `manifest.json` para PWA
  - Origem no legado: `manifest.json`
  - Critério de pronto: standalone, portrait, icons 192+512, theme_color blue
  - Confiança: 🟢

- [ ] T-05, Configurar `sw.js` — service worker cache-first
  - Origem no legado: `sw.js`
  - Critério de pronto: Cacheia 23 scripts + assets; network-first navigate; limpa caches antigos; CACHE_NAME versionado
  - Confiança: 🟢

- [ ] T-06, Configurar `netlify.toml`
  - Origem no legado: `netlify.toml`
  - Critério de pronto: Build command `npm install`, functions redirect, headers para SW e icons
  - Confiança: 🟢

- [ ] T-07, Configurar `package.json` com scripts e dependências
  - Origem no legado: `package.json`
  - Critério de pronto: nodemailer, vitest, jsdom, fake-indexeddb, tailwindcss
  - Confiança: 🟢

- [ ] T-08, Adicionar orientation overlay no HTML (modo retrato)
  - Origem no legado: `index.html:131-137`
  - Critério de pronto: Overlay visível em landscape em mobile
  - Confiança: 🟢

## Tarefas de Teste

- [ ] TT-01, Verificar HTML válido com 5 seções
- [ ] TT-02, Verificar sw.js registra e cacheia assets
- [ ] TT-03, Verificar netlify.toml redireciona /api/send
- [ ] TT-04, Verificar `npm run build:css` gera tailwind.css
- [ ] TT-05, Verificar `npm test` roda suite de testes

## Ordem Sugerida

1. T-03, T-07 (build tooling)
2. T-01, T-02, T-08 (HTML + CSS)
3. T-04 (PWA manifest)
4. T-05 (SW)
5. T-06 (deploy config)
6. Testes na ordem correspondente

## Lacunas Pendentes (🔴)

Nenhuma.

---

*Fim das tarefas de globals.*

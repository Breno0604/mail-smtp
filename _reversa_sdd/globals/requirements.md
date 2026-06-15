# Globals, Requisitos

> Gerado pelo Redator em 2026-06-15
> Cobre os arquivos: `index.html`, `sw.js`, `netlify.toml`, `package.json`, `manifest.json`, `style.css`, `tailwind.css`

---

## Visão Geral

Arquivos de configuração globais e entry points do sistema. Definem a estrutura do projeto, deploy, PWA, cache offline e construção de CSS.

## Responsabilidades

- **index.html**: Entry point do SPA — 5 seções flat + sidebar + modals + meta tags PWA
- **sw.js**: Service Worker cache-first com suporte offline para assets estáticos
- **netlify.toml**: Configuração de build, headers e redirects para Netlify
- **package.json**: Dependências npm (nodemailer, vitest, tailwindcss, jsdom, etc.)
- **manifest.json**: Configuração PWA (standalone, portrait, icons)
- **style.css**: Estilos customizados complementares ao Tailwind
- **tailwind.css**: Saída compilada do Tailwind (via `npm run build:css`)

## Regras de Negócio (Configuração)

- RN01: CACHE_NAME em sw.js deve ser incrementado sempre que assets estáticos mudarem 🟢
- RN02: SW usa estratégia cache-first para GET requests (exceto `/api/` e non-GET) 🟢
- RN03: SW cacheia 23 scripts JS + HTML + CSS + manifest + icons 🟢
- RN04: Navigate requests usam network-first com fallback para index.html 🟢
- RN05: Cache antigo é limpo no activate (qualquer nome diferente de CACHE_NAME) 🟢
- RN06: `/api/send` é redirecionado para `/.netlify/functions/send` (status 200) 🟢
- RN07: sw.js e manifest.json têm headers especiais de cache (no-cache e 1h) 🟢
- RN08: Ícones têm cache público imutável por 1 ano 🟢
- RN09: Build command é `npm install` (sem build step adicional) 🟢
- RN10: Tailwind é pré-compilado via `npm run build:css` (não usa CDN) 🟢
- RN11: Aplicação roda em modo standalone PWA (manifest.json display: standalone) 🟢
- RN12: Orientação forçada para portrait 🟢
- RN13: HTML possui overlay de orientação (gire o celular) + 4 modais 🟢
- RN14: Top-level await não é usado — app.js usa DOMContentLoaded 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Renderizar 5 seções do formulário | Must | index.html contém sec-inicio, sec-retorno, sec-equipamentos, sec-anexos, sec-revisao |
| RF-02 | Registrar service worker | Must | sw-update.js registra sw.js; sw.js cacheia assets estáticos |
| RF-03 | Oferecer suporte offline para assets | Should | SW cache-first permite carregar app sem rede |
| RF-04 | Build automático no Netlify | Must | netlify.toml com build command `npm install` |
| RF-05 | API redirect | Must | /api/send → /.netlify/functions/send |
| RF-06 | PWA standalone | Should | manifest.json com display standalone, portrait, icons |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência | Confiança |
|------|--------------------|-----------|-----------|
| Performance | SW cache-first reduz carregamento | `sw.js:87-108` | 🟢 |
| Performance | Tailwind pré-compilado (sem runtime) | `package.json` script build:css | 🟢 |
| Deploy | Zero-config Netlify | `netlify.toml` | 🟢 |
| Compatibilidade | jsdom nos testes | `package.json` devDependencies | 🟢 |
| Compatibilidade | fake-indexeddb nos testes | `package.json` devDependencies | 🟢 |

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| HTML entry point | Must | Ponto de entrada |
| Deploy config | Must | Necessário para publicar |
| PWA / SW | Should | Melhoria de UX offline |
| Tailwind build | Should | Estilo consistente |

## Rastreabilidade de Código

| Arquivo | Propósito | Cobertura |
|---------|-----------|-----------|
| `index.html` | Entry point SPA + modais + sidebar + overlay | 🟢 |
| `sw.js` | Service Worker cache-first | 🟢 |
| `netlify.toml` | Build + headers + redirects | 🟢 |
| `package.json` | Dependências e scripts | 🟢 |
| `manifest.json` | PWA manifest | 🟢 |
| `style.css` | Estilos customizados | 🟢 |
| `tailwind.css` | Tailwind compilado | 🟢 |
| `tailwind-input.css` | Entrada Tailwind (directives) | 🟢 |

---

*Fim dos requisitos de globals.*

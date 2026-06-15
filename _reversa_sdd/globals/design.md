# Globals, Design

> Gerado pelo Redator em 2026-06-15

---

## Estrutura de Pastas

```
mail-mvp/
├── index.html              # Entry point SPA
├── style.css               # Estilos customizados
├── tailwind.css            # Tailwind compilado
├── tailwind-input.css      # Entrada Tailwind (@tailwind directives)
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
├── netlify.toml            # Configuração Netlify
├── package.json            # Dependências npm
├── scripts/                # 23 módulos JS
├── netlify/functions/      # 1 Netlify Function
├── tests/                  # Testes Vitest
├── icons/                  # PWA icons (192, 512)
└── node_modules/           # Dependências (não versionado)
```

## Service Worker — Estratégia de Cache

```
install:
  └─ caches.open(CACHE_NAME)
     └─ cache.addAll(STATIC_ASSETS)  // 23 scripts + HTML + CSS + icons

activate:
  └─ caches.keys()
     └─ delete all keys != CACHE_NAME  // Limpa caches antigos

fetch:
  ├─ if non-GET → bypass
  ├─ if /api/* → bypass
  ├─ if navigate → network-first, fallback index.html
  └─ else → cache-first
            ├─ hit → return cached
            └─ miss → fetch + cache + return
```

## Netlify Deploy

```
Build command: npm install
Functions:     netlify/functions
Publish:       . (raiz)

Redirects:
  /api/send  →  /.netlify/functions/send  (status 200)

Headers:
  /sw.js           →  Cache-Control: no-cache
  /manifest.json   →  Cache-Control: public, max-age=3600
  /icons/*         →  Cache-Control: public, max-age=31536000, immutable
```

## HTML — Estrutura de Seções

```
body
├─ .container (max-w-[640px])
│  ├─ Header (hamburger + título + btn-novo)
│  ├─ Error msg
│  ├─ Section 1: Início (id="sec-inicio")
│  ├─ Section 2: Retorno (id="sec-retorno")
│  ├─ Section 3: Equipamentos (id="sec-equipamentos")
│  ├─ Section 4: Anexos (id="sec-anexos")
│  ├─ Section 5: Revisão (id="sec-revisao")
│  └─ Send button
├─ Sidebar + overlay
├─ Toast
├─ Modals: dup-modal, lightbox, confirm-modal, update-modal
└─ Orientation overlay
```

## Modais

| Modal | ID | Gatilho | Conteúdo |
|-------|-----|---------|----------|
| Duplicidade | `dup-modal` | Reenvio de registro sent | Título + corpo + Cancelar/Reenviar |
| Lightbox | `lightbox` | Click na thumbnail | Imagem ampliada + fechar |
| Confirmação | `confirm-modal` | Excluir registro | Mensagem + Cancelar/Confirmar |
| Atualização SW | `update-modal` | controllerchange | "Sistema atualizado" + OK |

## PWA

```json
{
  "display": "standalone",     // Sem barra de navegação do browser
  "orientation": "portrait",   // Força retrato
  "background_color": "#e5e7eb",
  "theme_color": "#2563eb",    // Azul Tailwind primary
  "icons": [192, 512]          // Duas resoluções
}
```

## Stack de Build

```
npm run build:css
  └─ tailwindcss -i tailwind-input.css -o tailwind.css --minify

npm test
  └─ vitest run

npm run test:watch
  └─ vitest
```

## Dependências Chave

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `nodemailer` | ^6.9.0 | SMTP no backend (Netlify Function) |
| `vitest` | ^4.1.8 | Test runner |
| `jsdom` | ^29.1.1 | DOM simulada nos testes |
| `fake-indexeddb` | ^6.2.5 | IndexedDB mock nos testes |
| `tailwindcss` | ^3.4.19 | Framework CSS utilitário |

---

*Fim do design de globals.*

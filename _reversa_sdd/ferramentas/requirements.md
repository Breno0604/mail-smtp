# Ferramentas, Requisitos

> Gerado pelo Redator em 2026-06-15
> Cobre os módulos: `scripts/app.js`, `scripts/ui.js`, `scripts/utils.js`, `scripts/dom.js`, `scripts/send.js`, `scripts/sw-update.js`, `scripts/styles.js`

---

## Visão Geral

Módulos de infraestrutura que dão suporte a todas as features. Incluem: orquestração da aplicação (app.js), UI toolkit (toast, modais, erros), utilitários (conversão de arquivos, geolocalização, datas), cache DOM, envio de email (orquestração frontend), service worker e constantes de estilo.

## Responsabilidades

- **app.js**: Orquestrar inicialização, eventos globais, filled-class tracking, persistence trigger
- **ui.js**: Gerenciar toast, erros, field errors, modal de confirmação
- **utils.js**: Utilitários: toBase64, blobToBase64, base64ToBlob, loadImage, formatDate, captureCoordinates
- **dom.js**: Cache centralizado de elementos DOM (cacheDOM() + objeto DOM)
- **send.js**: Orquestrar envio de email (validateAll → checkDuplicate → compress → fetch)
- **sw-update.js**: Registrar service worker, detectar atualizações, exibir modal de reload
- **styles.js**: Constantes de classes CSS (Tailwind) compartilhadas

## Regras de Negócio

- RN01: App inicia com `clearCurrentUUID()` — sempre começa limpo 🟢
- RN02: Save automático só é habilitado quando UC + OS estão preenchidos (`checkInitialPersistence()`) 🟢
- RN03: Eventos globais `input` e `change` disparam `debouncedSave()`, `updateLivePreview()` e `updateFilledClass()` 🟢
- RN04: Pointerdown fora de input/select/textarea/button dá blur no elemento ativo 🟢
- RN05: Toast desaparece automaticamente após 3.5s 🟢
- RN06: `showConfirm()` retorna Promise<boolean> com limpeza de listeners após uso 🟢
- RN07: `captureCoordinates()` tenta geolocalização com timeout 10s; fallback para "Não disponível" 🟢
- RN08: `compressAttachments` é chamada durante o envio, não durante o salvamento 🟢
- RN09: Subject do email é composto como `OS #<os> - UC <uc> - <tipoLabel>` 🟢
- RN10: Service worker registrado e atualizado via `registration.update()`; controllerchange dispara modal de reload 🟢
- RN11: `INPUT_CLASS` e `SELECT_CLASS` em styles.js evitam duplicação de strings Tailwind 🟢
- RN12: Envio de email falha com toast "Erro de conexão" se fetch lançar exceção 🟢
- RN13: `updateRecordStatus` é chamado após envio bem-sucedido para marcar como "sent" 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Inicializar aplicação no DOMContentLoaded | Must | `cacheDOM()`, `initSidebarFilter()`, `renderIniciais()`, `initEvents()`, etc. |
| RF-02 | Gerenciar filled classes dinamicamente | Must | `updateFilledClass()` add/remove `.is-filled` |
| RF-03 | Salvar automaticamente com debounce | Must | Input/change → debouncedSave() |
| RF-04 | Atualizar preview de email ao vivo | Must | Input/change → updateLivePreview() |
| RF-05 | Exibir toast de feedback | Must | `showToast(msg, success)` com auto-hide 3.5s |
| RF-06 | Exibir/esconder erro global | Must | `showError(msg)` / `hideError()` |
| RF-07 | Exibir/esconder erro de campo | Must | `setFieldError(el, msg)` / `clearFieldError(el)` |
| RF-08 | Exibir modal de confirmação | Must | `showConfirm(msg)` → Promise<boolean> |
| RF-09 | Orquestrar envio completo | Must | `sendEmail()` → validateAll → checkDuplicate → compress → fetch → updateRecordStatus |
| RF-10 | Capturar coordenadas geográficas | Should | `captureCoordinates()` → campo `coordenadas` |
| RF-11 | Registrar service worker com update detection | Should | `initSW()` registra sw.js, mostra modal em controllerchange |
| RF-12 | Cache DOM centralizado | Must | `cacheDOM()` popula objeto `DOM` com todos os elementos |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência | Confiança |
|------|--------------------|-----------|-----------|
| Performance | DOM cache evita getElementById repetidos | `dom.js` | 🟢 |
| Performance | Constantes CSS compartilhadas | `styles.js` | 🟢 |
| UX | Toast auto-dismiss 3.5s | `ui.js:21` | 🟢 |
| UX | Scroll suave no "Novo Formulário" | `app.js:45-50` | 🟢 |
| Confiabilidade | Fallback geolocalização "Não disponível" | `utils.js:53,69` | 🟢 |
| Offline | Service Worker cache-first | `sw-update.js` | 🟢 |

## Critérios de Aceitação

```gherkin
Dado que a página carrega
Quando DOMContentLoaded dispara
Então DOM é cacheado, sidebar filter iniciado, iniciais renderizados, eventos ligados
E UUID é limpo (clearCurrentUUID)

Dado que o usuário digita em qualquer input
Quando o evento input dispara
Então filled class é atualizada, debouncedSave e updateLivePreview são chamados

Dado que UC e OS estão preenchidos
E iniciaisValido é false
Então iniciaisValido é setado e saveState é disparado imediatamente

Dado que o usuário clica em Enviar
Quando sendEmail() é chamado
Então validateAll é executado, checkDuplicate verifica, compressAttachments processa, fetch POST /api/send

Dado que o envio é bem-sucedido
Então toast de sucesso aparece e updateRecordStatus marca como sent

Dado que o service worker detecta atualização
Então modal de reload é exibido
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Inicialização | Must | Ponto de entrada |
| DOM Cache | Must | Todas as features dependem |
| Eventos + auto-save | Must | Persistência automática |
| Toast / Erro / Confirm | Must | Feedback de UX |
| Envio completo | Must | Funcionalidade principal |
| Geolocalização | Should | Dado útil para OS de campo |
| Service Worker | Should | PWA/offline |
| CSS Constants | Should | Legibilidade |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `scripts/app.js` | `checkInitialPersistence()`, `updateFilledClass()`, `updateAllFilledClasses()`, `initEvents()`, DOMContentLoaded handler | 🟢 |
| `scripts/ui.js` | `showError()`, `hideError()`, `showToast()`, `setFieldError()`, `clearFieldError()`, `showConfirm()` | 🟢 |
| `scripts/utils.js` | `toBase64()`, `blobToBase64()`, `base64ToBlob()`, `loadImage()`, `formatDate()`, `captureCoordinates()` | 🟢 |
| `scripts/dom.js` | `cacheDOM()`, `DOM` | 🟢 |
| `scripts/send.js` | `sendEmail()` | 🟢 |
| `scripts/sw-update.js` | `initSW()`, `showUpdateModal()` | 🟢 |
| `scripts/styles.js` | `INPUT_CLASS`, `SELECT_CLASS` | 🟢 |

---

*Fim dos requisitos de ferramentas.*

---
schemaVersion: 1
generatedAt: 2026-06-15T18:20:00-03:00
reversa:
  version: "1.2.43"
  kind: screen_modernization_decision
  producedBy: screen-translator
  decidedBy: Breno
  decidedAt: 2026-06-15T18:20:00-03:00
  mode: modernized
  sourcePlatform: html-legacy
  targetPlatform: web-spa
  hash: "sha256:placeholder"
---

# Decisão de Modernização de Telas

> Decisão consciente sobre como traduzir as telas do sistema legado: paridade observável byte-a-byte, redesign idiomático para a plataforma alvo, ou combinação tela-a-tela.

## Contexto

- **Plataforma origem detectada**: `html-legacy` (HTML + vanilla JS ES6 modules + Tailwind CSS estático)
- **Confiança**: 🟢 CONFIRMADO
- **Plataforma alvo**: `web-spa` (Vue 3 + Vite + TypeScript + Tailwind via PostCSS)
- **Telas inventariadas**: 9
- **Origem do inventário**: `_reversa_sdd/screens/inventory.json` (construído a partir de `_reversa_sdd/inventory.md` + código-fonte)
- **Adapter aplicado**: `html_legacy__spa` (formato `route-component`)
- **Design system**: Tokens derivados em `_reversa_sdd/design-system/tokens-derived.md` (cores, tipografia, espaçamentos extraídos do Tailwind legado)

## Modos avaliados

### Modo: literal
- **Definição**: Reimplementar o HTML/CSS/JS atual como templates Vue, preservando estrutura DOM, classes Tailwind e hierarquia visual 1-para-1.
- **Trade-offs**:
  - Custo de implementação: baixo (só traduzir sintaxe)
  - Fidelidade visual: alta (mesmo layout)
  - Viabilidade de parity tests construtivos: parcial (comparação visual + dados)
  - Aceitação esperada do usuário final: alta (idêntico)
  - Débito técnico futuro: alto (perpetua acoplamento entre markup e lógica)
- **Recomendado**: não
- **Justificativa**: Embora viável (origem e alvo são ambos web), modo literal contradiz a decisão transformacional já tomada em `paradigm_decision.md` e impediria os ganhos de componentização do Vue.

### Modo: modernizado
- **Definição**: Cada seção do formulário vira um componente Vue independente com scoped CSS, composables para lógica de negócio, Pinia para estado, Vue Router para navegação (futura). Aparência geral preservada (Tailwind continua), mas estrutura interna é nativa Vue.
- **Trade-offs**:
  - Custo de implementação: médio (reorganização completa)
  - Fidelidade visual: alta (Tailwind mantém mesmas classes)
  - Viabilidade de parity tests construtivos: sim (dados de entrada/saída + comportamento)
  - Aceitação esperada do usuário final: alta (visualmente idêntico)
  - Débito técnico futuro: baixo (componentes isolados e reutilizáveis)
- **Recomendado**: sim ✅
- **Justificativa**: Alinhado com a decisão transformacional (Opção 1 do paradigm advisor). A aparência visual permanece a mesma (Tailwind), mas a arquitetura interna passa a ser component-based reativa.

### Modo: híbrido
- **Definição**: Seções core do formulário (inicio, retorno, equipamentos, anexos) modernizadas em componentes Vue; modais e sidebar mantidas em estilo literal (Wrapped como componentes mas com markup legado).
- **Trade-offs**:
  - Custo de implementação: médio-alto (dois estilos coexistem)
  - Fidelidade visual mista: alta em ambos
  - Viabilidade de parity tests: parcial (testar dois padrões)
  - Custo de manutenção da separação: médio (equipe precisa conhecer ambos)
- **Recomendado**: não
- **Justificativa**: Inconsistência arquitetural desnecessária para um sistema de 1.889 LOC. O Big Bang permite reescrever tudo de uma vez sem precisar manter compatibilidade.

## Decisão

- **Modo escolhido**: modernizado
- **Justificativa do humano**: Optou pela modernização completa, consistente com a decisão transformacional do pipeline.
- **Alternativas descartadas**: literal (perpetua dívida técnica), híbrido (complexidade desnecessária)
- **Decidido em**: 2026-06-15T18:20:00-03:00
- **Decidido por**: Breno

## Implicações pendentes para a Fase 2

| Etapa | Implicação | Como honrar |
|---|---|---|
| Geração de `target_screens.md` | Cada tela vira uma spec no formato `route-component` com hierarquia de componentes Vue | Gerar YAML por tela com `spec.kind: route-component`, árvore de componentes, tokens, eventos |
| Captura de golden files | Como não há oráculo executável (legado é web estático), golden files opcionais | Emitir `manifest.yaml` com sugestões de captura manual via screenshot |
| Tokens do design-system | Tokens derivados das classes Tailwind do legado | Usar `_reversa_sdd/design-system/tokens-derived.md` como fonte |
| Conteúdo textual | Preservar literalmente todos os labels, mensagens e placeholders | Labels copiados de `fields.js`, mensagens copiadas de `ui.js` e `duplicate.js` |

## Implicações para o Inspector

- **Estratégia de paridade**: Contrato semântico (eventos, transições, conteúdo textual, estados), sem comparação visual byte-a-byte.
- **Deviations conhecidas a propagar**: Nenhuma no modo modernizado.
- **Bateria de parity tests**: deve verificar que cada tela renderiza com os mesmos dados de entrada, produz os mesmos outputs e transiciona para os mesmos estados.

## Notas
- As duas screenshots existentes (`screnns/etapa_iniciais.jpeg`, `screnns/aba_lateral.jpeg`) servem como referência visual para o codificador, não como golden files.
- Conteúdo textual preservado literalmente: nenhuma revisão linguística foi aprovada.
- O modo modernizado permite que o codificador use os patterns nativos do Vue 3 sem precisar emular o legado.

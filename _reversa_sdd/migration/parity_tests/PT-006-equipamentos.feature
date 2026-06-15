# language: pt
# spec-id: PT-006
# rastreabilidade:
#   target_business_rules: BR-MIGRAR-017 a BR-MIGRAR-019
#   target_architecture: features/equipamentos/, useEquipamentoStore
#   target_screens: SCR-04 (Sec-Equipamentos)
#   target_domain_model: AGG-Equipment
#   paradigma_alvo: component-based reativo (Vue 3 + Pinia + Zod)

Funcionalidade: CRUD de equipamentos
  Como técnico de campo
  Quero adicionar, remover e validar equipamentos da OS
  Para registrar o que foi instalado ou retirado

  @paridade @invariante
  Cenário: Adicionar equipamento válido
    Dado que a lista de equipamentos está vazia
    Quando eu seleciono status "Instalado"
    E eu seleciono categoria "Medidor"
    E eu preencho número "12345"
    E eu clico em "Adicionar"
    Então a lista exibe 1 equipamento
    E o equipamento exibe "Instalado - Medidor - 12345"

  @paridade @invariante
  Cenário: Número de equipamento duplicado é rejeitado
    Dado que a lista contém equipamento "Instalado - Medidor - 12345"
    Quando eu tento adicionar "Retirado - Display - 12345"
    Então uma mensagem de erro é exibida: "Número de equipamento já existe"
    E a lista ainda contém apenas 1 equipamento

  @paridade @invariante
  Cenário: Número com zeros à esquerda é normalizado
    Dado que a lista de equipamentos está vazia
    Quando eu preencho número "00123"
    Então o número é normalizado para "123"

  @paridade
  Cenário: Seção de equipamentos é opcional
    Dado que a lista de equipamentos está vazia
    Quando eu valido o formulário completo
    Então a seção de equipamentos não gera erros (é válida)

  @paridade @invariante
  Cenário: Remover equipamento
    Dado que a lista contém 2 equipamentos
    Quando eu clico em "Remover" no primeiro equipamento
    Então a lista contém 1 equipamento

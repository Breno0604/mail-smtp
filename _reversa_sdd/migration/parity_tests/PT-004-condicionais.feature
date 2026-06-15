# language: pt
# spec-id: PT-004
# rastreabilidade:
#   target_business_rules: BR-MIGRAR-001 a BR-MIGRAR-003, BR-MIGRAR-009
#   target_architecture: features/retorno/, composables/useConditionalFields
#   target_screens: SCR-03 (Sec-Retorno)
#   target_domain_model: BC-Retorno
#   paradigma_alvo: component-based reativo (Vue 3 + computed + Zod)

Funcionalidade: Campos condicionais de retorno
  Como técnico de campo
  Quero que os campos de retorno apareçam ou desapareçam conforme o tipo de ordem e valores de outros campos
  Para que eu só veja campos relevantes para o serviço atual

  @paridade @invariante @critico
  Cenário: Campo aparece quando condição é atendida (string)
    Dado que o tipo de ordem selecionado é "CORTE POR FALTA DE PAGAMENTO"
    E o campo "situacao_corte" depende de "notificado" = "SIM"
    Quando eu seleciono "SIM" no campo notificado
    Então o campo "situacao_corte" fica visível

  @paridade @invariante
  Cenário: Campo some quando condição não é atendida
    Dado que o tipo de ordem selecionado é "CORTE POR FALTA DE PAGAMENTO"
    E o campo "situacao_corte" está visível (notificado = "SIM")
    Quando eu mudo notificado para "NÃO"
    Então o campo "situacao_corte" fica oculto
    E o valor de "situacao_corte" é zerado

  @paridade @invariante
  Cenário: Condição com array (any match)
    Dado que o tipo de ordem selecionado tem campo "motivo_inspecao" que depende de "situacao_corte" = ["CORTADO", "RELIGADO"]
    Quando eu seleciono "CORTADO" em situacao_corte
    Então o campo "motivo_inspecao" fica visível

  @paridade @invariante
  Cenário: Condição com negação
    Dado que o tipo de ordem selecionado tem campo que aparece apenas quando "situacao_corte" NÃO é "NORMAL"
    Quando eu seleciono "NORMAL" em situacao_corte
    Então o campo condicional fica oculto

  @paridade @invariante
  Cenário: Mudar tipo de ordem descarta dados de retorno
    Dado que o tipo de ordem "CORTE POR FALTA DE PAGAMENTO" está selecionado
    E o campo "situacao_corte" está preenchido com "CORTADO"
    Quando eu mudo o tipo de ordem para "LIGACAO NOVA"
    Então todos os campos de retorno são limpos
    E o campo "situacao_corte" não existe mais

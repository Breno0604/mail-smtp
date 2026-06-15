# language: pt
# spec-id: PT-008
# rastreabilidade:
#   target_business_rules: BR-MIGRAR-001, BR-MIGRAR-009, RNI14
#   target_architecture: features/retorno/, useConditionalFields, useRetornoStore
#   target_screens: SCR-02 (Sec-Inicio), SCR-03 (Sec-Retorno)
#   target_domain_model: BC-Retorno, BC-Inicio
#   paradigma_alvo: component-based reativo (Vue 3 + watch + Pinia)

Funcionalidade: Mudança de tipo de ordem
  Como técnico de campo
  Quero que ao trocar o tipo de ordem, os campos de retorno sejam atualizados corretamente
  Para que cada tipo de OS tenha seus campos específicos

  @paridade @invariante @critico
  Cenário: Selecionar tipo de ordem carrega campos de retorno
    Dado que nenhum tipo de ordem está selecionado
    E a seção de retorno exibe "Selecione um Tipo de Ordem..."
    Quando eu seleciono "CORTE POR FALTA DE PAGAMENTO"
    Então a seção de retorno exibe os campos específicos para corte
    E o placeholder desaparece

  @paridade @invariante
  Cenário: Mudar tipo de ordem descarta dados anteriores
    Dado que "CORTE POR FALTA DE PAGAMENTO" está selecionado
    E eu preenchi "situacao_corte" com "CORTADO"
    Quando eu mudo para "LIGACAO NOVA MEDIA TENSAO"
    Então todos os campos de retorno são resetados
    E "situacao_corte" não está mais presente
    E os campos de "LIGACAO NOVA MEDIA TENSAO" aparecem

  @paridade @invariante
  Cenário: Condicionais reavaliados ao mudar tipo de ordem pai
    Dado que "CORTE POR FALTA DE PAGAMENTO" está selecionado
    E o campo "motivo_inspecao" depende de "situacao_corte" = "CORTADO"
    Quando eu seleciono "CORTADO" em situacao_corte
    Então "motivo_inspecao" fica visível
    Quando eu mudo situacao_corte para "NORMAL"
    Então "motivo_inspecao" fica oculto
    E seu valor é zerado

  @paridade
  Cenário: 41 tipos de ordem disponíveis
    Dado que o formulário está vazio
    Quando eu abro o select "TIPO DE ORDEM"
    Então existem exatamente 41 opções (excluindo "Selecione")
    E os nomes correspondem exatamente aos definidos em fields.js

  @paridade @invariante
  Cenário: Campo descrição (FIELD_DESCRICAO) é renderizado como texto não editável
    Dado que o tipo de ordem selecionado possui FIELD_DESCRICAO configurado
    Quando a seção de retorno é renderizada
    Então o campo descrição aparece como texto estático (não input)

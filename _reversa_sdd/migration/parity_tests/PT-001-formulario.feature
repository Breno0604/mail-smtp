# language: pt
# spec-id: PT-001
# rastreabilidade:
#   target_business_rules: BR-MIGRAR-001 a BR-MIGRAR-010, BR-MIGRAR-026 a BR-MIGRAR-036
#   target_architecture: features/inicio/, shared/lib/validation
#   target_screens: SCR-02 (Sec-Inicio)
#   paradigma_alvo: component-based reativo (Vue 3 + Zod + VeeValidate)

Funcionalidade: Preenchimento e validação do formulário
  Como técnico de campo
  Quero preencher os dados da OS com validação inline
  Para garantir que o registro está correto antes do envio

  @paridade @invariante @critico
  Cenário: Preencher campos obrigatórios e avançar
    Dado que o formulário está vazio
    Quando eu preencho UC com "123456"
    E eu preencho OS com "OS-2024-001"
    E eu seleciono tipo de ordem "CORTE POR FALTA DE PAGAMENTO"
    E eu seleciono data atual
    E eu preencho hora início "08:00"
    E eu preencho hora fim "12:00"
    Então a seção Início não exibe erros de validação
    E o botão "Enviar OS" está habilitado

  @paridade @invariante
  Cenário: UC com caracteres não numéricos exibe erro
    Dado que o formulário está vazio
    Quando eu preencho UC com "ABC123"
    E eu saio do campo (blur)
    Então uma mensagem de erro é exibida: "UC deve conter apenas dígitos"
    E o campo UC tem borda vermelha

  @paridade @invariante
  Cenário: Data futura é rejeitada
    Dado que o formulário está vazio
    Quando eu seleciono data igual a amanhã
    E eu saio do campo (blur)
    Então uma mensagem de erro é exibida: "Data não pode ser futura"

  @paridade @invariante
  Cenário: Hora fim igual a hora início é rejeitada
    Dado que o formulário está vazio
    Quando eu preencho hora início "08:00"
    E eu preencho hora fim "08:00"
    E eu saio do campo hora fim (blur)
    Então uma mensagem de erro é exibida informando que as horas devem ser diferentes

  @paridade
  Cenário: Placeholder "Selecione" aparece em selects
    Dado que o formulário está vazio
    Quando eu abro o select "TIPO DE ORDEM"
    Então a primeira opção é "Selecione" (disabled)

  @paridade
  Cenário: Botão de coordenadas captura localização
    Dado que o formulário está vazio
    Quando eu clico no botão de refresh ao lado do campo coordenadas
    E a geolocalização retorna "-3.123, -45.456"
    Então o campo coordenadas exibe "-3.123, -45.456"

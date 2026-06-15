# language: pt
# spec-id: PT-005
# rastreabilidade:
#   target_business_rules: BR-MIGRAR-011 a BR-MIGRAR-016
#   target_architecture: features/anexos/, composables/useImageCompression
#   target_screens: SCR-05 (Sec-Anexos)
#   paradigma_alvo: component-based reativo (Vue 3 + composable + canvas API)

Funcionalidade: Anexos com compressão
  Como técnico de campo
  Quero anexar fotos da OS com compressão automática
  Para que o email não ultrapasse limites de tamanho

  @paridade
  Cenário: Adicionar anexo dentro do limite
    Dado que existem 0 anexos atualmente
    Quando eu seleciono um arquivo de imagem de 500KB
    Então o anexo aparece na lista de anexos
    E a contagem exibe "1/12 anexos"

  @paridade
  Cenário: Máximo de 12 anexos
    Dado que existem 12 anexos atualmente
    Quando eu tento adicionar mais um anexo
    Então o upload é rejeitado
    E uma mensagem de erro informa: "Máximo de 12 anexos atingido"

  @paridade
  Cenário: Arquivo maior que 8MB é rejeitado
    Dado que o formulário está na seção de anexos
    Quando eu seleciono um arquivo de 10MB
    Então o upload é rejeitado
    E uma mensagem de erro informa: "Anexo muito grande. Máximo 8MB."

  @paridade
  Cenário: Imagem pequena não passa por compressão
    Dado que a imagem selecionada tem 500KB (menor que 670KB)
    Quando o upload é processado
    Então a imagem não é comprimida
    E ela é armazenada como base64 original

  @paridade
  Cenário: Imagem grande é comprimida progressivamente
    Dado que a imagem selecionada tem 2MB
    Quando o upload é processado
    Então a imagem passa por compressão (canvas API)
    E o resultado é salvo como "{nome}_red.jpg"
    E o tamanho final é menor que 2MB

  @paridade
  Cenário: Remover anexo
    Dado que existem 3 anexos na lista
    Quando eu clico no botão de remover do primeiro anexo
    Então o anexo é removido
    E a contagem exibe "2/12 anexos"

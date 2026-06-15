# language: pt
# spec-id: PT-002
# rastreabilidade:
#   target_business_rules: BR-MIGRAR-020 a BR-MIGRAR-025, BR-HUMANA-002
#   target_architecture: features/email/, netlify/functions/send.ts
#   target_screens: SCR-06 (Sec-Revisao)
#   paradigma_alvo: component-based reativo (Vue 3 + função pura composeEmail)

Funcionalidade: Envio de email
  Como técnico de campo
  Quero enviar a OS por email após preencher todos os dados
  Para que o relatório chegue ao destino corporativo

  @paridade @contrato @critico
  Cenário: Enviar OS com dados completos
    Dado que o formulário está preenchido com dados válidos
    E UC "123456"
    E OS "OS-2024-001"
    E tipo de ordem "CORTE POR FALTA DE PAGAMENTO"
    E data "15/06/2026"
    E hora início "08:00" e hora fim "12:00"
    E existem 2 anexos anexados
    Quando eu clico em "Enviar OS"
    Então o sistema chama POST /api/send com subject "OS #OS-2024-001 - UC 123456 - CORTE POR FALTA DE PAGAMENTO"
    E o corpo do email contém "UC: 123456"
    E o corpo do email contém "OS: OS-2024-001"
    E o corpo do email contém "DATA: 15/06/2026"
    E o corpo do email contém "HORA INICIO: 08:00"
    E o corpo do email contém "HORA FIM: 12:00"
    E o corpo do email contém "RETORNO"
    E o corpo do email NÃO contém campos ocultos
    E o status do registro muda para "sent"
    E um toast de sucesso é exibido

  @paridade @contrato
  Cenário: Erro de rede ao enviar
    Dado que o formulário está preenchido com dados válidos
    E a Netlify Function retorna erro 500
    Quando eu clico em "Enviar OS"
    Então um toast de erro é exibido
    E o status do registro permanece "draft"
    E o formulário mantém todos os dados preenchidos

  @paridade @contrato
  Cenário: composeEmail() gera texto normalizado
    Dado que composeEmail() recebe dados com acentos
    Quando a função processa os dados
    Então o texto retornado está em MAIÚSCULAS
    E o texto retornado não contém acentos
    E o texto retornado substitui ç por c

  @paridade
  Cenário: Seção de equipamentos só aparece se houver equipamentos
    Dado que o formulário está preenchido sem equipamentos
    Quando o email é composto
    Então o corpo do email não contém a seção "EQUIPAMENTOS"

  @paridade
  Cenário: Seção de retorno sempre presente (mesmo vazia)
    Dado que o formulário está preenchido sem tipo de ordem selecionado
    Quando o email é composto
    Então o corpo do email contém a seção "RETORNO" (vazia)

  @paridade @contrato
  Cenário: Datas são invertidas no email
    Dado que a data selecionada é "2026-06-15"
    Quando composeEmail() processa os dados
    Então a data no corpo do email aparece como "15-06-2026"

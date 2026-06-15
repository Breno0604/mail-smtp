# language: pt
# spec-id: PT-003
# rastreabilidade:
#   target_business_rules: BR-MIGRAR-037 a BR-MIGRAR-042, BR-MIGRAR-058 a BR-MIGRAR-060
#   target_architecture: entities/record/, entities/attachment/, shared/lib/db.ts
#   target_domain_model: AGG-Record, AGG-Attachment
#   paradigma_alvo: component-based reativo (Vue 3 + Pinia + IndexedDB)

Funcionalidade: Persistência e restauração de registros
  Como técnico de campo
  Quero que meus dados sejam salvos automaticamente e恢复ados quando necessário
  Para não perder o trabalho em caso de fechamento acidental ou offline

  @paridade @invariante
  Cenário: Auto-save salva quando UC e OS estão preenchidos
    Dado que o formulário está vazio
    Quando eu preencho UC "123456"
    E eu preencho OS "OS-2024-001"
    Então após 1 segundo (debounce), um registro é salvo no IndexedDB com status "draft"

  @paridade @invariante
  Cenário: Auto-save NÃO salva sem UC e OS
    Dado que o formulário está vazio
    Quando eu preencho apenas UC "123456"
    Então após 1 segundo, NENHUM registro é salvo no IndexedDB

  @paridade @invariante
  Cenário: Auto-save NÃO salva com formulário vazio
    Dado que o formulário está vazio
    Quando nenhum campo é preenchido
    Então após 1 segundo, NENHUM registro é salvo no IndexedDB

  @paridade @invariante
  Cenário: UUID é gerado e único
    Dado que o formulário está vazio
    Quando eu preencho UC "123456" e OS "OS-001"
    E eu salvo o registro
    Então o registro possui um uuid válido (formato UUID v4)
    E o uuid é diferente de qualquer outro registro existente

  @paridade
  Cenário: Restaurar registro preenche formulário completo
    Dado que existe um registro salvo com UC "123456", OS "OS-001", tipo "CORTE"
    E este registro tem 2 equipamentos e 1 anexo
    Quando eu clico no registro na sidebar
    Então o formulário exibe UC "123456"
    E o formulário exibe OS "OS-001"
    E o formulário exibe tipo de ordem "CORTE"
    E a seção de equipamentos mostra 2 equipamentos
    E a seção de anexos mostra 1 anexo

  @paridade @invariante
  Cenário: Exclusão atômica (registro + anexos)
    Dado que existe um registro com uuid X e 3 anexos
    Quando eu excluo o registro
    Então o registro X não existe mais no IndexedDB
    E nenhum anexo com uuid X existe no IndexedDB

  @paridade
  Cenário: localStorage mantém backup do formulário atual
    Dado que o formulário está preenchido com UC "123456"
    Quando o auto-save é acionado
    Então localStorage contém a chave "mail_form_estado"
    E o valor contém UC "123456"

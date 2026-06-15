# language: pt
# spec-id: PT-007
# rastreabilidade:
#   target_business_rules: BR-MIGRAR-043 a BR-MIGRAR-048
#   target_architecture: features/sidebar/, useSidebarStore
#   target_screens: SCR-01 (Sidebar)
#   paradigma_alvo: component-based reativo (Vue 3 + Pinia)

Funcionalidade: Sidebar de registros
  Como técnico de campo
  Quero listar, buscar, duplicar, excluir e restaurar registros
  Para gerenciar as OS do dia

  @paridade
  Cenário: Listar registros ordenados por data
    Dado que existem 3 registros com updatedAt diferentes
    Quando a sidebar é carregada
    Então os registros são exibidos do mais recente para o mais antigo

  @paridade
  Cenário: Busca textual filtra resultados
    Dado que existem registros com UC "123456" e "789012"
    Quando eu digito "123" no campo de busca
    Então apenas o registro com UC "123456" é exibido

  @paridade
  Cenário: Busca é case-insensitive
    Dado que existe um registro com OS "OS-2024-001"
    Quando eu digito "os-2024" no campo de busca
    Então o registro é encontrado

  @paridade
  Cenário: Filtro por período (manhã/tarde/noite)
    Dado que existem registros criados às 08:00, 14:00 e 20:00
    Quando eu seleciono o filtro "manhã"
    Então apenas o registro das 08:00 é exibido

  @paridade
  Cenário: Duplicar registro
    Dado que existe um registro com UC "123456", OS "OS-001"
    Quando eu clico em "Duplicar" no registro
    Então um novo registro é criado com mesmo UC e OS
    E o novo registro tem UUID diferente
    E o novo registro tem status "draft"

  @paridade
  Cenário: Excluir registro com confirmação
    Dado que existe um registro
    Quando eu clico em "Excluir"
    Então um modal de confirmação é exibido
    Quando eu confirmo a exclusão
    Então o registro é removido do IndexedDB e da sidebar

  @paridade @invariante
  Cenário: Restaurar registro preenche formulário
    Dado que existe um registro com UC "123456", OS "OS-001", tipo "CORTE"
    E este registro tem 1 equipamento e 2 anexos
    Quando eu clico no registro na sidebar
    Então o formulário exibe os dados do registro
    E a seção de equipamentos exibe 1 equipamento
    E a seção de anexos exibe 2 anexos

# 100 Melhorias de Layout — Formulário de Envio

## Header e Barra Superior (1–10)

1. **Substituir o ícone ☰ hamburger por um ícone SVG mais moderno** — o caractere Unicode `&#9776;` tem renderização inconsistente entre navegadores e plataformas.

2. **Adicionar um tooltip no botão hamburger** — ao tocar e segurar, exibir "Registros salvos" para clareza funcional.

3. **Aumentar a área de toque do botão hamburger** — o padding atual (4px 8px) é pequeno para dedos em telas touch. Mínimo recomendado: 44×44px.

4. **Substituir o botão "+" por um ícone SVG de "mais"** — o caractere `+` puro é muito simples e não transmite claramente "novo formulário".

5. **Adicionar animação de rotação no botão "+" ao tocar** — feedback visual de que a ação foi registrada.

6. **Adicionar sombra sutil no header** — separar visualmente o header do conteúdo ao fazer scroll.

7. **Fixar o header no topo ao rolar** — usar `position: sticky` para manter o título sempre visível.

8. **Adicionar breadcrumb ou subtítulo no header** — exibir "Etapa 1 de 5" ao lado do título para contexto.

9. **Trocar a cor do header para um gradiente sutil** — de `#2563eb` para `#1d4ed8`, dando profundidade visual.

10. **Adicionar ícone do app no header** — um pequeno logo à esquerda do título para reforçar a marca.

---

## Indicadores de Etapa / Tabs (11–20)

11. **Adicionar ícones em cada tab** — um ícone representativo (pessoa, engrenagem, seta, clipe, check) ao lado do texto de cada etapa.

12. **Exibir número da etapa dentro de um círculo** — "1", "2", "3"... dentro de um badge circular antes do nome da tab.

13. **Adicionar linha conectora entre as tabs** — uma barra horizontal ligando as etapas, preenchida conforme o progresso.

14. **Melhorar o contraste da tab ativa** — além da borda azul, adicionar um underline ou sombra inferior mais pronunciada.

15. **Adicionar animação de "pulse" na tab atual** — um sutil efeito de brilho para indicar onde o usuário está.

16. **Permitir scroll horizontal nas tabs em telas muito pequenas** — em dispositivos < 360px, as 5 tabs podem não caber.

17. **Adicionar tooltip nas tabs** — ao tocar e segurar, mostrar descrição da etapa (ex: "Dados iniciais do serviço").

18. **Diferenciar visualmente etapas concluídas das pendentes** — usar um check ✓ verde nas etapas já validadas.

19. **Reduzir o padding das tabs para melhor aproveitamento** — o padding `px-3 py-2` pode ser otimizado para telas pequenas.

20. **Adicionar transição suave de cor ao mudar de etapa** — usar `transition-colors` mais longo (0.3s) para efeito mais elegante.

---

## Campos do Formulário — Etapa Iniciais (21–40)

21. **Adicionar ícone de GPS ao lado do campo Coordenadas** — um ícone de localização ao invés do simples ícone de refresh.

22. **Exibir mapa miniatura nas coordenadas** — um pequeno preview estático do ponto no mapa abaixo do campo.

23. **Adicionar label "Copiar" no campo de coordenadas** — botão para copiar as coordenadas para a área de transferência.

24. **Melhorar o placeholder dos campos UC e OS** — usar exemplos reais como "UC-1234" e "OS-5678" em vez de apenas "UC" e "OS".

25. **Adicionar máscara de entrada nos campos UC e OS** — formatação automática conforme o usuário digita.

26. **Aumentar o espaçamento entre os campos** — o gap atual entre linhas é pequeno; aumentar de 16px para 20px.

27. **Adicionar ícones à esquerda dos labels** — cada label com um ícone temático (pessoa para Líder, prédio para Município, etc.).

28. **Usar floating labels** — o label começa dentro do campo e sobe ao focar, economizando espaço vertical.

29. **Adicionar contador de caracteres nos campos de texto** — útil se houver limite de tamanho para UC/OS.

30. **Melhorar o visual dos dropdowns "Selecione"** — adicionar seta customizada SVG ao invés da seta padrão do navegador.

31. **Adicionar busca dentro dos dropdowns** — para listas longas de Líder/Parceiro/Município, permitir filtrar digitando.

32. **Ordenar opções dos dropdowns alfabeticamente** — facilitar encontrar o item desejado.

33. **Adicionar opção "Outro" nos dropdowns** — com campo de texto livre que aparece ao selecionar.

34. **Destacar campos obrigatórios com asterisco vermelho mais visível** — o asterisco atual é pequeno; aumentar tamanho e cor.

35. **Adicionar dica contextual (tooltip) nos campos** — explicar o que é "UC", "OS", "Notificado" ao tocar no ícone de info.

36. **Agrupar campos relacionados visualmente** — usar cards ou seções com bordas sutis para agrupar (ex: "Dados da Equipe", "Dados do Serviço").

37. **Adicionar validação em tempo real com feedback visual** — borda verde quando o campo é válido, não apenas vermelha quando inválido.

38. **Mostrar mensagem de erro abaixo do campo** — não apenas na barra de erro geral, mas inline abaixo de cada campo com problema.

39. **Auto-preencher Data com a data atual** — já que a maioria dos registros é do dia corrente.

40. **Adicionar botões de incremento rápido em Início/Fim** — botões "+" e "-" para ajustar horas rapidamente.

---

## Botões de Navegação (41–50)

41. **Adicionar ícones nos botões Anterior/Avançar** — setas SVG ao invés de caracteres unicode.

42. **Tornar o botão "Avançar" full-width em telas pequenas** — em telas < 400px, empilhar os botões verticalmente.

43. **Adicionar efeito de ripple ao tocar nos botões** — feedback tátil visual padrão em Material Design.

44. **Mudar o texto do botão na última etapa para "Enviar"** — em vez de "Avançar", mostrar "Enviar formulário" na etapa de Revisão.

45. **Adicionar spinner de carregamento no botão Enviar** — durante o envio, mostrar animação e desabilitar o botão.

46. **Melhorar o estado disabled do botão Anterior** — ao invés de apenas opacidade reduzida, usar cor cinza mais clara e cursor diferente.

47. **Adicionar atalho de teclado para navegação** — setas esquerda/direita para navegar entre etapas em desktop.

48. **Adicionar confirmação ao voltar com campos preenchidos** — modal perguntando se deseja manter os dados ao voltar.

49. **Tornar os botões mais altos (min 48px)** — melhor área de toque para uso em campo com luvas ou pressa.

50. **Adicionar sombra mais pronunciada no botão primário** — destacar visualmente a ação principal.

---

## Sidebar / Painel de Registros (51–70)

51. **Adicionar contador de registros no título** — "Registros (5)" para mostrar quantos itens existem.

52. **Melhorar o campo de busca com ícone de lupa** — ícone SVG à esquerda do campo de busca.

53. **Adicionar botão de limpar busca (X)** — aparece quando há texto no campo de busca.

54. **Ordenar registros por data (mais recente primeiro)** — ordem decrescente como padrão, com opção de inverter.

55. **Adicionar opção de ordenação** — dropdown ou botões para ordenar por data, OS, UC ou status.

56. **Melhorar o truncamento do título do registro** — usar `text-overflow: ellipsis` com tooltip mostrando o texto completo ao hover.

57. **Adicionar badge de status colorido** — "Rascunho" em amarelo/laranja, "Enviado" em verde, "Erro" em vermelho.

58. **Adicionar ícone de status ao lado do badge** — ponto colorido ou ícone para rápida identificação visual.

59. **Expandir o card ao tocar para mostrar mais detalhes** — exibir Líder, Município e outros dados sem precisar editar.

60. **Adicionar swipe para excluir** — gesto de deslizar para a esquerda no card para excluir rapidamente.

61. **Adicionar swipe para editar** — gesto de deslizar para a direita para abrir em edição.

62. **Melhorar o espaçamento entre os cards** — aumentar o margin-bottom de 8px para 12px para melhor separação.

63. **Adicionar borda esquerda colorida nos cards** — cor indicando o status (cinza=rascunho, verde=enviado).

64. **Exibir thumbnail do primeiro anexo no card** — pequena prévia da imagem para identificação visual rápida.

65. **Adicionar checkbox nos cards para seleção múltipla** — permitir selecionar vários registros para excluir em lote.

66. **Adicionar botão "Excluir todos os rascunhos"** — ação em massa no topo da lista.

67. **Melhorar o estado vazio da lista** — ilustração + mensagem "Nenhum registro salvo" quando a lista está vazia.

68. **Adicionar pull-to-refresh na lista** — puxar para baixo para atualizar a lista de registros.

69. **Adicionar paginação ou lazy loading** — para listas longas, carregar registros conforme o scroll.

70. **Adicionar filtro por status** — botões/tabs para filtrar entre "Todos", "Rascunhos", "Enviados".

---

## Cards de Registro — Item Individual (71–80)

71. **Usar tipografia monoespaçada para números de OS** — fonte `font-mono` para destacar que é um identificador.

72. **Adicionar separador visual entre título e data** — uma linha sutil ou maior espaçamento.

73. **Formatar a data de forma mais legível** — usar "08 Jun 2026, 14:00" ao invés de "08/06/2026 14:00".

74. **Adicionar tempo relativo** — "há 2 horas", "ontem" como complemento à data absoluta.

75. **Tornar os botões Editar/Excluir mais compactos** — usar apenas ícones (lápis e lixeira) sem texto para economizar espaço.

76. **Adicionar confirmação antes de excluir** — modal de confirmação para evitar exclusões acidentais.

77. **Adicionar animação de saída ao excluir** — o card desliza para a esquerda e encolhe antes de sumir.

78. **Adicionar undo após excluir** — toast com botão "Desfazer" por 5 segundos após a exclusão.

79. **Destacar o card ao passar o mouse (desktop)** — efeito hover com elevação sutil (box-shadow).

80. **Adicionar número de anexos no card** — ícone de clipe com contador " 3" para saber quantas imagens o registro tem.

---

## Animações e Transições (81–88)

81. **Adicionar transição de fade ao abrir/fechar sidebar** — além do slide, adicionar fade no overlay.

82. **Melhorar a animação de troca de seção** — usar curva `cubic-bezier(0.4, 0, 0.2, 1)` para movimento mais natural.

83. **Adicionar stagger animation nos cards da sidebar** — cada card aparece com um pequeno delay sequencial.

84. **Adicionar micro-animação ao validar campo** — pequeno "shake" no campo quando inválido.

85. **Adicionar animação de sucesso ao enviar** — confetti ou check animado após envio bem-sucedido.

86. **Suavizar a transição do toast** — usar `cubic-bezier` ao invés de `ease` para entrada mais natural.

87. **Adicionar skeleton loading nos cards** — enquanto carrega a lista, mostrar placeholders animados.

88. **Adicionar transição de cor nos botões de ação** — hover mais suave com `transition: all 0.2s ease`.

---

## Acessibilidade (89–94)

89. **Adicionar `aria-label` em todos os botões de ícone** — hamburger, "+", fechar sidebar, editar, excluir.

90. **Adicionar `role="status"` na mensagem de erro** — para leitores de tela anunciarem erros automaticamente.

91. **Melhorar o contraste dos textos secundários** — o cinza `#9ca3af` em fundo branco tem ratio baixo; usar `#6b7280` no mínimo.

92. **Adicionar foco visível nos elementos interativos** — outline azul claro ao navegar com teclado.

93. **Adicionar `aria-live="polite"` no toast** — para anunciar mensagens de sucesso/erro.

94. **Adicionar suporte a redução de movimento** — respeitar `prefers-reduced-motion` para desabilitar animações.

---

## Design Visual e Cores (95–100)

95. **Unificar a paleta de cores dos botões de ação** — Editar (azul) e Excluir (vermelho) com tons mais harmonizados.

96. **Adicionar modo escuro** — tema dark com cores invertidas e ajustes de contraste.

97. **Melhorar as sombras dos cards** — usar sombras em camadas (duas box-shadows) para efeito mais realista.

98. **Adicionar bordas mais sutis nos campos** — reduzir a espessura de 2px para 1px e usar cor mais clara (`#e5e7eb`).

99. **Usar cantos mais arredondados nos cards** — aumentar de 8px para 12px para visual mais moderno.

100. **Adicionar padrão de fundo sutil na área de upload** — textura de pontos ou linhas diagonais na área de drop de arquivos para indicar interatividade.

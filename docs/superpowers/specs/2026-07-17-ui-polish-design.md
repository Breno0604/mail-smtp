# UI Polish � Pull-to-refresh, Bordas, Sidebar, Anexos

**Data:** 2026-07-17
**Status:** Aprovado

## Contexto

Quatro melhorias de UI solicitadas pelo usu�rio para refinar a experi�ncia mobile do formul�rio de retorno.

---

## 1. Desabilitar Pull-to-Refresh

### Problema

Em Android, puxar para baixo no topo da p�gina dispara o refresh nativo do browser, saindo do registro atual e perdendo contexto.

### Solu��o

Adicionar overscroll-behavior-y: contain no seletor html em style.css (linha 24). Isso impede que o scroll "borbote" para o browser, bloqueando pull-to-refresh sem afetar scroll normal.

### Arquivo

- style.css � adicionar propriedade no seletor html existente (linha 24-26)

---

## 2. Bordas Azuis Uniformes nas Se��es

### Problema

Cada se��o tem cor de borda diferente (azul, verde, amarelo, roxo, cinza), criando visualmente inconsistente.

### Solu��o

Padronizar todas as .sec-card para order-color: #3b82f6 (azul) e order-width: 3px. Remover os seletores individuais por ID (#sec-retorno, #sec-equipamentos, #sec-anexos, #sec-revisao) e consolidar em uma regra .sec-card unificada. Manter as cores diferentes apenas nos .sec-num (�cones numerados) para preservar identidade visual por se��o.

### Arquivo

- style.css � modificar linhas 69-144:
  - .sec-card: alterar order: 2px solid #cbd5e1 para order: 3px solid #3b82f6
  - Remover blocos #sec-retorno, #sec-equipamentos, #sec-anexos, #sec-revisao (linhas 114-144)
  - Manter blocos #sec-inicio .sec-num, #sec-retorno .sec-num, etc. (cores dos �cones)

---

## 3. Bordas Mais N�tidas na Sidebar

### Problema

.sidebar-item usa order: 1px solid #e2e8f0 � cor muito clara, borda quase invis�vel.

### Solu��o

Aumentar espessura e contraste: order: 2px solid #94a3b8 (cinza m�dio). Adicionar ox-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) para dar mais defini��o e profundidade.

### Arquivo

- style.css � modificar .sidebar-item (linha 477-483)

---

## 4. Aviso de M�nimo 2 Anexos

### Problema

O contador "0 / 12 (m�n. 2)" j� existe mas � discreto. O usu�rio quer um aviso mais vis�vel.

### Solu��o

Adicionar um par�grafo abaixo da �rea de upload com texto curto: "?? M�nimo 2 imagens". Estilo: cor amber (#d97706), fonte pequena (12px), negrito.

### Arquivo

- index.html � adicionar <p> ap�s #file-count (linha 161)

---

## Arquivos Afetados

| Arquivo    | Mudan�a                                      |
| ---------- | -------------------------------------------- |
| style.css  | Overscroll, bordas uniformes, sidebar n�tida |
| index.html | Aviso m�nimo 2 anexos                        |

## Fora do Escopo

- Cores dos .sec-num � mantidas como est�o
- L�gica de valida��o de anexos � j� existe em alidateSection4()
- Comportamento de scroll para teclado Android � j� implementado em pp.js

## Riscos

- **Nenhum**: todas as mudan�as s�o CSS/HTML puro, sem impacto em l�gica JS ou testes existentes.

# Send Feedback Modal � Design Spec

**Data:** 2026-07-17
**Status:** Aprovado

## Contexto

Atualmente, as mensagens de feedback ao enviar (sucesso, erro, offline, servidor) usam showToast(), que exibe uma notifica��o tempor�ria que desaparece ap�s 3.5s. O usu�rio pode n�o ler a mensagem a tempo. Substituir por um modal persistente que s� fecha com a��o do usu�rio.

---

## Escopo

Substituir toast por modal **apenas nas 4 mensagens de send.js**. Chamadas em sidebar.js e persistence.js continuam usando toast.

### Mensagens afetadas

| Cen�rio                                      | Mensagem                                                             | Tipo    |
| -------------------------------------------- | -------------------------------------------------------------------- | ------- |
| Sucesso                                      | "Email enviado com sucesso!"                                         | sucesso |
| Erro API                                     |
| esponseData.error ou "Erro ao enviar email." | erro                                                                 |
| Offline                                      | "Sem internet � dados salvos. Conecte-se e clique Enviar novamente." | erro    |
| Servidor                                     | "Erro no servidor. Tente novamente."                                 | erro    |

---

## Componente: #send-modal

Novo modal no HTML seguindo o padr�o visual dos modais existentes (confirm-modal, nexos-modal).

### Estrutura HTML

`html

<div class="modal-overlay fixed inset-0 bg-black/40 z-50 flex items-center justify-center hidden"
     id="send-modal" role="dialog" aria-modal="true" aria-labelledby="send-modal-text">
  <div class="modal bg-white rounded-[10px] p-7 max-w-[420px] w-[90%] shadow-xl text-center">
    <p class="text-3xl mb-3" id="send-modal-icon"></p>
    <p class="text-sm text-slate-600 mb-6 leading-relaxed" id="send-modal-text"></p>
    <button class="btn btn-primary" id="send-modal-close">Fechar</button>
  </div>
</div>
`

### Comportamento

- Aberto por showSendModal(msg, success) em ui.js
- Fecha ao clicar no bot�o "Fechar" OU no overlay (fora do modal)
- Sem timer auto-dismiss
- �cone: ? (verde) para sucesso, ? (vermelho) para erro
- Focus trap: bot�o "Fechar" recebe foco ao abrir

### CSS

`css
#send-modal-icon {
  font-size: 2.5rem;
  line-height: 1;
}
`

---

## Arquivos Afetados

| Arquivo         | Mudan�a                                                         |
| --------------- | --------------------------------------------------------------- |
| index.html      | Adicionar #send-modal HTML (ap�s #anexos-modal)                 |
| scripts/dom.js  | Cachear sendModal, sendModalText, sendModalClose, sendModalIcon |
| scripts/ui.js   | Nova fun��o showSendModal(msg, success)                         |
| scripts/send.js | Substituir 4� showToast por showSendModal                       |
| style.css       | Estilo do �cone                                                 |

## Fora do Escopo

- showToast permanece para sidebar.js e persistence.js
- L�gica de envio n�o muda
- Nenhum teste existente � afetado (CSS/HTML + UI function)

## Riscos

- **Nenhum**: mudan�a isolada, padr�o j� existe no projeto

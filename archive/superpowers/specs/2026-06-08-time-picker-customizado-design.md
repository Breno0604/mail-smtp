# Time Picker Customizado — Design Spec

**Data:** 2026-06-08  
**Status:** Aprovado  
**Contexto:** Substituir `<input type="time">` nativo por modal customizado para corrigir truncamento do botão "Definir" no Android.

---

## Problema

O `<input type="time">` nativo abre o `TimePickerDialog` do Android, que trunca o botão "Definir" para "Defi" em telas menores. Não há controle via CSS/JS sobre o diálogo nativo do sistema.

## Solução

Criar um time picker customizado em modal, sem dependências externas, com visual consistente com o Tailwind da aplicação.

---

## Arquitetura

### Novo arquivo: `scripts/timepicker.js`

Exporta `createTimePicker(inputElement)`:

- Recebe o `<input>` original (que será escondido via `type="hidden"`)
- Cria um input de display (readonly, clicável) que mostra o horário formatado
- Ao clicar no display, abre um modal overlay

### Modal

```
┌─────────────────────────────────┐
│  Header: "11:35" (48px, bold)   │
─────────────────────────────────┤
│  ─────┐       ┌─────┐          │
│  │ 10  │       │ 30  │          │
│  │ 11  │  ←→   │ 35  │ ← snap   │
│  │ 12  │       │ 40  │          │
│  └─────┘       └─────┘          │
│  Hora          Minuto            │
├─────────────────────────────────┤
│  [Cancelar]        [Confirmar]   │
└─────────────────────────────────┘
```

### Comportamento dos rolos

- Scroll vertical com snap ao item central
- Altura fixa: ~200px (5 itens visíveis, item central destacado)
- Horas: 00–23 (24 valores)
- Minutos: 00–59 em passos de 5 (12 valores) — reduz scroll
- Toque/arraste para rolar
- Item central com fundo azul (#2563eb) e texto branco

### Fluxo

1. Usuário toca no input de display
2. Modal abre com horário atual (ou vazio)
3. Usuário rola hora e minuto
4. "Confirmar" → fecha modal, atualiza input hidden com valor "HH:MM"
5. "Cancelar" → fecha modal, descarta alterações

---

## Arquivos modificados

| Arquivo                 | Alteração                                                      |
| ----------------------- | -------------------------------------------------------------- |
| `scripts/timepicker.js` | **Novo** — módulo do picker                                    |
| `scripts/iniciais.js`   | Substituir `input.type = "time"` por `createTimePicker(input)` |
| `index.html`            | Importar `timepicker.js` como módulo                           |
| `sw.js`                 | `CACHE_NAME = 'retorno-v6'` (bump de cache)                    |

---

## Impacto em módulos existentes

- **`validation.js`:** Nenhuma alteração. O input hidden mantém `value` em formato "HH:MM", a validação de `horaFim > horaInicio` continua funcionando.
- **`state.js`:** Nenhuma alteração. O `debouncedSave` lê `el.value` do input hidden.
- **`restore.js`:** Nenhuma alteração. O valor "HH:MM" restaurado no input hidden pode ser refletido no display via observer ou chamada explícita.
- **`fields.js`:** Nenhuma alteração.

---

## Visual (Tailwind)

- Modal: `fixed inset-0 z-50 flex items-center justify-center bg-black/50`
- Container: `bg-white rounded-2xl shadow-xl w-80 overflow-hidden`
- Header: `bg-blue-600 text-white text-5xl font-bold py-6 text-center`
- Rolos: `h-48 overflow-y-scroll snap-y snap-mandatory`
- Item: `h-12 flex items-center justify-center snap-center text-lg`
- Item ativo: `bg-blue-600 text-white rounded-lg`
- Botões: `flex-1 py-3 text-blue-600 font-semibold` (Cancelar) / `bg-blue-600 text-white` (Confirmar)

---

## Critérios de sucesso

- [ ] Modal abre ao tocar no campo de hora
- [ ] Rolos de hora (00-23) e minuto (00-59, passo 5) funcionam com snap
- [ ] Botão "Confirmar" preenche o input com valor "HH:MM"
- [ ] Botão "Cancelar" fecha sem alterar
- [ ] Validação `horaFim > horaInicio` continua funcionando
- [ ] Persistência no IndexedDB funciona (restore mantém o valor)
- [ ] Visual consistente com o resto da aplicação
- [ ] Nenhum truncamento de texto no modal
- [ ] Service Worker cache atualizado (`retorno-v6`)

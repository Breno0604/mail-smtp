# Equipamentos, Design

> Gerado pelo Redator em 2026-06-15

---

## Estrutura de Dados

```js
// Cada equipamento no array state.equipamentos[]
{
  tipo: "Instalado" | "Retirado",
  categoria: "Medidor" | "Display" | "Conjunto" | "TC" | "TP",
  numero: string       // número de série, unique no array
}
```

## Estado Vazio

```html
<p id="empty-equip-msg" class="text-gray-400 italic">
  Nenhum equipamento adicionado
</p>
```

## Layout da Linha (row)

```
┌─────────────────────────────────────────────────────┐
│  [Tipo ▼]        [Categoria ▼]        [Nº Série]  ✕ │
│  Instalado        Medidor             123456        ✕ │
└─────────────────────────────────────────────────────┘
```

- **Tipo**: `<select>` com opções "Instalado" e "Retirado"
- **Categoria**: `<select>` com opções "Medidor", "Display", "Conjunto", "TC", "TP"
- **Número**: `<input type="text">` para número de série
- **Remover**: botão ✕ (classe `remove-equip-btn`)

## Ciclo de Vida

```
init → DOM ready
  │
  ├─[click "+Equipamento"] → addEquip()
  │   ├─ create row HTML
  │   ├─ append to #equip-list
  │   └─ hideEmptyEquip()
  │
  ├─[click ✕ na row] → remove row + showEmptyEquip() se vazio
  │
  ├─ collectEquipamentos() → percorre rows, monta array
  │
  └─ renderEquipamentos() → limpa lista, recria rows do state
      └─ showEmptyEquip() se state.equipamentos estiver vazio
```

## Dependências

- `DOM` de `dom.js`: `DOM.equipList`, `DOM.emptyEquipMsg`
- `state` de `state.js`: `state.equipamentos[]`, `markDirty()`
- `utils.js`: (não usado diretamente, mas necessário para testes)

## Integração

- `collectEquipamentos()` é chamado por `collectAll()` em `app.js` antes de salvar
- `renderEquipamentos()` é chamado por `restoreState()` ao carregar um registro salvo
- Validação de duplicidade é feita em `validation.js`, não em `equipment.js`

## API Pública

| Função | Parâmetros | Retorno | Descrição |
|--------|-----------|---------|-----------|
| `addEquip(tipo?, categoria?, numero?)` | Opcionais para pré-preenchimento | `void` | Adiciona row ao DOM e ao state |
| `collectEquipamentos()` | `void` | `Equipamento[]` | Lê rows do DOM, retorna array |
| `renderEquipamentos()` | `void` | `void` | Reconstrói rows a partir do state |
| `showEmptyEquip()` | `void` | `void` | Exibe mensagem vazia |
| `hideEmptyEquip()` | `void` | `void` | Oculta mensagem vazia |

---

*Fim do design de equipamentos.*

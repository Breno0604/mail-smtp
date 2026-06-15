# Relatório de Confiança — mail-mvp

> Gerado pelo Revisor em 2026-06-15

---

## Resumo Geral

| Nível | Quantidade | Percentual |
|-------|-----------|------------|
| 🟢 CONFIRMADO | 90 | 100% |
| 🟡 INFERIDO | 0 | 0% |
| 🔴 LACUNA | 0 | 0% |
| **Total** | **90** | **100%** |

**Confiança geral:** 100% (90 🟢 + 0 🟡 × 0.5) / 90

---

## Por Spec

| Spec | 🟢 | 🟡 | 🔴 | Confiança |
|------|----|----|-----|-----------|
| `formulario/requirements.md` | 11 | 0 | 0 | 100% |
| `anexos/requirements.md` | 3 | 0 | 0 | 100% |
| `equipamentos/requirements.md` | 4 | 0 | 0 | 100% |
| `email/requirements.md` | 11 | 0 | 0 | 100% |
| `persistencia/requirements.md` | 12 | 0 | 0 | 100% |
| `sidebar/requirements.md` | 10 | 0 | 0 | 100% |
| `validacao/requirements.md` | 12 | 0 | 0 | 100% |
| `ferramentas/requirements.md` | 13 | 0 | 0 | 100% |
| `globals/requirements.md` | 14 | 0 | 0 | 100% |
| **Total** | **90** | **0** | **0** | **100%** |

---

## Detalhamento por Spec

### formulario/requirements.md — 11 🟢

| ID | Afirmação | Evidência |
|----|-----------|-----------|
| RD01 | Ao mudar tipo de ordem, dados de retorno anteriores são descartados | `retornos.js` `handleTipoChange()` — `state.retorno = {}` |
| RD02 | Campos condicionais ocultos têm valor zerado | `retornos.js` `updateConditionalFields()` — `input.value = ""` |
| RD03 | Campos ocultos excluídos dos dados coletados | `retornos.js` `getRetornoData()` — filtra `display: none` |
| RD04 | UC é text com inputMode=numeric | `iniciais.js` `INPUT_CREATORS` |
| RD05 | Selects recebem placeholder "Selecione" | `iniciais.js` — primeira `<option>` adicionada |
| RD06 | Coordenadas têm botão de refresh | `iniciais.js` — HTML gerado com botão ao lado |
| RD07 | tipo-ordem criado dinamicamente, listener re-attachado | `iniciais.js` linha 172 + `app.js:54` + `restore.js:56-58` |
| RD08 | Campos obrigatórios recebem data-required | `iniciais.js` — atributo injetado no input |
| RD09 | Agrupamento por linha (flex/grid row) | `iniciais.js` — mesmo `linha` = mesma flex row |
| NFR1 | Schema centralizado em fields.js | `fields.js` |
| NFR2 | Input/change chamam debouncedSave 1000ms | `iniciais.js:175-176`, `retornos.js:54-55` |

### anexos/requirements.md — 3 🟢

| ID | Afirmação | Evidência |
|----|-----------|-----------|
| RN01 | Máximo 12 anexos | `attachments.js` — `if (files.length > 12) return` |
| RN02 | Compressão progressiva ≤ 650KB | `compress.js:12-49` — loop com redução de 80% |
| RN03 | Anexos têm dirty tracking | `persistence.js:34-35` — `markAttachmentsDirty()` |

### equipamentos/requirements.md — 4 🟢

| ID | Afirmação | Evidência |
|----|-----------|-----------|
| RN01 | 3 campos por equipamento (status, categoria, número) | `equipment.js` — HTML template |
| RN02 | Número não duplicado | `validation.js:123-131` — normalização + duplicidade |
| RN03 | Seção opcional | `validation.js:103-104` — `if (rows.length === 0) return true` |
| RN04 | Restauração via renderEquipamentos | `restore.js:79` — `renderEquipamentos()` |

### email/requirements.md — 11 🟢

| ID | Afirmação | Evidência |
|----|-----------|-----------|
| RN01 | Data invertida DD-MM-YYYY | `email.js:25-27` — `split("-").reverse().join("-")` |
| RN02 | Apenas campos existentes em data.retorno | `email.js:43` — `if (!(field.nome in data.retorno)) return` |
| RN03 | Hidden fields filtrados | `retornos.js` `getRetornoData()` — filtra `display: none` |
| RN04 | Dupla proteção (hidden + composeEmail) | `email.js:43` + `retornos.js getRetornoData()` |
| RN05 | Equipamentos omitidos se vazio | `email.js:31` — `if (data.equipamentos && data.equipamentos.length > 0)` |
| RN06 | Destinatários só de SMTP_TO | `send.js:32-35` — split de env var |
| RN07 | Anexos validados no backend | `send.js:46-57` — max 12, max 8MB |
| RN08 | SMTP_FROM validado regex | `send.js:24-29` — `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| RN09 | SMTP_TO validado | `send.js:37-44` — lista vazia ou emails inválidos |
| RN10 | rejectUnauthorized: false | `send.js:67` — `tls: { rejectUnauthorized: false }` |
| RN11 | Campos vazios viram "—" / "(nao preenchido)" | `email.js:27,45` |

### persistencia/requirements.md — 12 🟢

| ID | Afirmação | Evidência |
|----|-----------|-----------|
| RN01 | Só salva se iniciaisValido === true | `persistence.js:41` — `if (!state.iniciaisValido) return` |
| RN02 | Não salva sem dados | `persistence.js:43-45` — guard com hasData + arrays + uuid |
| RN03 | Anexos em store separado | `db.js:27-29` — store `attachments` com index uuid |
| RN04 | Dirty tracking | `persistence.js:28-36` — flag + check em saveState |
| RN05 | Retry se falhar | `persistence.js:82` — `attachmentsDirty = true` |
| RN06 | Debounce 1000ms | `persistence.js:87-90` — `setTimeout(saveState, 1000)` |
| RN07 | Migração v2→v3 transparente | `restore.js:27-47` — if/else para v2 inline vs v3 store |
| RN08 | Ciclo de importação quebrado | `storage.js:1` — sem imports |
| RN09 | UUID com crypto.randomUUID + fallback | `persistence.js:97-99` |
| RN10 | Schema do IndexedDB | `db.js:22-29` — keyPath uuid e id |
| RN11 | Deleção atômica | `db.js:88-107` — transação com 2 stores |
| RN12 | QuotaExceededError → toast | `persistence.js:70-74` |

### sidebar/requirements.md — 10 🟢

| ID | Afirmação | Evidência |
|----|-----------|-----------|
| RN01 | Ordenado por updatedAt desc | `sidebar.js:40` — `sort(desc)` |
| RN02 | Filtro UC/OS/tipoOrdem | `sidebar.js:42-53` — `includes(term)` |
| RN03 | Editar busca getRecord completo | `sidebar.js:87` — `getRecord(record.uuid)` |
| RN04 | Excluir atual limpa UUID | `sidebar.js:103-105` — `clearCurrentUUID()` |
| RN05 | Reenvio exige confirmação | `duplicate.js:7-39` — modal |
| RN06 | Sent bloqueia sem confirmação | `duplicate.js:15` — `if (record.status !== "sent") resolve(true)` |
| RN07 | Reset limpa tudo | `reset.js:12-19` — state zerado |
| RN08 | Reset marca attachmentsDirty | `reset.js:22` — `markAttachmentsDirty()` |
| RN09 | Reset recaptura coordenadas | `reset.js:26` — `captureCoordinates()` |
| RN10 | Reset re-attach listener tipoOrdem | `reset.js:29-31` |

### validacao/requirements.md — 12 🟢

| ID | Afirmação | Evidência |
|----|-----------|-----------|
| RN01 | UC só dígitos | `validation.js:59` — `/^\d+$/.test(data.uc)` |
| RN02 | Data não futura | `validation.js:68-78` — `selectedDate > today` |
| RN03 | Hora fim != hora início | `validation.js:84` — `data.hora_fim === data.hora_inicio` |
| RN04 | Equipamentos opcional | `validation.js:103` — `if (rows.length === 0) return true` |
| RN05 | Número duplicado (normalizado) | `validation.js:123-131` |
| RN06 | Retorno pula hidden | `validation.js:153` — `if (group.style.display === "none") return` |
| RN07 | Retorno só se tipo selecionado | `validation.js:221-222` — `if (tipo)` |
| RN08 | Anexos max 12, max 8MB | `validation.js:174-188` |
| RN09 | Cache _validatedData | `validation.js:11-16,97-98,269-294` |
| RN10 | _resetValidationCache | `validation.js:13-16` |
| RN11 | Section 5 sempre true | `validation.js:196` — `5: () => true` |
| RN12 | Blur validation com required/data-required | `validation.js:252-267` |

### ferramentas/requirements.md — 13 🟢

| ID | Afirmação | Evidência |
|----|-----------|-----------|
| RN01 | clearCurrentUUID no init | `app.js:113` |
| RN02 | Save com UC+OS preenchidos | `app.js:25-34` `checkInitialPersistence()` |
| RN03 | Input/change → debouncedSave + updateLivePreview | `app.js:71-93` |
| RN04 | Pointerdown → blur | `app.js:95-99` |
| RN05 | Toast 3.5s | `ui.js:21` — `setTimeout(3500)` |
| RN06 | showConfirm Promise<boolean> | `ui.js:40-61` |
| RN07 | captureCoordinates timeout 10s | `utils.js:60` |
| RN08 | compressAttachments no envio | `send.js:29` |
| RN09 | Subject composto | `send.js:22-23` |
| RN10 | SW registration + controllerchange | `sw-update.js:6-19` |
| RN11 | INPUT_CLASS e SELECT_CLASS | `styles.js:5-8` |
| RN12 | Erro de conexão no fetch | `send.js:49-51` |
| RN13 | updateRecordStatus após envio | `send.js:41-43` |

### globals/requirements.md — 14 🟢

| ID | Afirmação | Evidência |
|----|-----------|-----------|
| RN01 | CACHE_NAME versionado | `sw.js:1` — `'retorno-v60'` |
| RN02 | Cache-first GET (exceto /api/) | `sw.js:63-115` |
| RN03 | 23 scripts cacheados | `sw.js:3-33` — `STATIC_ASSETS` |
| RN04 | Navigate network-first | `sw.js:72-85` |
| RN05 | Cache antigo limpo no activate | `sw.js:46-61` |
| RN06 | /api/send → /.netlify/functions/send | `netlify.toml:21-24` |
| RN07 | Headers SW (no-cache) | `netlify.toml:6-9` |
| RN08 | Headers icons (1 ano) | `netlify.toml:16-19` |
| RN09 | Build command npm install | `netlify.toml:2` |
| RN10 | Tailwind pré-compilado | `package.json:6` — `build:css` script |
| RN11 | PWA standalone | `manifest.json:5` |
| RN12 | Orientação portrait | `manifest.json:9` |
| RN13 | 4 modais + orientation overlay | `index.html:115-157` |
| RN14 | DOMContentLoaded (sem top-level await) | `app.js:102` |

---

## Lacunas Pendentes 🔴

Nenhuma lacuna 🔴 identificada. Todos os comportamentos foram confirmados diretamente no código.

---

## Recomendações

- [ ] **Netlify Function sem autenticação**: Qualquer origem pode POST `/api/send`. Considerar adicionar token de acesso ou validação de origem.
- [ ] **CACHE_NAME bump manual**: O versionamento do cache do SW é feito manualmente. Risco de esquecer de incrementar ao modificar assets estáticos.
- [ ] **Sem testes para `send.js`**: A Netlify Function não é testada em CI por indisponibilidade de SMTP. Considerar mock do nodemailer.

---

## Histórico de Reclassificações

| De | Para | Afirmação | Evidência |
|----|------|-----------|-----------|
| 🔴 | 🟢 | persistencia/RN01: Só salva se iniciaisValido | `persistence.js:41` |

---

*Fim do relatório de confiança.*

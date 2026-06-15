# Permissions & Roles — mail-mvp

> Gerado pelo Detetive em 2026-06-15
> Escala: 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Conclusão Principal

**O sistema não implementa autenticação, autorização ou RBAC.**
É uma aplicação single-user (single-role) sem qualquer controle de acesso.

---

## Análise

### 1. Ausência de Autenticação

- Nenhum sistema de login/senha em toda a codebase
- Nenhuma verificação de sessão ou token
- Nenhum middleware de autenticação na Netlify Function
- Nenhum cookie ou armazenamento de sessão
- A Netlify Function (`send.js`) aceita POST de qualquer origem

### 2. Ausência de Autorização

- Nenhuma verificação de papel/função do usuário
- Nenhuma restrição de acesso a funcionalidades
- Todas as operações (criar, editar, enviar, excluir) estão disponíveis para qualquer usuário
- A sidebar exibe todos os registros — não há filtro por usuário/técnico

### 3. Único Papel Identificado

| Papel | Descrição | Confiança |
|-------|-----------|-----------|
| **Técnico de Campo** | Usuário que preenche formulários de OS e anexa fotos. Único tipo de usuário do sistema | 🟡 INFERIDO |

> 🟡 INFERIDO: Não há distinção explícita de papéis no código. Inferimos "Técnico de Campo" como o único perfil com base nos campos do formulário (líder, parceiro, placa, coordenadas).

### 4. Lista de Técnicos (não é RBAC)

A lista de 12 técnicos em `fields.js` **não** é um sistema de permissões:

```js
const nomesTecnicos = [
  "ANDRE DE SOUSA CARVALHO",
  "ANTONIO MAURIELLTON DE ARAUJO MARTINS",
  "BERKSON EVANGELISTA DE OLIVEIRA",
  "CARLOS CRISTIANO DO NASCIMENTO SILVA",
  "DIEGO DA SILVA DE LIMA",
  "DOUGLAS MONTEIRO DE ABREU",
  "FRANCISCO ADRIANO DE SOUSA VIANA",
  "JOSE DOGIVAN DA SILVA",
  "LEANDRO OLIVEIRA SOUSA",
  "MARCIO JOHNNATAN CHAGAS CAETANO",
  "RENATO RODRIGUES VIEIRA",
  "VALDI DOS SANTOS VIANA FILHO"
];
```

Ela serve apenas como opções de select para os campos "Líder" e "Parceiro" — qualquer valor pode ser selecionado e não há autenticação vinculada.

### 5. Matriz de Permissões (Inexistente)

| Funcionalidade | Usuário anônimo | Confiança |
|----------------|:---:|:---:|
| Preencher formulário | ✅ | 🟢 CONFIRMADO |
| Adicionar equipamentos | ✅ | 🟢 CONFIRMADO |
| Anexar arquivos | ✅ | 🟢 CONFIRMADO |
| Visualizar histórico (sidebar) | ✅ | 🟢 CONFIRMADO |
| Editar registro salvo | ✅ | 🟢 CONFIRMADO |
| Excluir registro | ✅ | 🟢 CONFIRMADO |
| Enviar email SMTP | ✅ | 🟢 CONFIRMADO |
| Reenviar registro já enviado | ✅ (com confirmação) | 🟢 CONFIRMADO |
| Resetar formulário | ✅ | 🟢 CONFIRMADO |

### 6. Proteções Existentes (não são permissões)

São proteções contra erro do usuário, não contra acesso não autorizado:

1. **Modal de confirmação de reenvio**: impede reenvio acidental de registro já enviado
2. **Validação de formulário**: impede envio com dados obrigatórios faltando
3. **Validação de anexos**: impede anexos acima do limite de tamanho/quantidade
4. **Auto-save condicional**: só salva quando UC+OS estão preenchidos

---

## Resumo

| Aspecto | Status | Confiança |
|---------|--------|-----------|
| Autenticação | ❌ Não implementada | 🟢 CONFIRMADO |
| Autorização | ❌ Não implementada | 🟢 CONFIRMADO |
| RBAC | ❌ Não implementado | 🟢 CONFIRMADO |
| Papéis de usuário | 1 (Técnico de Campo) | 🟡 INFERIDO |
| Proteções contra usuário | 4 (modais + validações) | 🟢 CONFIRMADO |

---

## Recomendação (Lacuna 🔴)

O sistema atual **não possui qualquer segurança no backend**. A Netlify Function `send.js` aceita POST de qualquer origem sem validação de identidade. Em produção, isso significa que:

- Qualquer pessoa com o URL da função pode disparar emails
- Não há rate limiting
- Não há validação de origem (CORS não é verificado)

> 🔴 LACUNA: Ausência total de autenticação na Netlify Function. Se o endpoint for exposto publicamente, pode ser abusado para envio de emails não autorizados.

---

*Fim do documento de permissões.*

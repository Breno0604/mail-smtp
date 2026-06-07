# Estrutura de Email

## Configuração SMTP

```
SenderName:     "RetornoGrupoA"
SenderPassword: "193267214196154465"
Encryption:     NONE (sem TLS/SSL)
```

> **IMPORTANTE**: Encryption = NONE — o servidor SMTP não usa criptografia.
> Isto é comum em apps Kodular que usam serviços SMTP que aceitam conexões sem TLS.

## Lista de Destinatários (9 emails)

Os emails são carregados em `Lista_de_Email` via `LList.chain4`:

1. nobrebeq10@hotmail.com
2. nogueiracordeiro107@gmail.com
3. maria_zildene2021@outlook.com
4. edvando.alves@grupoafro.com
5. retorno.grupoa@gmail.com
6. jose_nilton_bezerra@hotmail.com
7. amanda.barbosa@grupoafro.com
8. josefranca.100@hotmail.com
9. suporte@grupoafro.com

## Destinatários em Cópia (Cc)

Não há destinatários em Cc configurados.

## Assunto

Formato: `"RETORNO DE ORDEM - <TIPO> - <ORDEM>"`

Construído por `p$assuntoEmail` (Lit277 - lambda118):

```
Concatena(
    "RETORNO DE ORDEM - ",
    Ls_Tipo_de_ordem.Text,
    " - ",
    Txt_Ordem.Text
)
```

Exemplos:
- "RETORNO DE ORDEM - LIGAÇÃO NOVA SIMULTÂNEA - 12345"
- "RETORNO DE ORDEM - CORTE POR FALTA DE PAGAMENTO - 67890"

## Corpo do Email

Construído por `p$corpoEmail` (Lit169 - lambda97).

A estrutura exata do corpo é:

```
**SEGUE INFORMAÇÕES REFERENTE A ORDEM DE SERVIÇO**

TIPO: <Ls_Tipo_de_ordem.Text>
CLIENTE: <Ls_Cliente.Text>
ORDEM: <Txt_Ordem.Text>
UC: <Txt_UC.Text>
TECNICO(S): <Txt_Tecnicos.Text>
DATA/HORA: <Txt_Data_Hora.Text>
<TEXTO_DE_RETORNO>
MUNICIPIO: <Ls_Municipio.Text>
APR: <Txt_APR.Text>           (se preenchido)
PRE APR: <Txt_PRE_APR.Text>   (se preenchido)
NOTIFICADO: <Ls_Notificado.Text> (se preenchido)
OBSERVAÇÃO: <Txt_Observacao.Text> (se preenchido)

**GRUPO A - RETORNO**
```

Onde `TEXTO_DE_RETORNO` é o conteúdo de `Txt_Retorno.Text` (que é preenchido pelo template ou montado dinamicamente pela função específica do tipo de ordem).

### Exemplo de Corpo Completo

```
**SEGUE INFORMAÇÕES REFERENTE A ORDEM DE SERVIÇO**

TIPO: LIGAÇÃO NOVA SIMULTÂNEA
CLIENTE: COELCE
ORDEM: 12345
UC: 678901
TECNICO(S): João Silva, Maria Santos
DATA/HORA: 15/03/2024 14:30
FOI EXECUTADO LIGAÇÃO NOVA SIMULTÂNEA
TOMBAMENTO: ABC123
COORD X: 123456
COORD Y: 789012
QTDE MEDIDOR BT: 1
MEDIDOR BT RETIRADO/CORTADO: SIM
LIGAÇÃO EXECUTADA: NAO
MUNICIPIO: QUIXERAMOBIM
APR: 123
OBSERVAÇÃO: Sem intercorrências

**GRUPO A - RETORNO**
```

## Anexos (Fotos)

O app envia fotos como anexos no email. As fotos são obtidas de duas maneiras:
1. **Btn_Camera**: abre a câmera do dispositivo para tirar foto
2. **Btn_Galeria**: abre a galeria para selecionar fotos existentes

As fotos são passadas para o SmtpClient via `SmtpClient1.SendMessage` com a lista de arquivos como anexos.

## Fluxo de Envio

1. Usuário preenche campos e clica "PRÓXIMO"
2. Validação de campos (tela inicial + específicos)
3. Se OK, monta texto de retorno
4. Mostra Tela_Anexos + Tela_Finalizacao
5. **Btn_Enviar** (na Tela_Finalizacao) → verifica Internet → `p$EnviarEmail`
6. SmtpClient1.SendMessage é chamado com:
   - **Destinatários**: Lista_de_Email (9 emails)
   - **Assunto**: "RETORNO DE ORDEM - <TIPO> - <ORDEM>"
   - **Corpo**: texto completo montado por p$corpoEmail
   - **Anexos**: arquivos de foto selecionados
7. **Sucesso** (GotResult): Notifier "ORDEM DE SERVIÇO ENVIADA COM SUCESSO"
8. **Erro de conexão** (GotError): Notifier "VERFIQUE CONEXÃO COM INTERNET." / "TENTE REDUZIR A QUANTIDADE DE ANEXOS" / "CONSIDERE REDUZIR RESOLUÇÃO DAS FOTOS."

## Observações

- O email é enviado como texto simples (não HTML), com `\n` para quebras de linha
- Alguns campos são omitidos do corpo se estiverem vazios (APR, PRE APR, NOTIFICADO, OBSERVAÇÃO)
- As fotos são anexadas como arquivos individuais
- O envio é síncrono via SmtpClient (bloqueia a UI até completar)
- A senha está hardcoded no código (prática comum em apps Kodular, mas insegura)

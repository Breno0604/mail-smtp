import type { IniciaisData, Equipment } from '@/shared/types'
import { formatDate } from '@/shared/utils/formatDate'

export interface EmailContent {
  subject: string
  text: string
}

export interface ComposeInput {
  iniciais: IniciaisData
  retorno: Record<string, string>
  equipamentos: Equipment[]
  complementoCorpo: string
  attachmentCount: number
}

export function composeEmail(data: ComposeInput): EmailContent {
  const { iniciais, retorno, equipamentos, complementoCorpo, attachmentCount } = data

  const subject = `OS ${iniciais.os} - ${iniciais.tipoOrdem} - ${iniciais.uc}`

  let text = ''
  text += `UC: ${iniciais.uc}\n`
  text += `OS: ${iniciais.os}\n`
  text += `Tipo de Ordem: ${iniciais.tipoOrdem}\n`
  text += `Parceiro/Líder: ${iniciais.parceiroLider}\n`
  text += `Município: ${iniciais.municipio}\n`
  text += `Placa: ${iniciais.placa}\n`
  text += `Data: ${formatDate(iniciais.data)}\n`
  text += `Hora Início: ${iniciais.horaInicio}\n`
  text += `Hora Fim: ${iniciais.horaFim}\n`
  text += `Coordenadas: ${iniciais.coordenadas}\n`
  text += `Notificado: ${iniciais.notificado}\n`
  text += `Complemento: ${iniciais.complemento}\n`

  const retornoEntries = Object.entries(retorno).filter(([, v]) => v)
  if (retornoEntries.length > 0) {
    text += `\n--- RETORNO ---\n`
    for (const [, value] of retornoEntries) {
      text += `${value}\n`
    }
  }

  if (equipamentos.length > 0) {
    text += `\n--- EQUIPAMENTOS ---\n`
    equipamentos.forEach((eq, i) => {
      text += `${i + 1}. ${eq.status} | ${eq.categoria} | ${eq.numero}\n`
    })
  }

  if (attachmentCount > 0) {
    text += `\n--- ANEXOS ---\n`
    text += `${attachmentCount} anexo(s) incluído(s)\n`
  }

  if (complementoCorpo) {
    text += `\n--- COMPLEMENTO ---\n`
    text += `${complementoCorpo}\n`
  }

  return { subject, text }
}

import type { Attachment } from '@/shared/types'

export interface SendResult {
  success: boolean
  message: string
}

/**
 * Envia o email via POST para a Netlify Function /api/send
 * O backend lê SMTP_TO das env vars — o frontend NÃO envia destinatários.
 *
 * Attachments são enviados como { filename, content }
 * onde content é a data URL completa (ex: "data:image/jpeg;base64,...")
 * O backend faz o parse e converte para Buffer.
 */
export async function sendEmail(payload: {
  subject: string
  text: string
  attachments?: Array<Pick<Attachment, 'name' | 'data'>>
}): Promise<SendResult> {
  try {
    // Mapeia Attachment → formato esperado pelo backend
    const mappedAttachments = payload.attachments?.map((att) => ({
      filename: att.name,
      content: att.data,
    }))

    const response = await fetch('/.netlify/functions/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: payload.subject,
        text: payload.text,
        attachments: mappedAttachments,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      return { success: true, message: 'OS enviada com sucesso!' }
    }
    return { success: false, message: data.error || 'Erro ao enviar OS' }
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : 'Erro de conexão' }
  }
}

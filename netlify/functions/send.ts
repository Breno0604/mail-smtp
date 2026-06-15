import nodemailer from 'nodemailer'

interface AttachmentPayload {
  filename: string
  content: string // base64 (pode conter prefixo data:image/...;base64,)
}

interface SendPayload {
  subject: string
  text: string
  attachments?: AttachmentPayload[]
}

interface HandlerResponse {
  statusCode: number
  body: string
}

/**
 * Strips data URL prefix from a base64 string
 * Ex: "data:image/jpeg;base64,/9j/4AAQ..." → "/9j/4AAQ..."
 */
function stripDataUrlPrefix(content: string): string {
  const commaIndex = content.indexOf(',')
  if (commaIndex !== -1 && content.startsWith('data:')) {
    return content.slice(commaIndex + 1)
  }
  return content
}

/**
 * Valida formato de email simples
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const handler = async (event: {
  httpMethod: string
  body: string | null
}): Promise<HandlerResponse> => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const body: SendPayload = JSON.parse(event.body || '{}')
    const { subject, text, attachments } = body

    if (!subject) {
      return { statusCode: 400, body: JSON.stringify({ error: "Campo 'assunto' é obrigatório." }) }
    }

    if (!text || typeof text !== 'string') {
      return { statusCode: 400, body: JSON.stringify({ error: "Campo 'text' é obrigatório." }) }
    }

    // Valida SMTP_FROM
    const SMTP_FROM = process.env.SMTP_FROM
    if (!SMTP_FROM || !isValidEmail(SMTP_FROM)) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'SMTP_FROM inválido ou não configurado.' }),
      }
    }

    // Valida SMTP_TO
    const toList = (process.env.SMTP_TO || '')
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0)

    if (toList.length === 0) {
      return { statusCode: 500, body: JSON.stringify({ error: 'SMTP_TO não configurado.' }) }
    }

    const invalid = toList.filter((e) => !isValidEmail(e))
    if (invalid.length > 0) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Emails inválidos em SMTP_TO: ${invalid.join(', ')}` }),
      }
    }

    // Valida anexos
    if (attachments && attachments.length > 12) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Máximo de 12 anexos permitido.' }) }
    }

    if (attachments) {
      for (const att of attachments) {
        const rawContent = stripDataUrlPrefix(att.content)
        const size = Buffer.from(rawContent, 'base64').length
        if (size > 8 * 1024 * 1024) {
          return { statusCode: 400, body: JSON.stringify({ error: `Anexo '${att.filename}' excede 8 MB.` }) }
        }
      }
    }

    // Configura transporte SMTP
    const transportConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: parseInt(process.env.SMTP_PORT || '465', 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { rejectUnauthorized: false },
    }

    const transporter = nodemailer.createTransport(transportConfig)

    // Prepara anexos para o nodemailer (converte base64 para Buffer)
    const mailAttachments = (attachments || []).map((att) => ({
      filename: att.filename,
      content: Buffer.from(stripDataUrlPrefix(att.content), 'base64'),
    }))

    const mailOptions = {
      from: SMTP_FROM,
      to: toList,
      subject,
      text: text || '',
      attachments: mailAttachments,
    }

    await transporter.sendMail(mailOptions)

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, to: toList }),
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor'
    return {
      statusCode: 500,
      body: JSON.stringify({ error: message }),
    }
  }
}

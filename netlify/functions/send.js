const nodemailer = require('nodemailer');

exports.handler = async event => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // ── Segurança: verificar origem da requisição ──────────────
  const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;
  if (ALLOWED_ORIGIN) {
    const origin = event.headers.origin || event.headers.referer || '';
    if (!origin.startsWith(ALLOWED_ORIGIN)) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Origem não autorizada.' }) };
    }
  }

  try {
    // ── Segurança: limite de payload ────────────────────────────
    const rawBody = event.body || '';
    if (Buffer.byteLength(rawBody, 'utf-8') > 10 * 1024 * 1024) {
      return {
        statusCode: 413,
        body: JSON.stringify({ error: 'Payload excede o limite de 10 MB.' }),
      };
    }

    const body = JSON.parse(rawBody);
    const { subject, text, attachments } = body;

    if (!subject) {
      return { statusCode: 400, body: JSON.stringify({ error: "Campo 'assunto' é obrigatório." }) };
    }

    if (subject.length > 200) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Campo 'assunto' excede o limite de 200 caracteres." }),
      };
    }

    if (!text || typeof text !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Campo 'text' é obrigatório." }),
      };
    }

    if (text.length > 50000) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Campo 'text' excede o limite de 50.000 caracteres." }),
      };
    }

    const SMTP_FROM = process.env.SMTP_FROM;
    if (!SMTP_FROM || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(SMTP_FROM)) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'SMTP_FROM inválido ou não configurado.' }),
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const toList = (process.env.SMTP_TO || '')
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    if (toList.length === 0) {
      return { statusCode: 500, body: JSON.stringify({ error: 'SMTP_TO não configurado.' }) };
    }

    const invalid = toList.filter(e => !emailRegex.test(e));
    if (invalid.length > 0) {
      console.error('[send] Emails inválidos em SMTP_TO:', invalid);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Configuração do servidor de email inválida.' }),
      };
    }

    if (attachments && attachments.length > 12) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Máximo de 12 anexos permitido.' }) };
    }

    if (attachments) {
      for (const att of attachments) {
        // ── Valida: filename obrigatório ─────────────────────────
        if (!att.filename || typeof att.filename !== 'string') {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Anexo sem nome de arquivo válido.' }),
          };
        }

        // ── Segurança: sanitiza nome do arquivo ─────────────────
        att.filename = att.filename.replace(/[^a-zA-Z0-9._-]/g, '_');

        const size = Buffer.from(att.content, 'base64').length;
        if (size > 8 * 1024 * 1024) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: `Anexo '${att.filename}' excede 8 MB.` }),
          };
        }
      }
    }

    // ── Validação: credenciais SMTP ──────────────────────────────
    if (!process.env.SMTP_HOST) {
      return { statusCode: 500, body: JSON.stringify({ error: 'SMTP_HOST não configurado.' }) };
    }
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Credenciais SMTP não configuradas.' }),
      };
    }

    const transportConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: parseInt(process.env.SMTP_PORT || '465', 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 8000, // 8 segundos
      socketTimeout: 8000, // 8 segundos
    };

    const transporter = nodemailer.createTransport(transportConfig);

    const mailOptions = {
      from: SMTP_FROM,
      to: toList,
      subject,
      text: text || '',
      attachments: attachments || [],
    };

    await transporter.sendMail(mailOptions);

    // ── Segurança: log de auditoria ─────────────────────────────
    console.log(
      JSON.stringify({
        audit: true,
        to: toList,
        subject,
        anexos: (attachments || []).length,
        timestamp: new Date().toISOString(),
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('[send] SMTP error:', {
      message: error.message,
      code: error.code,
      command: error.command,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno ao enviar o email. Tente novamente.' }),
    };
  }
};

exports.handler = async event => {
  console.log('[send] Function invoked', {
    method: event.httpMethod,
    timestamp: new Date().toISOString(),
  });

  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
      }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const nodemailer = require('nodemailer');

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

    if (!text || typeof text !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Campo 'text' é obrigatório." }),
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

    const transportConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: parseInt(process.env.SMTP_PORT || '465', 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { rejectUnauthorized: false },
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

    // ── Seguran\u00e7a: log de auditoria ─────────────────────────────
    const auditLog = {
      audit: true,
      to: toList,
      subject,
      anexos: (attachments || []).length,
      timestamp: new Date().toISOString(),
    };
    console.log(JSON.stringify(auditLog));

    const responseBody = JSON.stringify({ success: true });
    console.log('[send] Returning 200 with body:', responseBody);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: responseBody,
    };
  } catch (error) {
    console.error('[send] SMTP error:', {
      message: error.message,
      code: error.code,
      command: error.command,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    const errorBody = JSON.stringify({ error: 'Erro interno ao enviar o email. Tente novamente.' });
    console.log('[send] Returning 500 with body:', errorBody);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: errorBody,
    };
  }
};

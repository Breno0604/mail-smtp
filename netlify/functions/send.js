const nodemailer = require("nodemailer");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const body = JSON.parse(event.body);
    const { to, subject, text, attachments } = body;

    if (!to || !subject) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields: to, subject" }) };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return { statusCode: 400, body: JSON.stringify({ error: "Formato de email inválido em 'Para'." }) };
    }
    if (attachments && attachments.length > 12) {
      return { statusCode: 400, body: JSON.stringify({ error: "Máximo de 12 anexos permitido." }) };
    }

    if (attachments) {
      for (const att of attachments) {
        const size = Buffer.from(att.content, "base64").length;
        if (size > 8 * 1024 * 1024) {
          return { statusCode: 400, body: JSON.stringify({ error: `Anexo '${att.filename}' excede 8 MB.` }) };
        }
      }
    }

    const transportConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "465", 10),
      secure: parseInt(process.env.SMTP_PORT || "465", 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { rejectUnauthorized: false },
    };

    const transporter = nodemailer.createTransport(transportConfig);

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to,
      subject,
      text: text || "",
      attachments: attachments || [],
    };

    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

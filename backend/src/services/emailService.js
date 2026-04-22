const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const prisma = require('../config/db');

const sendEmail = async (accountId, recipient, subject, bodyHtml) => {
  const account = await prisma.emailAccount.findUnique({
    where: { id: accountId },
    include: { user: true }
  });

  if (!account) throw new Error('Cuenta de email no encontrada');

  // Generar Tracking ID
  const sentEmail = await prisma.sentEmail.create({
    data: {
      accountId,
      recipient,
      subject,
      bodyHtml,
      status: 'SENDING'
    }
  });

  // Inyectar píxel de seguimiento
  const trackingPixelUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/track/${sentEmail.trackingId}`;
  const finalBodyHtml = `${bodyHtml}<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" />`;

  try {
    let transporter;

    if (account.provider === 'GMAIL') {
      const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      auth.setCredentials({ refresh_token: account.refreshToken });
      
      const gmail = google.gmail({ version: 'v1', auth });
      
      // Codificar correo para Gmail API
      const str = [
        `To: ${recipient}`,
        `Subject: ${subject}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        finalBodyHtml
      ].join('\n');

      const encodedMail = Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
      
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encodedMail }
      });

    } else if (account.provider === 'OUTLOOK') {
      // Para Outlook usaríamos MSAL + Axios o Nodemailer con OAuth2
      // Por simplicidad en este ejemplo, usaremos Nodemailer configurado para Outlook
      transporter = nodemailer.createTransport({
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
        auth: {
          type: 'OAuth2',
          user: account.email,
          clientId: process.env.AZURE_CLIENT_ID,
          clientSecret: process.env.AZURE_CLIENT_SECRET,
          refreshToken: account.refreshToken,
        }
      });

      await transporter.sendMail({
        from: account.email,
        to: recipient,
        subject: subject,
        html: finalBodyHtml
      });
    }

    // Actualizar estado a ENVIADO
    await prisma.sentEmail.update({
      where: { id: sentEmail.id },
      data: { status: 'SENT' }
    });

    return sentEmail;
  } catch (error) {
    console.error('Error enviando email:', error);
    await prisma.sentEmail.update({
      where: { id: sentEmail.id },
      data: { status: 'ERROR' }
    });
    throw error;
  }
};

module.exports = { sendEmail };

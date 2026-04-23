const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const prisma = require('../config/db');

const sendEmail = async (accountId, recipient, subject, bodyHtml, attachments = []) => {
  const account = await prisma.emailAccount.findUnique({
    where: { id: accountId },
    include: { company: true }
  });

  if (!account) throw new Error('Cuenta de email no encontrada');

  // Cargar Settings Maestras
  let googleClientId = process.env.GOOGLE_CLIENT_ID;
  let googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!googleClientId || !googleClientSecret) {
    const settings = await prisma.appSetting.findUnique({ where: { provider: 'GMAIL' } });
    if (settings) {
      googleClientId = settings.clientId;
      googleClientSecret = settings.clientSecret;
    }
  }

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

  // Procesar Adjuntos Inteligentes
  let attachmentHtml = '';
  if (attachments && attachments.length > 0) {
    const fs = require('fs');
    const path = require('path');
    const attachmentDir = path.join(__dirname, '../../attachments');

    for (const file of attachments) {
      const fileId = require('crypto').randomUUID();
      const fileName = file.name;
      const filePath = path.join(attachmentDir, fileId);
      
      // Guardar en disco (Base64 a Binario)
      fs.writeFileSync(filePath, Buffer.from(file.content, 'base64'));

      // Registrar en BD
      await prisma.fileAttachment.create({
        data: {
          id: fileId,
          name: fileName,
          size: file.content.length,
          mimeType: file.contentType || 'application/octet-stream',
          path: filePath,
          sentEmailId: sentEmail.id,
          expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // Exira en 15 días
        }
      });

      const downloadUrl = `https://mail-api.rosariogroupllc.com/api/download/${fileId}`;
      attachmentHtml += `
        <div style="margin-top: 30px; padding: 20px; border: 2px solid #e2e8f0; border-radius: 20px; background: #f8fafc; font-family: sans-serif;">
          <p style="margin: 0; color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Archivo Adjunto Seguro</p>
          <p style="margin: 8px 0 15px 0; font-weight: 700; color: #0f172a; font-size: 16px;">${fileName}</p>
          <a href="${downloadUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 25px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: 700; shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">Descargar Archivo</a>
          <p style="margin: 10px 0 0 0; color: #94a3b8; font-size: 10px;">Enlace seguro por Rosario Group. Expira en 15 días.</p>
        </div>
      `;
    }
  }

  // Inyectar píxel de seguimiento y adjuntos
  const trackingPixelUrl = `${process.env.BASE_URL || 'https://mail-api.rosariogroupllc.com'}/api/track/${sentEmail.trackingId}`;
  const finalBodyHtml = `${bodyHtml}${attachmentHtml}<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" />`;

  try {
    let transporter;

    if (account.provider === 'GMAIL') {
      const auth = new google.auth.OAuth2(googleClientId, googleClientSecret);
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
    
    // Notificar al administrador vía Pushover
    try {
      const notificationService = require('./notificationService');
      await notificationService.sendAdminAlert(
        'Fallo de Envío', 
        `Error enviando a ${recipient} desde ${account.email}. Detalle: ${error.message}`
      );
    } catch (nError) {
      console.error('No se pudo enviar la alerta de Pushover:', nError.message);
    }

    await prisma.sentEmail.update({
      where: { id: sentEmail.id },
      data: { status: 'ERROR' }
    });
    throw error;
  }
};

// Función para notificar errores críticos del sistema (Base de datos, etc)
const notifySystemError = async (errorTitle, errorMessage) => {
  try {
    const notificationService = require('./notificationService');
    await notificationService.sendAdminAlert(errorTitle, errorMessage, 2); // Prioridad alta
  } catch (e) {
    console.error('Error enviando notificación de sistema:', e);
  }
};

module.exports = { sendEmail, notifySystemError };

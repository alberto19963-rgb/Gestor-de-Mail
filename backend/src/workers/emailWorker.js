const { Worker } = require('bullmq');
const { connection } = require('../queues/emailQueue');
const { sendEmail } = require('../services/emailService');
const prisma = require('../config/db');

const emailWorker = new Worker('email-queue', async (job) => {
  const { accountId, recipient, subject, bodyHtml, attachments, senderName, fromAlias, sentEmailId } = job.data;
  
  try {
    console.log(`[Worker] Procesando envío a ${recipient} (ID: ${sentEmailId})`);
    
    // Llamar al servicio de email actualizado (que ahora aceptará sentEmailId y fromAlias)
    await sendEmail(accountId, recipient, subject, bodyHtml, attachments, senderName, fromAlias, sentEmailId);
    
    console.log(`[Worker] Envío exitoso a ${recipient}`);
  } catch (error) {
    console.error(`[Worker] Error enviando a ${recipient}:`, error.message);
    throw error; // Lanzar error para que BullMQ lo reintente si aplica
  }
}, { connection });

emailWorker.on('failed', (job, err) => {
  console.log(`[Worker] El trabajo ${job.id} falló de forma definitiva tras reintentos:`, err.message);
});

module.exports = emailWorker;

const axios = require('axios');
const prisma = require('../config/db');

/**
 * Servicio centralizado de notificaciones administrativas vía Pushover.
 */
class NotificationService {
  /**
   * Envía una alerta al administrador si las credenciales de Pushover están configuradas.
   * @param {string} title Título de la alerta (ej: "Error de Envío")
   * @param {string} message Contenido del error
   * @param {string} priority Prioridad de Pushover (-2 a 2)
   */
  async sendAdminAlert(title, message, priority = 1) {
    try {
      // 1. Prioridad: Usar llaves blindadas del .env
      let userKey = process.env.PUSHOVER_USER_KEY;
      let apiToken = process.env.PUSHOVER_API_TOKEN;

      // 2. Si no están en el .env, buscamos en la base de datos (fallback)
      if (!userKey || !apiToken) {
        const settings = await prisma.appSetting.findUnique({
          where: { provider: 'PUSHOVER' }
        });
        if (settings) {
          userKey = settings.clientId;
          apiToken = settings.clientSecret;
        }
      }

      if (!userKey || !apiToken) {
        console.log('🔔 Notificación omitida: Pushover no está configurado.');
        return;
      }

      // 3. Enviamos a la API de Pushover
      await axios.post('https://api.pushover.net/1/messages.json', {
        token: apiToken,
        user: userKey,
        title: `⚠️ MailEngine: ${title}`,
        message: message,
        priority: priority,
        sound: 'falling'
      });

      console.log('✅ Alerta enviada al móvil del administrador.');
    } catch (error) {
      console.error('❌ Error al intentar enviar notificación a Pushover:', error.message);
    }
  }
}

module.exports = new NotificationService();

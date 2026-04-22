const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const prisma = require('../config/db');
const { sendEmail } = require('../services/emailService');
const { trackOpening } = require('../controllers/trackingController');
const { getGoogleAuthUrl, getGoogleTokens } = require('../services/authService');
const notificationService = require('../services/notificationService');
const path = require('path');

// Middleware de Log
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Ruta para persistencia del código (fuera de la memoria volátil)
const OTP_FILE = path.join(__dirname, '../../otp_state.json');

// --- SEGURIDAD: ALMACÉN DE LLAVE DINÁMICA ---
let currentOTP = {
  code: null,
  uses: 0,
  maxUses: 5,
  expiresAt: null
};

// Cargar estado inicial si existe
try {
  if (fs.existsSync(OTP_FILE)) {
    const saved = fs.readFileSync(OTP_FILE, 'utf8');
    const parsed = JSON.parse(saved);
    if (parsed.expiresAt) {
      parsed.expiresAt = new Date(parsed.expiresAt);
    }
    currentOTP = parsed;
    console.log('💾 Estado de OTP recuperado del disco.');
  }
} catch (e) {
  console.log('⚠️ No se pudo cargar el estado de OTP anterior.');
}

const saveOTP = () => {
  try {
    fs.writeFileSync(OTP_FILE, JSON.stringify(currentOTP, null, 2));
  } catch (e) {
    console.error('❌ Error al guardar el estado de OTP:', e.message);
  }
};

// --- API ADMINISTRATIVA (DASHBOARD) ---

// Estadísticas generales
router.get('/api/admin/stats', async (req, res) => {
  try {
    const totalMails = await prisma.sentEmail.count();
    const successMails = await prisma.sentEmail.count({ where: { status: 'SENT' } });
    const errorMails = await prisma.sentEmail.count({ where: { status: { in: ['ERROR', 'BOUNCED'] } } });
    
    res.json({
      total: totalMails,
      success: successMails,
      errors: errorMails,
      successRate: totalMails > 0 ? ((successMails / totalMails) * 100).toFixed(1) + '%' : '100%'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar Programas
router.get('/api/admin/platforms', async (req, res) => {
  try {
    const platforms = await prisma.platform.findMany({
      include: { _count: { select: { companies: true } } }
    });
    res.json(platforms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear Programa
router.post('/api/admin/platforms', async (req, res) => {
  const { name, url } = req.body;
  try {
    const platform = await prisma.platform.create({
      data: { 
        name, 
        url,
        apiKey: `pk_${Math.random().toString(36).substring(2, 20)}`
      }
    });
    res.json(platform);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear Empresa (NUEVO ENDPOINT COMPLETO)
router.post('/api/admin/companies', async (req, res) => {
  const { name, platformId, rnc } = req.body;
  try {
    const company = await prisma.company.create({
      data: { 
        name, 
        platformId, 
        rnc,
        clientApiKey: `cli_${Math.random().toString(36).substring(2, 15)}`
      }
    });
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar Empresas
router.get('/api/admin/companies', async (req, res) => {
  const { platformId } = req.query;
  try {
    const companies = await prisma.company.findMany({
      where: platformId ? { platformId } : {},
      include: { platform: true, _count: { select: { accounts: true } }, accounts: true }
    });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar Logs Recientes
router.get('/api/admin/logs', async (req, res) => {
  try {
    const logs = await prisma.sentEmail.findMany({
      take: 20,
      orderBy: { sentAt: 'desc' },
      include: { 
        account: { include: { company: { include: { platform: true } } } } 
      }
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- MONITOREO ---
router.get('/api/health', async (req, res) => {
  let dbStatus = 'DISCONNECTED';
  
  try {
    // Intentamos conectar con un tiempo límite de 2 segundos
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
    ]);
    dbStatus = 'CONNECTED';
  } catch (e) {
    console.log('⚠️ Base de datos no responde en localhost:', e.message);
  }

  res.json({ 
    status: 'UP', 
    database: dbStatus, 
    pushover: !!(process.env.PUSHOVER_USER_KEY && process.env.PUSHOVER_API_TOKEN),
    timestamp: new Date() 
  });
});

// --- SEGURIDAD: SOLICITAR CÓDIGO (OTP) ---
router.post('/api/admin/request-otp', async (req, res) => {
  const { name } = req.body;
  
  if (name !== 'Luis Alberto del Rosario') {
    return res.status(401).json({ error: 'Nombre no autorizado. Solo el Administrador puede entrar.' });
  }

  const now = new Date();
  
  // Reutilizar código si sigue vivo (SIN mandar nuevo mensaje de Pushover)
  if (currentOTP.code && currentOTP.uses < currentOTP.maxUses && currentOTP.expiresAt > now) {
    return res.json({ 
      message: 'Tu llave sigue activa. Usa el último código recibido.',
      reused: true 
    });
  }

  // Generar nuevo si no hay o murió
  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  currentOTP = {
    code: newCode,
    uses: 0,
    maxUses: 5,
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
  };

  saveOTP(); // Guardar en disco

  console.log('-------------------------------------------');
  console.log(`🔐 NUEVO CÓDIGO GENERADO: ${newCode}`);
  console.log('-------------------------------------------');

  const alertMsg = `🔐 Nueva Llave Maestra: ${newCode}\n\nUso permitido: 5 veces.\nVigencia: 24 horas.`;
  await notificationService.sendAdminAlert('Acceso de Seguridad', alertMsg, 1);

  res.json({ message: 'Nuevo código enviado por Pushover' });
});

// --- SEGURIDAD: VERIFICAR CÓDIGO ---
router.post('/api/admin/verify-otp', (req, res) => {
  const { code } = req.body;
  const now = new Date();

  if (!currentOTP.code || currentOTP.code !== code) {
    return res.status(401).json({ error: 'Código incorrecto' });
  }

  if (currentOTP.uses >= currentOTP.maxUses) {
    return res.status(401).json({ error: 'Llave agotada (5/5 usos). Solicita una nueva.' });
  }

  if (currentOTP.expiresAt < now) {
    return res.status(401).json({ error: 'Llave expirada (pasaron 24h).' });
  }

  currentOTP.uses += 1;
  saveOTP(); // Actualizar usos en disco
  
  res.json({ 
    success: true, 
    usesDone: currentOTP.uses,
    maxUses: currentOTP.maxUses,
    message: `Acceso concedido. Uso ${currentOTP.uses} de 5.`
  });
});

// Probar notificación de Pushover
router.get('/api/admin/test-pushover', async (req, res) => {
  try {
    const notificationService = require('../services/notificationService');
    await notificationService.sendAdminAlert(
      'Prueba de Conexión', 
      '¡Hola Alberto! Si recibes esto, el sistema de alertas blindado está funcionando perfectamente.'
    );
    res.json({ message: 'Alerta de prueba enviada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- API CONFIGURACIÓN (LLAVES MAESTRAS) ---

// Obtener todas las configuraciones
router.get('/api/admin/settings', async (req, res) => {
  try {
    const settings = await prisma.appSetting.findMany();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Guardar/Actualizar configuración de un proveedor
router.post('/api/admin/settings', async (req, res) => {
  const { provider, clientId, clientSecret } = req.body;
  try {
    const setting = await prisma.appSetting.upsert({
      where: { provider },
      update: { clientId, clientSecret },
      create: { provider, clientId, clientSecret }
    });
    res.json(setting);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- RUTAS DE ENVÍO Y TRACKING ---
router.post('/api/send', async (req, res) => {
  const { accountId, email, recipient, subject, bodyHtml, apiKey } = req.body;
  
  // 1. Validar Plataforma
  const platform = await prisma.platform.findUnique({ where: { apiKey } });
  if (!platform) return res.status(401).json({ error: 'API Key inválida' });

  try {
    let targetAccountId = accountId;

    // 2. Si pasan email en lugar de ID, buscar la cuenta
    if (!targetAccountId && email) {
      const account = await prisma.emailAccount.findFirst({
        where: { email, status: 'ACTIVE' }
      });
      if (!account) return res.status(404).json({ error: 'Cuenta de email no encontrada o inactiva' });
      targetAccountId = account.id;
    }

    if (!targetAccountId) return res.status(400).json({ error: 'Se requiere accountId o email' });

    const result = await sendEmail(targetAccountId, recipient, subject, bodyHtml);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- RUTAS DE AUTH (CALLBACKS) ---
router.get('/auth/google/callback', async (req, res) => {
  const { code, state } = req.query;
  try {
    const { tokens } = await getGoogleTokens(code);
    const { companyId, email } = JSON.parse(state);

    const account = await prisma.emailAccount.upsert({
      where: { email },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expiry_date),
        status: 'ACTIVE'
      },
      create: {
        email,
        provider: 'GMAIL',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expiry_date),
        companyId,
        auditAccessKey: `pass_${Math.random().toString(36).substring(2, 10)}`,
        status: 'ACTIVE'
      }
    });

    res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #10b981;">¡Cuenta Enlazada con Éxito!</h1>
        <p>Ya puedes cerrar esta ventana y volver a la aplicación.</p>
      </div>
    `);
  } catch (error) {
    res.status(500).send('Error en la autenticación: ' + error.message);
  }
});

// --- API EXTERNA PARA ENLAZAR GMAIL ---
router.post('/api/external/request-auth', async (req, res) => {
  const { email, companyName, apiKey } = req.body;
  
  // 1. Validar Plataforma
  const platform = await prisma.platform.findUnique({ where: { apiKey } });
  if (!platform) return res.status(401).json({ error: 'API Key de plataforma inválida' });

  try {
    // 2. Buscar o crear empresa
    let company = await prisma.company.findFirst({
      where: { name: companyName, platformId: platform.id }
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: companyName,
          platformId: platform.id,
          clientApiKey: `cli_${Math.random().toString(36).substring(2, 15)}`
        }
      });
    }

    // 3. Generar URL de Google Auth
    const authUrl = await getGoogleAuthUrl(JSON.stringify({ companyId: company.id, email }));
    res.json({ authUrl });

  } catch (error) {
    console.error('Error in request-auth:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/external/status/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const account = await prisma.emailAccount.findUnique({
      where: { email },
      select: { auditAccessKey: true, status: true }
    });
    
    if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });
    res.json(account);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/track/:trackingId', trackOpening);

module.exports = router;

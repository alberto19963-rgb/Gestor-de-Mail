const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const prisma = require('../config/db');
const { sendEmail } = require('../services/emailService');
const { trackOpening } = require('../controllers/trackingController');
const { getGoogleAuthUrl, getGoogleTokens } = require('../services/authService');
const notificationService = require('../services/notificationService');
const path = require('path');
const fs = require('fs');

// Middleware de Log
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

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

// Crear Programa (CON INTELIGENCIA ANTI-DUPLICADOS)
router.post('/api/admin/platforms', async (req, res) => {
  const { name, url } = req.body;
  try {
    // 1. Buscar si ya existe por nombre
    const existing = await prisma.platform.findFirst({ where: { name } });
    if (existing) {
      console.log(`♻️ Reutilizando Programa existente: ${name}`);
      return res.json(existing);
    }

    // 2. Si no existe, crear uno nuevo
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

// Crear Empresa (CON INTELIGENCIA ANTI-DUPLICADOS)
router.post('/api/admin/companies', async (req, res) => {
  const { name, platformId, rnc } = req.body;
  try {
    // 1. Buscar si ya existe la empresa dentro de este programa
    const existing = await prisma.company.findFirst({
      where: { name, platformId }
    });

    if (existing) {
      console.log(`♻️ Reutilizando Empresa existente: ${name}`);
      return res.json(existing);
    }

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

// Eliminar Programa
router.delete('/api/admin/platforms/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.platform.delete({ where: { id } });
    res.json({ message: 'Programa eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo eliminar el programa. Asegúrate de borrar sus empresas primero.' });
  }
});

// Eliminar Empresa
router.delete('/api/admin/companies/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.company.delete({ where: { id } });
    res.json({ message: 'Empresa eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo eliminar la empresa. Borra sus cuentas vinculadas primero.' });
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
  
  // Buscar llave actual en BD
  let auth = await prisma.adminAuth.findUnique({ where: { id: 1 } });

  // Reutilizar código si sigue vivo (Dura 7 días, pero máximo 5 usos)
  if (auth && auth.code && auth.uses < auth.maxUses && auth.expiresAt > now) {
    return res.json({ 
      message: 'Tu llave sigue activa. Usa el último código recibido.',
      reused: true 
    });
  }

  // Generar nuevo si no hay, murió por tiempo o se agotaron los usos
  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  auth = await prisma.adminAuth.upsert({
    where: { id: 1 },
    update: {
      code: newCode,
      uses: 0,
      maxUses: 5,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // Llave dura 7 DÍAS
    },
    create: {
      id: 1,
      code: newCode,
      uses: 0,
      maxUses: 5,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  console.log('-------------------------------------------');
  console.log(`🔐 NUEVO CÓDIGO GENERADO Y GUARDADO EN BD: ${newCode}`);
  console.log('-------------------------------------------');

  const alertMsg = `🔐 Nueva Llave Maestra: ${newCode}\n\nUso permitido: 5 veces.\nVigencia: 7 días.`;
  await notificationService.sendAdminAlert('Acceso de Seguridad', alertMsg, 1);

  res.json({ message: 'Nuevo código enviado por Pushover' });
});

// --- SEGURIDAD: VERIFICAR CÓDIGO ---
router.post('/api/admin/verify-otp', async (req, res) => {
  const { code } = req.body;
  const now = new Date();

  // Buscar llave en BD
  const auth = await prisma.adminAuth.findUnique({ where: { id: 1 } });

  if (!auth || !auth.code || auth.code !== code) {
    return res.status(401).json({ error: 'Código incorrecto' });
  }

  if (auth.uses >= auth.maxUses) {
    return res.status(401).json({ error: 'Llave agotada (5/5 usos). Solicita una nueva.' });
  }

  if (auth.expiresAt < now) {
    return res.status(401).json({ error: 'Llave expirada (pasaron 7 días).' });
  }

  // Incrementar usos en BD
  const updatedAuth = await prisma.adminAuth.update({
    where: { id: 1 },
    data: { uses: { increment: 1 } }
  });
  
  res.json({ 
    success: true, 
    usesDone: updatedAuth.uses,
    maxUses: updatedAuth.maxUses,
    message: `Acceso concedido. Uso ${updatedAuth.uses} de 5. Esta sesión dura 24h.`
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

router.post('/api/portal/login', async (req, res) => {
  const { email, accessKey } = req.body;
  try {
    const account = await prisma.emailAccount.findFirst({
      where: { 
        email, 
        auditAccessKey: accessKey 
      },
      include: {
        sentEmails: {
          orderBy: { sentAt: 'desc' },
          take: 50
        }
      }
    });

    if (!account) return res.status(401).json({ error: 'Credenciales inválidas' });
    
    res.json({ logs: account.sentEmails });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/track/:trackingId', trackOpening);

module.exports = router;

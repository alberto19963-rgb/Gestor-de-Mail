const express = require('express');
const router = express.Router();
const { sendEmail } = require('../services/emailService');
const { trackOpening } = require('../controllers/trackingController');
const { getGoogleAuthUrl, getGoogleTokens } = require('../services/authService');
const prisma = require('../config/db');

// --- API ADMINISTRATIVA (DASHBOARD) ---

// Estadísticas generales
router.get('/api/admin/stats', async (req, res) => {
  try {
    const totalMails = await prisma.emailLog.count();
    const successMails = await prisma.emailLog.count({ where: { status: 'SENT' } });
    const errorMails = await prisma.emailLog.count({ where: { status: { in: ['ERROR', 'BOUNCED'] } } });
    
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
  const { name, callbackUrl } = req.body;
  try {
    const platform = await prisma.platform.create({
      data: { 
        name, 
        callbackUrl,
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
    const logs = await prisma.emailLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { 
        account: { include: { company: { include: { platform: true } } } } 
      }
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- API PORTAL (USUARIO FINAL) ---

// Login y Logs de un usuario
router.post('/api/portal/login', async (req, res) => {
  const { email, accessKey } = req.body;
  try {
    const account = await prisma.emailAccount.findFirst({
      where: { email, auditAccessKey: accessKey },
      include: { company: true }
    });
    
    if (!account) return res.status(401).json({ error: 'Credenciales inválidas' });
    
    const logs = await prisma.emailLog.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ account, logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- RUTAS DE ENVÍO Y TRACKING ---
router.post('/api/send', async (req, res) => {
  const { accountId, recipient, subject, bodyHtml, apiKey } = req.body;
  const platform = await prisma.platform.findUnique({ where: { apiKey } });
  if (!platform) return res.status(401).json({ error: 'API Key inválida' });

  try {
    const result = await sendEmail(accountId, recipient, subject, bodyHtml);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/track/:trackingId', trackOpening);

module.exports = router;

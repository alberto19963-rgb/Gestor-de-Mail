const express = require('express');
const router = express.Router();
const { sendEmail } = require('../services/emailService');
const { trackOpening } = require('../controllers/trackingController');
const { getGoogleAuthUrl, getGoogleTokens, getMicrosoftAuthUrl, getMicrosoftTokens } = require('../services/authService');
const prisma = require('../config/db');

// --- RUTAS DE AUTH OAUTH2 ---

// Google
router.get('/auth/google/:userId', (req, res) => {
  const url = getGoogleAuthUrl(req.params.userId);
  res.redirect(url);
});

router.get('/api/auth/google/callback', async (req, res) => {
  const { code, state: userId } = req.query;
  try {
    const tokens = await getGoogleTokens(code);
    
    // Guardar o actualizar cuenta
    await prisma.emailAccount.upsert({
      where: { email: tokens.email || 'pending@gmail.com' }, // Deberíamos obtener el email del token
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expiry_date),
      },
      create: {
        email: 'placeholder@gmail.com', // Obtener via googleapis
        provider: 'GMAIL',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expiry_date),
        userId: userId,
      }
    });

    res.send('Cuenta vinculada con éxito. Puedes cerrar esta ventana.');
  } catch (error) {
    res.status(500).send('Error vinculando cuenta');
  }
});

// --- RUTA DE ENVÍO ---
router.post('/api/send', async (req, res) => {
  const { accountId, recipient, subject, bodyHtml, apiKey } = req.body;
  
  // Validar API Key de la plataforma
  const platform = await prisma.platform.findUnique({ where: { apiKey } });
  if (!platform) return res.status(401).json({ error: 'API Key inválida' });

  try {
    const result = await sendEmail(accountId, recipient, subject, bodyHtml);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- RUTA DE TRACKING ---
router.get('/api/track/:trackingId', trackOpening);

module.exports = router;

const { google } = require('googleapis');
const { PublicClientApplication, ConfidentialClientApplication } = require('@azure/msal-node');
const prisma = require('../config/db');

// Configuración de Google
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const getGoogleAuthUrl = async (userId) => {
  let clientId = process.env.GOOGLE_CLIENT_ID;
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  let redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret) {
    const settings = await prisma.appSetting.findUnique({ where: { provider: 'GMAIL' } });
    if (settings) {
      clientId = settings.clientId;
      clientSecret = settings.clientSecret;
      // Usamos la URL oficial de tu túnel Cloudflare
      redirectUri = 'https://mail-api.rosariogroupllc.com/auth/google/callback';
    }
  }

  if (!clientId) throw new Error('Google Client ID no configurado');

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  
  return oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/userinfo.email'],
    state: userId,
    prompt: 'consent'
  });
};

const getGoogleTokens = async (code) => {
  let clientId = process.env.GOOGLE_CLIENT_ID;
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  let redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://mail-api.rosariogroupllc.com/auth/google/callback';

  if (!clientId || !clientSecret) {
    const settings = await prisma.appSetting.findUnique({ where: { provider: 'GMAIL' } });
    if (settings) {
      clientId = settings.clientId;
      clientSecret = settings.clientSecret;
      redirectUri = 'https://mail-api.rosariogroupllc.com/auth/google/callback';
    }
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const { tokens } = await oauth2.getToken(code);
  return { tokens };
};

// Configuración de Microsoft (Outlook)
const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || 'common'}`,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
  }
};

const getMicrosoftAuthUrl = (userId) => {
  if (!process.env.AZURE_CLIENT_ID) throw new Error('Azure Client ID no configurado');
  const cca = new ConfidentialClientApplication(msalConfig);
  return cca.getAuthCodeUrl({
    scopes: ['https://graph.microsoft.com/Mail.Send', 'offline_access', 'User.Read'],
    redirectUri: process.env.AZURE_REDIRECT_URI,
    state: userId
  });
};

const getMicrosoftTokens = async (code) => {
  if (!process.env.AZURE_CLIENT_ID) throw new Error('Azure Client ID no configurado');
  const cca = new ConfidentialClientApplication(msalConfig);
  const tokenRequest = {
    code,
    scopes: ['https://graph.microsoft.com/Mail.Send', 'offline_access', 'User.Read'],
    redirectUri: process.env.AZURE_REDIRECT_URI,
  };
  return await cca.acquireTokenByCode(tokenRequest);
};

module.exports = {
  getGoogleAuthUrl,
  getGoogleTokens,
  getMicrosoftAuthUrl,
  getMicrosoftTokens
};

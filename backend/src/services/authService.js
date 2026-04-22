const { google } = require('googleapis');
const { PublicClientApplication, ConfidentialClientApplication } = require('@azure/msal-node');
const prisma = require('../config/db');

// Configuración de Google
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const getGoogleAuthUrl = (userId) => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/userinfo.email'],
    state: userId, // Pasamos el userId para saber a quién pertenece la cuenta al volver
    prompt: 'consent'
  });
};

const getGoogleTokens = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
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

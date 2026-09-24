require('dotenv').config();
const path = require('path');
const dns = require('dns');
const need = (k) => { if (!process.env[k]) throw new Error(`Missing required environment variable: ${k}`); return process.env[k]; };
const mongoDnsServers = (process.env.MONGO_DNS_SERVERS || '').split(',').map((server) => server.trim()).filter(Boolean);
if (mongoDnsServers.length) dns.setServers(mongoDnsServers);
module.exports = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: need('MONGO_URI'),
  mongoDnsServers,
  jwtSecret: need('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  clientOrigins: [
    ...(process.env.CLIENT_URL || 'http://localhost:5173').split(','),
    process.env.FRONTEND_URL || 'https://frontend-orcin-sigma-43.vercel.app',
  ].map((origin) => origin.trim()).filter(Boolean),
  uploadDir: path.resolve(process.env.UPLOAD_DIR || 'uploads'),
  smtp: { host: process.env.SMTP_HOST, port: process.env.SMTP_PORT, user: process.env.SMTP_USER, password: process.env.SMTP_PASSWORD },
};

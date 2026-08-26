require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/clinic_management',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'no-reply@clinicapp.com',
  },
  payment: {
    provider: process.env.PAYMENT_PROVIDER || 'mock',
    bkash: { appKey: process.env.BKASH_APP_KEY, appSecret: process.env.BKASH_APP_SECRET },
    sslcommerz: { storeId: process.env.SSLCOMMERZ_STORE_ID, storePass: process.env.SSLCOMMERZ_STORE_PASS },
  },
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB) || 10,
  ai: {
    provider: process.env.AI_PROVIDER || 'mock',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  },
};

const app = require('./app');
const { testConnection } = require('./config/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '127.0.0.1';

async function startServer() {
  console.log('Connecting to database...');
  const conn = await testConnection();
  if (conn.success) {
    console.log(`✅ Connected to PostgreSQL database: "${conn.db}" (Server Time: ${conn.time})`);
  } else {
    console.warn(`⚠️ PostgreSQL connection warning: ${conn.error}`);
    console.warn('   Ensure PostgreSQL is running and DATABASE_URL is configured in .env');
  }

  app.listen(PORT, HOST, () => {
    console.log(`====================================================`);
    console.log(`🚀 OXYBOTT MODULAR BACKEND SERVER RUNNING`);
    console.log(`📍 API Base:        http://${HOST}:${PORT}/api`);
    console.log(`🏥 Health Check:    http://${HOST}:${PORT}/api/health`);
    console.log(`🔒 Environment:     ${process.env.NODE_ENV || 'development'}`);
    console.log(`====================================================`);
  });
}

startServer();


const fs = require('fs');
const path = require('path');
const { query } = require('../config/db');

async function runMigrations() {
  console.log('=== Running PostgreSQL Migrations ===');
  const sqlFile = path.join(__dirname, 'migrations', '001_init.sql');
  if (!fs.existsSync(sqlFile)) {
    throw new Error(`Migration file not found at ${sqlFile}`);
  }

  const sql = fs.readFileSync(sqlFile, 'utf8');
  try {
    await query(sql);
    console.log('✅ PostgreSQL Schema initialized successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = runMigrations;


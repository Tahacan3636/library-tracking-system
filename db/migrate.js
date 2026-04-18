const fs = require('fs');
const path = require('path');
const db = require('../config/db');

function migrate() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    try {
      db.exec(sql);
      console.log('Applied:', file);
    } catch (err) {
      console.error('Failed:', file, err.message);
      process.exit(1);
    }
  }

  console.log('All migrations applied successfully.');
}

migrate();

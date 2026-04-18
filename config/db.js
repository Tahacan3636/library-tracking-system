const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'kutuphane.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Wrapper to match pg-style query interface used throughout the app
module.exports = {
  // Mimics pg's pool.query() — returns { rows: [...] }
  query: (text, params) => {
    const sql = convertPlaceholders(text);
    const trimmed = sql.trim().toUpperCase();

    if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH')) {
      const stmt = db.prepare(sql);
      const rows = params ? stmt.all(...params) : stmt.all();
      return { rows };
    }

    if (sql.toUpperCase().includes('RETURNING')) {
      const stmt = db.prepare(sql);
      const rows = params ? stmt.all(...params) : stmt.all();
      return { rows };
    }

    const stmt = db.prepare(sql);
    const result = params ? stmt.run(...params) : stmt.run();
    return { rows: [], changes: result.changes, lastInsertRowid: result.lastInsertRowid };
  },

  // Execute raw SQL (for migrations)
  exec: (sql) => {
    db.exec(sql);
  },

  // Direct access to db instance
  db
};

// Convert PostgreSQL $1, $2 placeholders to SQLite ?
function convertPlaceholders(sql) {
  return sql.replace(/\$(\d+)/g, '?');
}

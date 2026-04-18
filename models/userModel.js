const db = require('../config/db');

module.exports = {
  findByUsername(username) {
    const stmt = db.db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username) || null;
  },

  create(username, passwordHash, role) {
    const stmt = db.db.prepare(
      `INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)`
    );
    const result = stmt.run(username, passwordHash, role);
    return { id: result.lastInsertRowid, username, role };
  },

  findById(id) {
    const stmt = db.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) || null;
  },

  updatePassword(id, passwordHash) {
    const stmt = db.db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    stmt.run(passwordHash, id);
  },

  getAll() {
    const stmt = db.db.prepare('SELECT id, username, role FROM users ORDER BY id');
    return stmt.all();
  },

  deleteById(id) {
    const stmt = db.db.prepare('DELETE FROM users WHERE id = ?');
    return stmt.run(id);
  }
};

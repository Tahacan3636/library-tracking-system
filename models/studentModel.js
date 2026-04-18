const db = require('../config/db');

module.exports = {
  findBySchoolNo(schoolNo) {
    const stmt = db.db.prepare('SELECT * FROM students WHERE school_no = ?');
    return stmt.get(schoolNo) || null;
  },

  findById(id) {
    const stmt = db.db.prepare('SELECT * FROM students WHERE id = ?');
    return stmt.get(id) || null;
  },

  getAll({ page = 1, limit = 20, search = '' }) {
    const offset = (page - 1) * limit;

    if (search) {
      const pattern = `%${search}%`;
      const countStmt = db.db.prepare(
        `SELECT COUNT(*) as count FROM students WHERE name LIKE ? OR surname LIKE ? OR school_no LIKE ?`
      );
      const total = countStmt.get(pattern, pattern, pattern).count;

      const dataStmt = db.db.prepare(
        `SELECT * FROM students WHERE name LIKE ? OR surname LIKE ? OR school_no LIKE ?
         ORDER BY id DESC LIMIT ? OFFSET ?`
      );
      const students = dataStmt.all(pattern, pattern, pattern, limit, offset);
      return { total, students };
    }

    const countStmt = db.db.prepare('SELECT COUNT(*) as count FROM students');
    const total = countStmt.get().count;

    const dataStmt = db.db.prepare('SELECT * FROM students ORDER BY id DESC LIMIT ? OFFSET ?');
    const students = dataStmt.all(limit, offset);
    return { total, students };
  },

  create(name, surname, schoolNo) {
    const stmt = db.db.prepare(
      `INSERT INTO students (name, surname, school_no) VALUES (?, ?, ?)`
    );
    const result = stmt.run(name, surname, schoolNo);
    return { id: result.lastInsertRowid, name, surname, school_no: schoolNo };
  },

  update(id, { name, surname, school_no }) {
    const stmt = db.db.prepare(
      `UPDATE students SET name = ?, surname = ?, school_no = ?, updated_at = datetime('now') WHERE id = ?`
    );
    const result = stmt.run(name, surname, school_no, id);
    if (result.changes === 0) return null;
    return { id, name, surname, school_no };
  },

  delete(id) {
    const student = db.db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    if (!student) return null;
    db.db.prepare('DELETE FROM students WHERE id = ?').run(id);
    return student;
  },

  bulkCreate(students) {
    let imported = 0;
    let skipped = 0;
    const errors = [];

    const insertStmt = db.db.prepare(
      `INSERT OR IGNORE INTO students (name, surname, school_no) VALUES (?, ?, ?)`
    );

    for (const s of students) {
      try {
        if (!s.name || !s.surname || !s.school_no) {
          errors.push({ school_no: s.school_no, error: 'Eksik alan' });
          skipped++;
          continue;
        }
        const result = insertStmt.run(s.name.trim(), s.surname.trim(), String(s.school_no).trim());
        if (result.changes > 0) imported++;
        else skipped++;
      } catch (err) {
        errors.push({ school_no: s.school_no, error: err.message });
        skipped++;
      }
    }

    return { imported, skipped, errors };
  }
};

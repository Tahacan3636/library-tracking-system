const db = require('../config/db');

module.exports = {
  findActiveByStudentId(studentId) {
    const stmt = db.db.prepare(
      'SELECT * FROM sessions WHERE student_id = ? AND exit_time IS NULL'
    );
    return stmt.get(studentId) || null;
  },

  createEntry(studentId) {
    const now = new Date().toISOString();
    const stmt = db.db.prepare(
      `INSERT INTO sessions (student_id, entry_time) VALUES (?, ?)`
    );
    const result = stmt.run(studentId, now);
    const session = db.db.prepare('SELECT * FROM sessions WHERE id = ?').get(result.lastInsertRowid);
    return session;
  },

  closeSession(sessionId, exitTime, duration) {
    const exitTimeStr = exitTime instanceof Date ? exitTime.toISOString() : exitTime;
    const stmt = db.db.prepare(
      'UPDATE sessions SET exit_time = ?, duration = ? WHERE id = ?'
    );
    stmt.run(exitTimeStr, duration, sessionId);
    return db.db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  },

  getActiveStudents() {
    const stmt = db.db.prepare(`
      SELECT s.id AS session_id, st.name, st.surname, st.school_no, s.entry_time
      FROM sessions s
      JOIN students st ON s.student_id = st.id
      WHERE s.exit_time IS NULL
      ORDER BY s.entry_time DESC
    `);
    return stmt.all();
  },

  getLogs({ startDate, endDate, studentName, schoolNo, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (startDate) {
      conditions.push('s.entry_time >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push("s.entry_time < date(?, '+1 day')");
      params.push(endDate);
    }
    if (studentName) {
      conditions.push('(st.name LIKE ? OR st.surname LIKE ?)');
      params.push(`%${studentName}%`, `%${studentName}%`);
    }
    if (schoolNo) {
      conditions.push('st.school_no = ?');
      params.push(schoolNo);
    }

    const whereClause = conditions.length > 0
      ? 'WHERE ' + conditions.join(' AND ')
      : '';

    const countStmt = db.db.prepare(
      `SELECT COUNT(*) as count FROM sessions s
       JOIN students st ON s.student_id = st.id
       ${whereClause}`
    );
    const total = countStmt.get(...params).count;

    const dataStmt = db.db.prepare(
      `SELECT s.id, st.name, st.surname, st.school_no,
              s.entry_time, s.exit_time, s.duration
       FROM sessions s
       JOIN students st ON s.student_id = st.id
       ${whereClause}
       ORDER BY s.entry_time DESC
       LIMIT ? OFFSET ?`
    );
    const logs = dataStmt.all(...params, limit, offset);

    return { total, logs };
  },

  getAllLogs({ startDate, endDate, studentName, schoolNo }) {
    const conditions = [];
    const params = [];

    if (startDate) {
      conditions.push('s.entry_time >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push("s.entry_time < date(?, '+1 day')");
      params.push(endDate);
    }
    if (studentName) {
      conditions.push('(st.name LIKE ? OR st.surname LIKE ?)');
      params.push(`%${studentName}%`, `%${studentName}%`);
    }
    if (schoolNo) {
      conditions.push('st.school_no = ?');
      params.push(schoolNo);
    }

    const whereClause = conditions.length > 0
      ? 'WHERE ' + conditions.join(' AND ')
      : '';

    const stmt = db.db.prepare(
      `SELECT st.name AS "First Name", st.surname AS "Last Name", st.school_no AS "Student ID",
              s.entry_time AS "Entry Time", s.exit_time AS "Exit Time",
              s.duration AS "Duration (min)"
       FROM sessions s
       JOIN students st ON s.student_id = st.id
       ${whereClause}
       ORDER BY s.entry_time DESC`
    );

    return stmt.all(...params);
  }
};

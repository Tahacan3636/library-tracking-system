const bcrypt = require('bcryptjs');
const db = require('../config/db');
const env = require('../config/env');

function seed() {
  try {
    // Create default admin user
    const adminHash = bcrypt.hashSync(env.DEFAULT_ADMIN_PASSWORD, 10);
    db.db.prepare(
      `INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)`
    ).run('admin', adminHash, 'admin');
    console.log('Default admin user created (admin / ' + env.DEFAULT_ADMIN_PASSWORD + ')');

    // Create default staff user
    const staffHash = bcrypt.hashSync(env.DEFAULT_STAFF_PASSWORD, 10);
    db.db.prepare(
      `INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)`
    ).run('staff', staffHash, 'staff');
    console.log('Default staff user created (staff / ' + env.DEFAULT_STAFF_PASSWORD + ')');

    // Create sample students
    const insertStudent = db.db.prepare(
      `INSERT OR IGNORE INTO students (name, surname, school_no) VALUES (?, ?, ?)`
    );

    const students = [
      ['Ahmet', 'Yilmaz', '2024001'],
      ['Ayse', 'Kaya', '2024002'],
      ['Mehmet', 'Demir', '2024003'],
      ['Fatma', 'Celik', '2024004'],
      ['Ali', 'Sahin', '2024005']
    ];

    for (const [name, surname, schoolNo] of students) {
      insertStudent.run(name, surname, schoolNo);
    }
    console.log('Sample students created.');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();

CREATE TABLE IF NOT EXISTS sessions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id      INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    entry_time      TEXT NOT NULL DEFAULT (datetime('now')),
    exit_time       TEXT,
    duration        INTEGER,
    created_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_student_id ON sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_entry_time ON sessions(entry_time);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_one_active_per_student
    ON sessions(student_id) WHERE exit_time IS NULL;

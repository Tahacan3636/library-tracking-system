const router = require('express').Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const db = require('../config/db');

router.get('/', verifyToken, requireRole('admin'), (req, res, next) => {
  try {
    // 1. Daily visits for last 7 days
    const dailyVisits = db.db.prepare(`
      SELECT date(entry_time) as date, COUNT(*) as count
      FROM sessions
      WHERE entry_time >= date('now', '-6 days')
      GROUP BY date(entry_time)
      ORDER BY date ASC
    `).all();

    // 2. Hourly distribution (all time)
    const hourlyDist = db.db.prepare(`
      SELECT CAST(strftime('%H', entry_time) AS INTEGER) as hour, COUNT(*) as count
      FROM sessions
      GROUP BY hour
      ORDER BY hour ASC
    `).all();

    // 3. Average duration
    const avgDuration = db.db.prepare(`
      SELECT ROUND(AVG(duration), 0) as avg_duration
      FROM sessions
      WHERE duration IS NOT NULL AND duration > 0
    `).get();

    // 4. Top 10 students (by avg duration)
    const topStudents = db.db.prepare(`
      SELECT st.name, st.surname, st.school_no, COUNT(*) as visit_count,
             ROUND(AVG(CASE WHEN s.duration IS NOT NULL AND s.duration > 0 THEN s.duration END), 0) as avg_duration
      FROM sessions s
      JOIN students st ON s.student_id = st.id
      WHERE s.duration IS NOT NULL AND s.duration > 0
      GROUP BY s.student_id
      ORDER BY avg_duration DESC
      LIMIT 10
    `).all();

    // 5. Today's stats
    const todayStats = db.db.prepare(`
      SELECT
        COUNT(*) as total_visits,
        COUNT(CASE WHEN exit_time IS NULL THEN 1 END) as currently_inside,
        ROUND(AVG(CASE WHEN duration IS NOT NULL THEN duration END), 0) as avg_duration
      FROM sessions
      WHERE date(entry_time) = date('now')
    `).get();

    // 6. Total students count
    const totalStudents = db.db.prepare('SELECT COUNT(*) as count FROM students').get();

    // 7. Weekly comparison
    const thisWeek = db.db.prepare(`
      SELECT COUNT(*) as count FROM sessions
      WHERE entry_time >= date('now', 'weekday 0', '-6 days')
    `).get();

    const lastWeek = db.db.prepare(`
      SELECT COUNT(*) as count FROM sessions
      WHERE entry_time >= date('now', 'weekday 0', '-13 days')
        AND entry_time < date('now', 'weekday 0', '-6 days')
    `).get();

    res.json({
      dailyVisits,
      hourlyDist,
      avgDuration: avgDuration.avg_duration || 0,
      topStudents,
      today: todayStats,
      totalStudents: totalStudents.count,
      thisWeekVisits: thisWeek.count,
      lastWeekVisits: lastWeek.count
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

const sessionModel = require('../models/sessionModel');
const csvService = require('../services/csvService');
const db = require('../config/db');

exports.exportLogs = (req, res, next) => {
  try {
    const { start_date, end_date, student_name, school_no, format = 'csv' } = req.query;

    const logs = sessionModel.getAllLogs({
      startDate: start_date || null,
      endDate: end_date || null,
      studentName: student_name || null,
      schoolNo: school_no || null
    });

    if (format === 'xlsx') {
      const buffer = csvService.generateExcel(logs);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=library_records.xlsx');
      return res.send(buffer);
    }

    const csvData = csvService.generateCsv(logs);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=library_records.csv');
    res.send(csvData);
  } catch (err) {
    next(err);
  }
};

exports.generateReport = (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    // Default: current month
    const now = new Date();
    const startDate = start_date || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = end_date || now.toISOString().split('T')[0];

    // Stats
    const totalVisits = db.db.prepare(
      `SELECT COUNT(*) as count FROM sessions WHERE entry_time >= ? AND entry_time < date(?, '+1 day')`
    ).get(startDate, endDate);

    const uniqueStudents = db.db.prepare(
      `SELECT COUNT(DISTINCT student_id) as count FROM sessions WHERE entry_time >= ? AND entry_time < date(?, '+1 day')`
    ).get(startDate, endDate);

    const avgDuration = db.db.prepare(
      `SELECT ROUND(AVG(duration), 0) as avg FROM sessions WHERE duration IS NOT NULL AND entry_time >= ? AND entry_time < date(?, '+1 day')`
    ).get(startDate, endDate);

    const topStudents = db.db.prepare(
      `SELECT st.name, st.surname, st.school_no, COUNT(*) as visit_count, ROUND(AVG(s.duration), 0) as avg_duration
       FROM sessions s JOIN students st ON s.student_id = st.id
       WHERE s.entry_time >= ? AND s.entry_time < date(?, '+1 day')
       GROUP BY s.student_id ORDER BY visit_count DESC LIMIT 20`
    ).all(startDate, endDate);

    const dailyBreakdown = db.db.prepare(
      `SELECT date(entry_time) as date, COUNT(*) as count
       FROM sessions WHERE entry_time >= ? AND entry_time < date(?, '+1 day')
       GROUP BY date(entry_time) ORDER BY date ASC`
    ).all(startDate, endDate);

    // Generate printable HTML report
    const topStudentsRows = topStudents.map(function (s, i) {
      return '<tr><td>' + (i + 1) + '</td><td>' + s.name + ' ' + s.surname + '</td><td>' + s.school_no + '</td><td>' + s.visit_count + '</td><td>' + (s.avg_duration || '-') + '</td></tr>';
    }).join('');

    const dailyRows = dailyBreakdown.map(function (d) {
      return '<tr><td>' + d.date + '</td><td>' + d.count + '</td></tr>';
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Library Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #8B1A2D; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 22px; color: #8B1A2D; }
    .header .date-range { font-size: 14px; color: #666; }
    .subtitle { font-size: 12px; color: #999; margin-top: 4px; }
    .stats-grid { display: flex; gap: 16px; margin-bottom: 32px; }
    .stat-box { flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 16px; text-align: center; }
    .stat-box .value { font-size: 28px; font-weight: 800; color: #8B1A2D; }
    .stat-box .label { font-size: 12px; color: #666; margin-top: 4px; }
    h2 { font-size: 16px; color: #333; margin: 24px 0 12px; border-left: 4px solid #8B1A2D; padding-left: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
    th { background: #f5f5f5; text-align: left; padding: 8px 12px; font-weight: 600; border-bottom: 2px solid #ddd; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; }
    tr:nth-child(even) td { background: #fafafa; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 11px; color: #999; text-align: center; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:20px;">
    <button onclick="window.print()" style="padding:10px 24px; background:#8B1A2D; color:white; border:none; border-radius:6px; font-size:14px; font-weight:600; cursor:pointer;">Print / Save as PDF</button>
    <button onclick="window.close()" style="padding:10px 24px; background:#e5e7eb; color:#333; border:none; border-radius:6px; font-size:14px; font-weight:600; cursor:pointer; margin-left:8px;">Close</button>
  </div>

  <div class="header">
    <div>
      <h1>Library Report</h1>
      <div class="subtitle">Library Check-In/Out Tracking System</div>
    </div>
    <div class="date-range">${startDate} - ${endDate}</div>
  </div>

  <div class="stats-grid">
    <div class="stat-box">
      <div class="value">${totalVisits.count}</div>
      <div class="label">Total Visits</div>
    </div>
    <div class="stat-box">
      <div class="value">${uniqueStudents.count}</div>
      <div class="label">Unique Students</div>
    </div>
    <div class="stat-box">
      <div class="value">${avgDuration.avg || 0}</div>
      <div class="label">Avg. Stay (min)</div>
    </div>
  </div>

  <h2>Daily Breakdown</h2>
  <table>
    <thead><tr><th>Date</th><th>Visit Count</th></tr></thead>
    <tbody>${dailyRows || '<tr><td colspan="2">No data</td></tr>'}</tbody>
  </table>

  <h2>Most Active Students</h2>
  <table>
    <thead><tr><th>#</th><th>Full Name</th><th>Student ID</th><th>Visits</th><th>Avg. Stay (min)</th></tr></thead>
    <tbody>${topStudentsRows || '<tr><td colspan="5">No data</td></tr>'}</tbody>
  </table>

  <div class="footer">
    This report was generated by Library Check-In/Out Tracking System. &bull; ${new Date().toLocaleString('en-US')}
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    next(err);
  }
};

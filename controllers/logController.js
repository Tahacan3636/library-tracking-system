const sessionModel = require('../models/sessionModel');

exports.getLogs = (req, res, next) => {
  try {
    const { start_date, end_date, student_name, school_no, page = 1, limit = 50 } = req.query;
    const result = sessionModel.getLogs({
      startDate: start_date || null,
      endDate: end_date || null,
      studentName: student_name || null,
      schoolNo: school_no || null,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

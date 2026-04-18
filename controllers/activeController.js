const sessionModel = require('../models/sessionModel');

exports.getActive = (req, res, next) => {
  try {
    const students = sessionModel.getActiveStudents();
    res.json({ count: students.length, students });
  } catch (err) {
    next(err);
  }
};

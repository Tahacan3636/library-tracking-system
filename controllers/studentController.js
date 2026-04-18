const studentModel = require('../models/studentModel');
const csvService = require('../services/csvService');

exports.getAll = (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const result = studentModel.getAll({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getById = (req, res, next) => {
  try {
    const student = studentModel.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    res.json(student);
  } catch (err) {
    next(err);
  }
};

exports.create = (req, res, next) => {
  try {
    const { name, surname, school_no } = req.body;
    if (!name || !surname || !school_no) {
      return res.status(400).json({ error: 'First name, last name, and student ID are required.' });
    }
    const student = studentModel.create(name.trim(), surname.trim(), school_no.trim());
    res.status(201).json(student);
  } catch (err) {
    next(err);
  }
};

exports.update = (req, res, next) => {
  try {
    const { name, surname, school_no } = req.body;
    if (!name || !surname || !school_no) {
      return res.status(400).json({ error: 'First name, last name, and student ID are required.' });
    }
    const student = studentModel.update(req.params.id, { name: name.trim(), surname: surname.trim(), school_no: school_no.trim() });
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    res.json(student);
  } catch (err) {
    next(err);
  }
};

exports.remove = (req, res, next) => {
  try {
    const student = studentModel.delete(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    res.json({ message: 'Student deleted.' });
  } catch (err) {
    next(err);
  }
};

exports.importFromFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const students = await csvService.parseFile(req.file.buffer, req.file.mimetype, req.file.originalname);
    const result = studentModel.bulkCreate(students);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

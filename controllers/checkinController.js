const studentModel = require('../models/studentModel');
const sessionModel = require('../models/sessionModel');

exports.toggleCheckin = (req, res, next) => {
  try {
    const { school_no } = req.body;

    if (!school_no || !school_no.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Student ID is required.'
      });
    }

    const student = studentModel.findBySchoolNo(school_no.trim());
    if (!student) {
      return res.status(404).json({
        status: 'not_found',
        message: 'Registered student not found.'
      });
    }

    const activeSession = sessionModel.findActiveByStudentId(student.id);
    const io = req.app.get('io');

    if (activeSession) {
      // Student is INSIDE -> EXIT
      const now = new Date();
      const entryTime = new Date(activeSession.entry_time);
      const durationMinutes = Math.round((now - entryTime) / 60000);

      const updatedSession = sessionModel.closeSession(
        activeSession.id,
        now,
        durationMinutes
      );

      if (io) {
        io.to('staff-room').emit('student:exit', {
          student: { name: student.name, surname: student.surname, school_no: student.school_no },
          session: updatedSession
        });
      }

      return res.json({
        status: 'exit',
        message: `Goodbye ${student.name} ${student.surname}`,
        duration: durationMinutes,
        durationText: `Stay: ${durationMinutes} min`
      });
    } else {
      // Student is OUTSIDE -> ENTRY
      let newSession;
      try {
        newSession = sessionModel.createEntry(student.id);
      } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || (err.message && err.message.includes('UNIQUE'))) {
          return res.json({
            status: 'already_inside',
            message: 'You are already inside.'
          });
        }
        throw err;
      }

      if (io) {
        io.to('staff-room').emit('student:entry', {
          student: { name: student.name, surname: student.surname, school_no: student.school_no },
          session: newSession
        });
      }

      return res.json({
        status: 'entry',
        message: `Welcome ${student.name} ${student.surname}`
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.manualExit = (req, res, next) => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required.' });
    }

    const db = require('../config/db');
    const session = db.db.prepare(
      `SELECT s.*, st.name, st.surname, st.school_no
       FROM sessions s
       JOIN students st ON s.student_id = st.id
       WHERE s.id = ? AND s.exit_time IS NULL`
    ).get(session_id);

    if (!session) {
      return res.status(404).json({ error: 'Active session not found.' });
    }

    const now = new Date();
    const entryTime = new Date(session.entry_time);
    const durationMinutes = Math.round((now - entryTime) / 60000);

    const updatedSession = sessionModel.closeSession(
      session.id,
      now,
      durationMinutes
    );

    const io = req.app.get('io');
    if (io) {
      io.to('staff-room').emit('student:exit', {
        student: { name: session.name, surname: session.surname, school_no: session.school_no },
        session: updatedSession
      });
    }

    res.json({
      status: 'exit',
      message: `${session.name} ${session.surname} has been checked out.`,
      duration: durationMinutes
    });
  } catch (err) {
    next(err);
  }
};

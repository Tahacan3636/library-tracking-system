module.exports = function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);

  // SQLite unique constraint violation
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || (err.message && err.message.includes('UNIQUE constraint failed'))) {
    return res.status(409).json({
      error: 'This record already exists.'
    });
  }

  // SQLite foreign key violation
  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || (err.message && err.message.includes('FOREIGN KEY constraint failed'))) {
    return res.status(400).json({
      error: 'Related record not found.'
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'A server error occurred.'
  });
};

const router = require('express').Router();
const exportController = require('../controllers/exportController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/logs', verifyToken, requireRole('admin'), exportController.exportLogs);
router.get('/report', verifyToken, requireRole('admin'), exportController.generateReport);

module.exports = router;

const router = require('express').Router();
const logController = require('../controllers/logController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, requireRole('staff', 'admin'), logController.getLogs);

module.exports = router;

const router = require('express').Router();
const activeController = require('../controllers/activeController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, requireRole('staff', 'admin'), activeController.getActive);

module.exports = router;

const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const checkinController = require('../controllers/checkinController');
const { verifyToken, requireRole } = require('../middleware/auth');

const checkinLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { status: 'error', message: 'Cok fazla istek. Lutfen biraz bekleyin.' }
});

router.post('/', checkinLimiter, checkinController.toggleCheckin);
router.post('/manual-exit', verifyToken, requireRole('staff', 'admin'), checkinController.manualExit);

module.exports = router;

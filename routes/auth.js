const router = require('express').Router();
const authController = require('../controllers/authController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/change-password', verifyToken, authController.changePassword);
router.get('/users', verifyToken, requireRole('admin'), authController.getUsers);
router.post('/users', verifyToken, requireRole('admin'), authController.createUser);
router.delete('/users/:id', verifyToken, requireRole('admin'), authController.deleteUser);

module.exports = router;

const router = require('express').Router();
const studentController = require('../controllers/studentController');
const { verifyToken, requireRole } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(verifyToken);
router.use(requireRole('admin'));

router.get('/', studentController.getAll);
router.post('/', studentController.create);
router.post('/import', upload.single('file'), studentController.importFromFile);
router.get('/:id', studentController.getById);
router.put('/:id', studentController.update);
router.delete('/:id', studentController.remove);

module.exports = router;

const router = require('express').Router();
const controller = require('../controllers/taskController');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

router.get('/', controller.getTasks);
router.get('/:id', controller.getTask);
router.post('/', controller.createTask);
router.put('/:id', controller.updateTask);
router.delete('/:id', controller.deleteTask);

module.exports = router;

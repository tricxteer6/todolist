const router = require('express').Router();
const controller = require('../controllers/reminderController');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

router.get('/', controller.getReminders);
router.post('/', controller.createReminder);
router.put('/:id', controller.updateReminder);
router.delete('/:id', controller.deleteReminder);

module.exports = router;

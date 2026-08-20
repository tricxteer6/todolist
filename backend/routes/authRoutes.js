const router = require('express').Router();
const { register, login } = require('../services/authService');
const requireAuth = require('../middleware/auth');

router.post('/register', async (req, res, next) => {
  try { const result = await register(req.body.username?.trim(), req.body.password); res.status(201).json({ success: true, message: 'Account created successfully.', data: result }); }
  catch (error) { next(error); }
});

router.post('/login', async (req, res, next) => {
  try { const result = await login(req.body.username?.trim(), req.body.password); res.json({ success: true, message: 'Login successful.', data: result }); }
  catch (error) { next(error); }
});

router.get('/me', requireAuth, (req, res) => res.json({ success: true, data: { user: req.user } }));

module.exports = router;

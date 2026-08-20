const router = require('express').Router();
const { configured, saveSubscription, sendToAll } = require('../services/pushService');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

router.get('/public-key', (_req, res) => {
  if (!configured()) return res.status(503).json({ success: false, message: 'Web Push is not configured.' });
  res.json({ success: true, data: { publicKey: process.env.VAPID_PUBLIC_KEY } });
});

router.post('/subscribe', (req, res) => {
  if (!req.body || !req.body.endpoint || !req.body.keys) return res.status(400).json({ success: false, message: 'Invalid push subscription.' });
  saveSubscription(req.body, req.user.id);
  res.status(201).json({ success: true, message: 'Push subscription saved.' });
});

router.post('/test', async (_req, res, next) => {
  try {
    const delaySeconds = Math.min(Math.max(Number(_req.body?.delaySeconds || 0), 0), 300);
    const payload = { title: 'TaskFlow test notification', body: 'Your push notifications are working.', url: '/#tasks' };
    if (delaySeconds > 0) {
      setTimeout(() => sendToAll(payload, req.user.id).catch((error) => console.error('Delayed test push:', error.message)), delaySeconds * 1000);
      return res.json({ success: true, message: `Test notification scheduled in ${delaySeconds} seconds.` });
    }
    await sendToAll(payload, req.user.id);
    res.json({ success: true, message: 'Test notification sent.' });
  } catch (error) { next(error); }
});

module.exports = router;

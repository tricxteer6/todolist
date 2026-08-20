require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const taskRoutes = require('./backend/routes/taskRoutes');
const authRoutes = require('./backend/routes/authRoutes');
const { ensureDefaultUser } = require('./backend/services/authService');
const pushRoutes = require('./backend/routes/pushRoutes');
const { startReminderScheduler } = require('./backend/services/reminderService');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

app.get('/api/health', (_req, res) => res.json({ success: true, message: 'TaskFlow API is running' }));
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/push', pushRoutes);

app.use('/api/*', (_req, res) => res.status(404).json({ success: false, message: 'API route not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ success: false, message: 'Unable to process your request.' });
});

app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'frontend', 'index.html')));

app.listen(port, () => {
  console.log(`TaskFlow running at http://localhost:${port}`);
  ensureDefaultUser();
  startReminderScheduler();
});

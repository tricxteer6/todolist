const pool = require('../config/database');
const { sendToAll, configured } = require('./pushService');

async function sendTomorrowReminders() {
  if (!configured()) return;
  try {
    const [tasks] = await pool.query("SELECT id, user_id, task, deadline, reminder_value, reminder_unit FROM tasks WHERE user_id IS NOT NULL AND status <> 'completed' AND reminder_sent_at IS NULL");
    const now = Date.now();
    for (const task of tasks) {
      const deadlineAt = new Date(`${String(task.deadline).replace(' ', 'T')}+07:00`).getTime();
      const multiplier = { minutes: 60 * 1000, hours: 60 * 60 * 1000, days: 24 * 60 * 60 * 1000 }[task.reminder_unit] || 24 * 60 * 60 * 1000;
      const reminderAt = deadlineAt - (Number(task.reminder_value) || 1) * multiplier;
      if (now >= reminderAt && now < deadlineAt) {
        const amount = `${task.reminder_value} ${task.reminder_unit}`;
        const deliveredCount = await sendToAll({ title: 'TaskFlow deadline reminder', body: `“${task.task}” is due in ${amount}`, taskId: task.id, url: '/#tasks' }, task.user_id);
        if (deliveredCount > 0) await pool.execute('UPDATE tasks SET reminder_sent_at = NOW() WHERE id = ?', [task.id]);
      }
    }
  } catch (error) { console.error('Reminder scheduler:', error.message); }
}

function startReminderScheduler() {
  if (!configured()) { console.log('Web Push disabled: add VAPID keys to .env to enable reminders.'); return; }
  sendTomorrowReminders();
  setInterval(sendTomorrowReminders, 60 * 1000);
}

module.exports = { startReminderScheduler };

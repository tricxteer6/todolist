const pool = require('../config/database');
const { sendToAll, configured } = require('./pushService');

async function sendTomorrowReminders() {
  if (!configured()) return;
  try {
    const [reminders] = await pool.query("SELECT id, user_id, title, note, remind_at, status FROM reminders WHERE user_id IS NOT NULL AND status = 'pending'");
    const now = Date.now();
    for (const reminder of reminders) {
      const remindAt = new Date(`${String(reminder.remind_at).replace(' ', 'T')}+07:00`).getTime();
      if (now >= remindAt) {
        const deliveredCount = await sendToAll({
          title: 'TaskFlow reminder',
          body: reminder.note ? `${reminder.title} - ${reminder.note}` : reminder.title,
          reminderId: reminder.id,
          url: '/#calendar'
        }, reminder.user_id);
        if (deliveredCount > 0) await pool.execute("UPDATE reminders SET status = 'sent', sent_at = NOW() WHERE id = ?", [reminder.id]);
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

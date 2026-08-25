const pool = require('../config/database');

function normalizeDateTime(value) {
  const raw = String(value || '').trim().replace('T', ' ');
  return raw.length === 16 ? `${raw}:00` : raw.slice(0, 19);
}

function validateReminder(body) {
  const { title, remindAt } = body;
  if (!title || title.trim().length < 3) return 'Reminder title must be at least 3 characters.';
  if (!remindAt) return 'Reminder time is required.';
  return null;
}

async function getReminders(req, res, next) {
  try {
    const [rows] = await pool.execute('SELECT * FROM reminders WHERE user_id = ? ORDER BY remind_at ASC, created_at DESC', [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (error) { next(error); }
}

async function createReminder(req, res, next) {
  const error = validateReminder(req.body);
  if (error) return res.status(400).json({ success: false, message: error });
  try {
    const { title, note = '', remindAt } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO reminders (user_id, title, note, remind_at) VALUES (?, ?, ?, ?)',
      [req.user.id, title.trim(), note.trim(), normalizeDateTime(remindAt)]
    );
    const [rows] = await pool.execute('SELECT * FROM reminders WHERE id = ? AND user_id = ?', [result.insertId, req.user.id]);
    res.status(201).json({ success: true, message: 'Reminder created successfully.', data: rows[0] });
  } catch (error) { next(error); }
}

async function updateReminder(req, res, next) {
  const error = validateReminder(req.body);
  if (error) return res.status(400).json({ success: false, message: error });
  try {
    const { title, note = '', remindAt } = req.body;
    const [result] = await pool.execute(
      'UPDATE reminders SET title = ?, note = ?, remind_at = ?, status = \'pending\', sent_at = NULL WHERE id = ? AND user_id = ?',
      [title.trim(), note.trim(), normalizeDateTime(remindAt), req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Reminder not found.' });
    const [rows] = await pool.execute('SELECT * FROM reminders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Reminder updated successfully.', data: rows[0] });
  } catch (error) { next(error); }
}

async function deleteReminder(req, res, next) {
  try {
    const [result] = await pool.execute('DELETE FROM reminders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Reminder not found.' });
    res.json({ success: true, message: 'Reminder deleted successfully.' });
  } catch (error) { next(error); }
}

module.exports = { getReminders, createReminder, updateReminder, deleteReminder };

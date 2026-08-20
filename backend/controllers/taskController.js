const pool = require('../config/database');

const allowedPriorities = ['low', 'medium', 'high'];
const allowedStatuses = ['pending', 'in_progress', 'completed'];
const allowedReminderUnits = ['minutes', 'hours', 'days'];

function mysqlDateTime(value) {
  return String(value || '').replace('T', ' ') + (String(value || '').length === 16 ? ':00' : '');
}

function validateTask(body) {
  const { date, task, priority, deadline, status, reminderValue, reminderUnit } = body;
  if (!task || task.trim().length < 3) return 'Task must be at least 3 characters.';
  if (!date || !deadline) return 'Date and deadline are required.';
  if (!allowedPriorities.includes(priority)) return 'Invalid priority.';
  if (!allowedStatuses.includes(status)) return 'Invalid status.';
  if (!allowedReminderUnits.includes(reminderUnit)) return 'Invalid reminder unit.';
  if (!Number.isInteger(Number(reminderValue)) || Number(reminderValue) < 1 || Number(reminderValue) > 365) return 'Reminder value must be between 1 and 365.';
  if (String(deadline).slice(0, 10) < date) return 'Deadline cannot be earlier than the task date.';
  return null;
}

async function getTasks(req, res, next) {
  try {
    const [rows] = await pool.execute('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (error) { next(error); }
}

async function getTask(req, res, next) {
  try {
    const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Task not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (error) { next(error); }
}

async function createTask(req, res, next) {
  const error = validateTask(req.body);
  if (error) return res.status(400).json({ success: false, message: error });
  try {
    const { date, task, priority, deadline, status, reminderValue, reminderUnit } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO tasks (user_id, date, task, priority, deadline, status, reminder_value, reminder_unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, date, task.trim(), priority, mysqlDateTime(deadline), status, Number(reminderValue), reminderUnit]
    );
    const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [result.insertId, req.user.id]);
    res.status(201).json({ success: true, message: 'Task created successfully.', data: rows[0] });
  } catch (error) { next(error); }
}

async function updateTask(req, res, next) {
  const error = validateTask(req.body);
  if (error) return res.status(400).json({ success: false, message: error });
  try {
    const { date, task, priority, deadline, status, reminderValue, reminderUnit } = req.body;
    const [result] = await pool.execute(
      'UPDATE tasks SET date = ?, task = ?, priority = ?, deadline = ?, status = ?, reminder_value = ?, reminder_unit = ?, reminder_sent_at = NULL WHERE id = ? AND user_id = ?',
      [date, task.trim(), priority, mysqlDateTime(deadline), status, Number(reminderValue), reminderUnit, req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Task not found.' });
    const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Task updated successfully.', data: rows[0] });
  } catch (error) { next(error); }
}

async function deleteTask(req, res, next) {
  try {
    const [result] = await pool.execute('DELETE FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Task not found.' });
    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (error) { next(error); }
}

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask };

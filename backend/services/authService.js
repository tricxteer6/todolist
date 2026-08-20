const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const jwtSecret = () => process.env.JWT_SECRET || 'taskflow-development-secret';

function validateCredentials(username, password) {
  if (!username || !/^[a-zA-Z0-9_.-]{3,50}$/.test(username)) return 'Username must be 3–50 characters and use only letters, numbers, _, ., or -.';
  if (!password || password.length < 6) return 'Password must be at least 6 characters.';
  return null;
}

function tokenFor(user) { return jwt.sign({ id: user.id, username: user.username }, jwtSecret(), { expiresIn: '30d' }); }

async function register(username, password) {
  const error = validateCredentials(username, password);
  if (error) throw Object.assign(new Error(error), { status: 400 });
  const [existing] = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
  if (existing[0]) throw Object.assign(new Error('Username is already taken.'), { status: 409 });
  const passwordHash = await bcrypt.hash(password, 12);
  const [result] = await pool.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, passwordHash]);
  const user = { id: result.insertId, username };
  return { user, token: tokenFor(user) };
}

async function login(username, password) {
  if (!username || !password) throw Object.assign(new Error('Username and password are required.'), { status: 400 });
  const [rows] = await pool.execute('SELECT id, username, password_hash FROM users WHERE username = ?', [username]);
  if (!rows[0] || !(await bcrypt.compare(password, rows[0].password_hash))) throw Object.assign(new Error('Invalid username or password.'), { status: 401 });
  const user = { id: rows[0].id, username: rows[0].username };
  return { user, token: tokenFor(user) };
}

async function ensureDefaultUser() {
  if (!process.env.DEFAULT_USERNAME || !process.env.DEFAULT_PASSWORD) return;
  try {
    const [rows] = await pool.execute('SELECT id FROM users WHERE username = ?', [process.env.DEFAULT_USERNAME]);
    if (!rows[0]) await register(process.env.DEFAULT_USERNAME, process.env.DEFAULT_PASSWORD);
  } catch (error) { console.error('Default user setup:', error.message); }
}

module.exports = { register, login, ensureDefaultUser };

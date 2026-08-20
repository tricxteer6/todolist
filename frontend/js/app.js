const API = '/api/tasks';
const AUTH_KEY = 'taskflow-auth';
const STORAGE_KEY = 'taskflow-demo-tasks';
const NOTIFIED_DEADLINES_KEY = 'taskflow-notified-deadlines';
let tasks = [];
let useLocal = false;
let toastTimer;

const $ = (selector) => document.querySelector(selector);
const els = {
  content: $('#taskContent'), loading: $('#loadingState'), search: $('#searchInput'), status: $('#statusFilter'), priority: $('#priorityFilter'), sort: $('#sortSelect'),
  modal: $('#modalBackdrop'), form: $('#taskForm'), error: $('#formError'), id: $('#taskId'), name: $('#taskName'), date: $('#taskDateInput'), deadline: $('#deadlineInput'), priorityInput: $('#priorityInput'), statusInput: $('#statusInput'), reminderValue: $('#reminderValueInput'), reminderUnit: $('#reminderUnitInput'),
  toast: $('#toast'), toastMessage: $('#toastMessage')
};

const JAKARTA_TIMEZONE = 'Asia/Jakarta';
function jakartaDateString(date = new Date()) { const parts = new Intl.DateTimeFormat('en-CA', { timeZone: JAKARTA_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date).reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {}); return `${parts.year}-${parts.month}-${parts.day}`; }
const todayISO = () => jakartaDateString();
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
const formatDate = (date) => date ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T00:00:00`)) : '—';
const normalizeTask = (task) => ({ ...task, id: Number(task.id), date: String(task.date).slice(0, 10), deadline: String(task.deadline).replace(' ', 'T').slice(0, 16), reminderValue: Number(task.reminder_value ?? task.reminderValue ?? 1), reminderUnit: task.reminder_unit ?? task.reminderUnit ?? 'days' });
const demoTasks = () => [
  { id: 1, date: todayISO(), task: 'Plan the week ahead', priority: 'high', deadline: `${todayISO()}T18:00`, reminderValue: 2, reminderUnit: 'hours', status: 'in_progress', created_at: new Date().toISOString() },
  { id: 2, date: todayISO(), task: 'Review project notes', priority: 'medium', deadline: `${addDays(todayISO(), 2)}T17:00`, reminderValue: 1, reminderUnit: 'days', status: 'pending', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 3, date: addDays(todayISO(), -1), task: 'Send final project update', priority: 'low', deadline: `${addDays(todayISO(), -1)}T16:00`, reminderValue: 30, reminderUnit: 'minutes', status: 'completed', created_at: new Date(Date.now() - 172800000).toISOString() }
];
function addDays(date, days) { const d = new Date(`${date}T12:00:00+07:00`); d.setUTCDate(d.getUTCDate() + days); return jakartaDateString(d); }
function tomorrowISO() { return addDays(todayISO(), 1); }
function deadlineDate(value) { const raw = String(value).replace(' ', 'T'); if (/[zZ]|[+-]\d\d:\d\d$/.test(raw)) return new Date(raw); return new Date(`${raw.length === 10 ? `${raw}T00:00:00` : raw}:00+07:00`); }
function formatDeadline(value) { const date = deadlineDate(value); return new Intl.DateTimeFormat('en-US', { timeZone: JAKARTA_TIMEZONE, month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date); }
function reminderMilliseconds(task) { return Number(task.reminderValue || 1) * ({ minutes: 60000, hours: 3600000, days: 86400000 }[task.reminderUnit] || 86400000); }

async function request(url, options = {}) {
  const auth = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (auth?.token) headers.Authorization = `Bearer ${auth.token}`;
  const response = await fetch(url, { ...options, headers });
  const json = await response.json().catch(() => ({}));
  if (response.status === 401) { localStorage.removeItem(AUTH_KEY); window.location.href = '/login.html'; throw new Error('Session expired.'); }
  if (!response.ok) throw new Error(json.message || 'Request failed');
  return json;
}
async function loadTasks() {
  if (!localStorage.getItem(AUTH_KEY)) { window.location.href = '/login.html'; return; }
  els.loading.hidden = false; els.content.innerHTML = '';
  try { const result = await request(API); tasks = (result.data || []).map(normalizeTask); useLocal = false; }
  catch (_error) { useLocal = false; tasks = []; showToast('Unable to load your tasks.'); }
  els.loading.hidden = true; render();
}
function persistLocal() { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
function filteredTasks() {
  const query = els.search.value.trim().toLowerCase();
  let result = tasks.filter((item) => item.task.toLowerCase().includes(query));
  if (els.status.value !== 'all') result = result.filter((item) => item.status === els.status.value);
  if (els.priority.value !== 'all') result = result.filter((item) => item.priority === els.priority.value);
  const priorityRank = { high: 0, medium: 1, low: 2 };
  return result.sort((a, b) => {
    if (els.sort.value === 'oldest') return new Date(a.created_at || a.date) - new Date(b.created_at || b.date);
    if (els.sort.value === 'deadline') return a.deadline.localeCompare(b.deadline);
    if (els.sort.value === 'priority') return priorityRank[a.priority] - priorityRank[b.priority];
    return new Date(b.created_at || b.date) - new Date(a.created_at || a.date);
  });
}
function render() {
  const counts = tasks.reduce((acc, item) => { acc.total += 1; acc[item.status] += 1; return acc; }, { total: 0, pending: 0, in_progress: 0, completed: 0 });
  $('#totalCount').textContent = counts.total; $('#pendingCount').textContent = counts.pending; $('#progressCount').textContent = counts.in_progress; $('#completedCount').textContent = counts.completed;
  $('#taskDate').textContent = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date());
  const visible = filteredTasks();
  if (!visible.length) { els.content.innerHTML = `<div class="empty-state"><div class="empty-icon">✓</div><h3>${tasks.length ? 'No tasks found' : 'No tasks yet'}</h3><p>${tasks.length ? 'Try another keyword or adjust your filters.' : 'Start organizing your work by creating your first task.'}</p>${tasks.length ? '' : '<button class="button button-dark" data-open-modal>＋ Create task</button>'}</div>`; return; }
  els.content.innerHTML = `<div class="task-table"><div class="task-row header"><span>Date</span><span>Task</span><span>Priority</span><span>Deadline</span><span>Status</span><span></span></div>${visible.map(taskRow).join('')}</div><div class="mobile-tasks">${visible.map(taskMobile).join('')}</div>`;
  els.content.querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => openModal(tasks.find((item) => item.id === Number(button.dataset.edit)))));
  els.content.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', () => deleteTask(Number(button.dataset.delete))));
  els.content.querySelectorAll('[data-status]').forEach((select) => select.addEventListener('change', () => updateStatus(Number(select.dataset.status), select.value)));
}
function notifyUpcomingDeadlines() {
  const alreadyNotified = JSON.parse(localStorage.getItem(NOTIFIED_DEADLINES_KEY) || '{}');
  const now = Date.now();
  const dueForReminder = tasks.filter((task) => {
    const deadlineAt = deadlineDate(task.deadline).getTime();
    const reminderAt = deadlineAt - reminderMilliseconds(task);
    return task.status !== 'completed' && now >= reminderAt && now < deadlineAt && !alreadyNotified[`${task.id}:${task.deadline}`];
  });
  if (!dueForReminder.length) return;
  dueForReminder.forEach((task) => { alreadyNotified[`${task.id}:${task.deadline}`] = true; });
  localStorage.setItem(NOTIFIED_DEADLINES_KEY, JSON.stringify(alreadyNotified));
  const message = dueForReminder.length === 1 ? `Reminder: “${dueForReminder[0].task}” is due in ${dueForReminder[0].reminderValue} ${dueForReminder[0].reminderUnit}` : `Reminder: ${dueForReminder.length} tasks are due soon`;
  showToast(message);
  if ('Notification' in window && Notification.permission === 'granted') new Notification('TaskFlow deadline reminder', { body: message });
}
function deadlineInfo(task) {
  const remaining = deadlineDate(task.deadline).getTime() - Date.now();
  if (task.status === 'completed') return { label: formatDeadline(task.deadline), className: '' };
  if (remaining < 0) return { label: 'Overdue', className: 'deadline-overdue' };
  if (remaining <= 2 * 86400000) return { label: `Due in ${formatRemaining(remaining)}`, className: 'deadline-soon' };
  return { label: formatDeadline(task.deadline), className: '' };
}
function formatRemaining(milliseconds) { const totalMinutes = Math.max(1, Math.floor(milliseconds / 60000)); const days = Math.floor(totalMinutes / 1440); const hours = Math.floor((totalMinutes % 1440) / 60); const minutes = totalMinutes % 60; return days ? `${days}d ${hours}h` : hours ? `${hours}h ${minutes}m` : `${minutes}m`; }
function badges(task) { return `<span class="badge priority-${task.priority}">${task.priority}</span>`; }
function statusBadge(task) { return `<span class="badge status-badge status-${task.status}">${task.status === 'in_progress' ? 'In progress' : task.status}</span>`; }
function actions(task) { return `<div class="row-actions"><button class="icon-button" data-edit="${task.id}">Edit</button><button class="icon-button delete" data-delete="${task.id}">Delete</button></div>`; }
function taskRow(task) { const due = deadlineInfo(task); return `<div class="task-row"><span class="date-text">${formatDate(task.date)}</span><span class="task-name ${task.status === 'completed' ? 'completed' : ''}">${escapeHtml(task.task)}</span><span>${badges(task)}</span><span class="deadline-text ${due.className}">${due.label}</span><span>${statusBadge(task)}</span>${actions(task)}</div>`; }
function taskMobile(task) { const due = deadlineInfo(task); return `<article class="task-mobile-card"><div class="mobile-card-top"><span class="task-name ${task.status === 'completed' ? 'completed' : ''}">${escapeHtml(task.task)}</span>${badges(task)}</div><div class="mobile-card-meta"><span class="date-text">◷ ${formatDate(task.date)}</span><span class="deadline-text ${due.className}">⌁ ${due.label.startsWith('Due in') || due.label === 'Overdue' ? due.label : `Due ${due.label}`}</span></div><div class="mobile-card-bottom"><select class="badge status-badge status-${task.status}" data-status="${task.id}" aria-label="Change status"><option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Pending</option><option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>In progress</option><option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option></select>${actions(task)}</div></article>`; }

function openModal(task = null) {
  els.form.reset(); els.error.textContent = ''; els.id.value = task?.id || ''; els.date.value = task?.date || todayISO(); els.deadline.value = task?.deadline || `${todayISO()}T17:00`; els.priorityInput.value = task?.priority || 'medium'; els.statusInput.value = task?.status || 'pending'; els.reminderValue.value = task?.reminderValue || 1; els.reminderUnit.value = task?.reminderUnit || 'days'; els.name.value = task?.task || '';
  $('#modalKicker').textContent = task ? 'Make it better' : 'Create something new'; $('#modalTitle').textContent = task ? 'Edit task' : 'Add a task'; $('#submitTask').innerHTML = task ? 'Save changes <span>↗</span>' : 'Add task <span>↗</span>';
  els.modal.classList.add('open'); els.modal.setAttribute('aria-hidden', 'false'); setTimeout(() => els.name.focus(), 50);
}
function closeModal() { els.modal.classList.remove('open'); els.modal.setAttribute('aria-hidden', 'true'); }
async function saveTask(event) {
  event.preventDefault(); els.error.textContent = '';
  if (els.deadline.value.slice(0, 10) < els.date.value) { els.error.textContent = 'Deadline cannot be earlier than the task date.'; return; }
  const body = { task: els.name.value.trim(), date: els.date.value, deadline: els.deadline.value, priority: els.priorityInput.value, status: els.statusInput.value, reminderValue: Number(els.reminderValue.value), reminderUnit: els.reminderUnit.value };
  if (body.task.length < 3) { els.error.textContent = 'Task must be at least 3 characters.'; return; }
  const id = els.id.value;
  try {
    if (useLocal) { const item = { ...body, id: id ? Number(id) : Date.now(), created_at: id ? tasks.find((t) => t.id === Number(id)).created_at : new Date().toISOString() }; tasks = id ? tasks.map((t) => t.id === Number(id) ? item : t) : [item, ...tasks]; persistLocal(); }
    else { const result = await request(id ? `${API}/${id}` : API, { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) }); if (id) tasks = tasks.map((t) => t.id === Number(id) ? normalizeTask(result.data) : t); else tasks.unshift(normalizeTask(result.data)); }
    closeModal(); render(); showToast(id ? 'Task updated successfully' : 'Task added successfully');
  } catch (error) { els.error.textContent = error.message || 'Unable to save task.'; }
}
async function deleteTask(id) {
  if (!window.confirm('Delete this task?')) return;
  try { if (useLocal) { tasks = tasks.filter((task) => task.id !== id); persistLocal(); } else { await request(`${API}/${id}`, { method: 'DELETE' }); tasks = tasks.filter((task) => task.id !== id); } render(); showToast('Task deleted successfully'); }
  catch (_error) { showToast('Unable to delete task'); }
}
async function updateStatus(id, status) {
  const task = tasks.find((item) => item.id === id); if (!task) return;
  const body = { task: task.task, date: task.date, deadline: task.deadline, priority: task.priority, status, reminderValue: task.reminderValue, reminderUnit: task.reminderUnit };
  try { if (useLocal) { task.status = status; persistLocal(); } else { const result = await request(`${API}/${id}`, { method: 'PUT', body: JSON.stringify(body) }); tasks = tasks.map((item) => item.id === id ? normalizeTask(result.data) : item); } render(); showToast('Status updated'); }
  catch (_error) { showToast('Unable to update status'); render(); }
}
function showToast(message) { els.toastMessage.textContent = message; els.toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => els.toast.classList.remove('show'), 3000); }
async function syncPushSubscription() {
  if (!('serviceWorker' in navigator) || !('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    const keyResponse = await request('/api/push/public-key');
    const publicKey = keyResponse.data.publicKey;
    let subscription = await registration.pushManager.getSubscription();
    const previousKey = localStorage.getItem('taskflow-vapid-key');
    if (subscription && previousKey !== publicKey) { await subscription.unsubscribe(); subscription = null; }
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
    }
    await request('/api/push/subscribe', { method: 'POST', body: JSON.stringify(subscription.toJSON()) });
    localStorage.setItem('taskflow-vapid-key', publicKey);
  } catch (error) { console.warn('Push subscription sync skipped:', error.message); }
}
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}
async function enablePushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) { showToast('Push notifications are not supported here'); return; }
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') { showToast('Notification permission was not granted'); return; }
  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    const keyResponse = await request('/api/push/public-key');
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(keyResponse.data.publicKey) });
    await request('/api/push/subscribe', { method: 'POST', body: JSON.stringify(subscription.toJSON()) });
    $('#enablePushBtn').textContent = '✓ Alerts enabled';
    showToast('Push alerts enabled');
  } catch (_error) { showToast('Unable to enable push alerts. Check VAPID setup.'); }
}
async function testPushNotification() {
  try { await request('/api/push/test', { method: 'POST', body: JSON.stringify({ delaySeconds: 10 }) }); showToast('Test push scheduled in 10 seconds'); }
  catch (_error) {
    const message = 'Test reminder: your TaskFlow notifications are working';
    showToast(message);
    if ('Notification' in window && Notification.permission === 'granted') new Notification('TaskFlow test notification', { body: message });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  $('#menuToggle').addEventListener('click', () => $('#navLinks').classList.toggle('open'));
  document.querySelectorAll('[data-open-modal]').forEach((button) => button.addEventListener('click', () => openModal()));
  $('#closeModal').addEventListener('click', closeModal); $('#cancelModal').addEventListener('click', closeModal); els.modal.addEventListener('click', (event) => { if (event.target === els.modal) closeModal(); }); document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeModal(); });
  els.form.addEventListener('submit', saveTask); [els.search, els.status, els.priority, els.sort].forEach((control) => control.addEventListener('input', render));
  $('#logoutBtn')?.addEventListener('click', () => { localStorage.removeItem(AUTH_KEY); window.location.href = '/login.html'; });
  const auth = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); if (auth?.user?.username) $('#userName').textContent = auth.user.username;
  loadTasks().then(() => { syncPushSubscription(); notifyUpcomingDeadlines(); });
  window.setInterval(notifyUpcomingDeadlines, 60000);
});

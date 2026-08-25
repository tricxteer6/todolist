const API = '/api/tasks';
const REMINDER_API = '/api/reminders';
const AUTH_KEY = 'taskflow-auth';
const STORAGE_KEY = 'taskflow-demo-tasks';
const NOTIFIED_DEADLINES_KEY = 'taskflow-notified-deadlines';
let tasks = [];
let reminders = [];
let useLocal = false;
let toastTimer;
let calendarMonth = new Date();
let selectedCalendarDay = null;

const $ = (selector) => document.querySelector(selector);
const els = {
  content: $('#taskContent'), loading: $('#loadingState'), search: $('#searchInput'), status: $('#statusFilter'), priority: $('#priorityFilter'), sort: $('#sortSelect'),
  modal: $('#modalBackdrop'), form: $('#taskForm'), error: $('#formError'), id: $('#taskId'), name: $('#taskName'), date: $('#taskDateInput'), deadline: $('#deadlineInput'), priorityInput: $('#priorityInput'), statusInput: $('#statusInput'),
  reminderModal: $('#reminderModalBackdrop'), reminderForm: $('#reminderForm'), reminderError: $('#reminderFormError'), reminderId: $('#reminderId'), reminderTitle: $('#reminderTitle'), reminderAt: $('#reminderAt'), reminderNote: $('#reminderNote'), reminderDay: $('#reminderDay'),
  calendarMonthLabel: $('#calendarMonthLabel'), calendarGrid: $('#calendarGrid'), calendarTaskList: $('#calendarTaskList'), calendarPanelLabel: $('#calendarPanelLabel'), calendarPanelTitle: $('#calendarPanelTitle'),
  toast: $('#toast'), toastMessage: $('#toastMessage')
};

const JAKARTA_TIMEZONE = 'Asia/Jakarta';
function jakartaDateString(date = new Date()) { const parts = new Intl.DateTimeFormat('en-CA', { timeZone: JAKARTA_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date).reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {}); return `${parts.year}-${parts.month}-${parts.day}`; }
const todayISO = () => jakartaDateString();
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
const formatDate = (date) => date ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T00:00:00`)) : '—';
const normalizeTask = (task) => ({ ...task, id: Number(task.id), date: String(task.date).slice(0, 10), deadline: String(task.deadline).replace(' ', 'T').slice(0, 16) });
const normalizeReminder = (reminder) => ({ ...reminder, id: Number(reminder.id), remind_at: String(reminder.remind_at).replace(' ', 'T').slice(0, 16) });
const demoTasks = () => [
  { id: 1, date: todayISO(), task: 'Plan the week ahead', priority: 'high', deadline: `${todayISO()}T18:00`, status: 'in_progress', created_at: new Date().toISOString() },
  { id: 2, date: todayISO(), task: 'Review project notes', priority: 'medium', deadline: `${addDays(todayISO(), 2)}T17:00`, status: 'pending', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 3, date: addDays(todayISO(), -1), task: 'Send final project update', priority: 'low', deadline: `${addDays(todayISO(), -1)}T16:00`, status: 'completed', created_at: new Date(Date.now() - 172800000).toISOString() }
];
function addDays(date, days) { const d = new Date(`${date}T12:00:00+07:00`); d.setUTCDate(d.getUTCDate() + days); return jakartaDateString(d); }
function tomorrowISO() { return addDays(todayISO(), 1); }
function deadlineDate(value) { const raw = String(value).replace(' ', 'T'); if (/[zZ]|[+-]\d\d:\d\d$/.test(raw)) return new Date(raw); return new Date(`${raw.length === 10 ? `${raw}T00:00:00` : raw}:00+07:00`); }
function formatDeadline(value) { const date = deadlineDate(value); return new Intl.DateTimeFormat('en-US', { timeZone: JAKARTA_TIMEZONE, month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date); }
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
async function loadReminders() {
  try { const result = await request(REMINDER_API); reminders = (result.data || []).map(normalizeReminder); }
  catch (_error) { reminders = []; }
  renderCalendar();
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
  if (!visible.length) { els.content.innerHTML = `<div class="empty-state"><div class="empty-icon">✓</div><h3>${tasks.length ? 'No tasks found' : 'No tasks yet'}</h3><p>${tasks.length ? 'Try another keyword or adjust your filters.' : 'Start organizing your work by creating your first task.'}</p></div>`; renderCalendar(); return; }
  els.content.innerHTML = `<div class="task-table"><div class="task-row header"><span>Date</span><span>Task</span><span>Priority</span><span>Deadline</span><span>Status</span><span></span></div>${visible.map(taskRow).join('')}</div><div class="mobile-tasks">${visible.map(taskMobile).join('')}</div>`;
  els.content.querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => openModal(tasks.find((item) => item.id === Number(button.dataset.edit)))));
  els.content.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', () => deleteTask(Number(button.dataset.delete))));
  els.content.querySelectorAll('[data-status]').forEach((select) => select.addEventListener('change', () => updateStatus(Number(select.dataset.status), select.value)));
  renderCalendar();
}
function monthKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; }
function sameMonth(dateA, dateB) { return dateA.getFullYear() === dateB.getFullYear() && dateA.getMonth() === dateB.getMonth(); }
function monthTasks() {
  return tasks.filter((task) => sameMonth(new Date(`${task.date}T12:00:00`), calendarMonth) || sameMonth(deadlineDate(task.deadline), calendarMonth));
}
function monthReminders() {
  return reminders.filter((reminder) => sameMonth(new Date(`${reminder.remind_at}T12:00:00`), calendarMonth));
}
function tasksForDay(dayISO) { return tasks.filter((task) => task.date === dayISO || String(task.deadline).slice(0, 10) === dayISO); }
function remindersForDay(dayISO) { return reminders.filter((reminder) => String(reminder.remind_at).slice(0, 10) === dayISO); }
function renderCalendar() {
  if (!els.calendarGrid || !els.calendarTaskList) return;
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(calendarMonth);
  if (els.calendarMonthLabel) els.calendarMonthLabel.textContent = monthLabel;
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const cells = [...weekDays.map((day) => `<div class="calendar-weekday">${day}</div>`)];
  for (let i = 0; i < startOffset; i += 1) cells.push('<div class="calendar-day empty"></div>');
  for (let day = 1; day <= daysInMonth; day += 1) {
    const dayISO = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTasks = tasksForDay(dayISO);
    const dayReminders = remindersForDay(dayISO);
    cells.push(`<button class="calendar-day ${dayISO === todayISO() ? 'today' : ''}" data-calendar-day="${dayISO}"><span class="calendar-day-num">${day}</span><span class="calendar-day-count">${dayTasks.length || dayReminders.length ? `${dayTasks.length ? `${dayTasks.length} task${dayTasks.length > 1 ? 's' : ''}` : ''}${dayTasks.length && dayReminders.length ? ' · ' : ''}${dayReminders.length ? `${dayReminders.length} reminder${dayReminders.length > 1 ? 's' : ''}` : ''}` : 'No items'}</span>${dayTasks.slice(0, 2).map((task) => `<span class="calendar-chip ${task.status}">${escapeHtml(task.task)}</span>`).join('')}${dayReminders.slice(0, 1).map((reminder) => `<span class="calendar-chip reminder-chip">${escapeHtml(reminder.title)}</span>`).join('')}</button>`);
  }
  els.calendarGrid.innerHTML = cells.join('');
  els.calendarGrid.querySelectorAll('.calendar-day.selected').forEach((day) => day.classList.remove('selected'));
  if (selectedCalendarDay) els.calendarGrid.querySelector(`[data-calendar-day="${selectedCalendarDay}"]`)?.classList.add('selected');
  const agendaDate = selectedCalendarDay && selectedCalendarDay.slice(0, 7) === monthKey(calendarMonth) ? selectedCalendarDay : null;
  const current = (agendaDate ? tasksForDay(agendaDate) : monthTasks()).sort((a, b) => a.deadline.localeCompare(b.deadline));
  const currentReminders = (agendaDate ? remindersForDay(agendaDate) : monthReminders()).sort((a, b) => a.remind_at.localeCompare(b.remind_at));
  if (els.calendarPanelLabel) els.calendarPanelLabel.textContent = agendaDate ? 'Selected day' : 'This month';
  if (els.calendarPanelTitle) els.calendarPanelTitle.textContent = agendaDate ? `Agenda ${formatDate(agendaDate)}` : 'Calendar items';
  const items = [
    ...current.map((task) => `<article class="calendar-item"><div><strong>${escapeHtml(task.task)}</strong><p>Task deadline: ${formatDeadline(task.deadline)}</p></div><span>Task</span></article>`),
    ...currentReminders.map((reminder) => `<article class="calendar-item reminder-item"><div class="calendar-item-copy"><div class="calendar-item-title"><span class="reminder-dot"></span><strong>${escapeHtml(reminder.title)}</strong></div><p>${formatDeadline(reminder.remind_at)}${reminder.note ? `<br>${escapeHtml(reminder.note)}` : ''}</p></div><div class="calendar-item-actions"><span class="reminder-label">Reminder</span><button class="calendar-action" data-edit-reminder="${reminder.id}" aria-label="Edit ${escapeHtml(reminder.title)}">Edit</button><button class="calendar-action delete" data-delete-reminder="${reminder.id}" aria-label="Delete ${escapeHtml(reminder.title)}">Delete</button></div></article>`)
  ];
  els.calendarTaskList.innerHTML = items.length ? items.join('') : `<div class="calendar-empty">No tasks or reminders ${agendaDate ? 'on this day' : 'in this month'}.</div>`;
}
function notifyUpcomingDeadlines() {
  const alreadyNotified = JSON.parse(localStorage.getItem(NOTIFIED_DEADLINES_KEY) || '{}');
  const now = Date.now();
  const dueForReminder = reminders.filter((reminder) => {
    const remindAt = deadlineDate(reminder.remind_at).getTime();
    return now >= remindAt && !alreadyNotified[`reminder:${reminder.id}:${reminder.remind_at}`];
  });
  if (!dueForReminder.length) return;
  dueForReminder.forEach((reminder) => { alreadyNotified[`reminder:${reminder.id}:${reminder.remind_at}`] = true; });
  localStorage.setItem(NOTIFIED_DEADLINES_KEY, JSON.stringify(alreadyNotified));
  const message = dueForReminder.length === 1 ? `Reminder: ${dueForReminder[0].title}` : `Reminder: ${dueForReminder.length} reminders are due`;
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
  els.form.reset(); els.error.textContent = ''; els.id.value = task?.id || ''; els.date.value = task?.date || todayISO(); els.deadline.value = task?.deadline || `${todayISO()}T17:00`; els.priorityInput.value = task?.priority || 'medium'; els.statusInput.value = task?.status || 'pending'; els.name.value = task?.task || '';
  $('#modalKicker').textContent = task ? 'Make it better' : 'Create something new'; $('#modalTitle').textContent = task ? 'Edit task' : 'Add a task'; $('#submitTask').innerHTML = task ? 'Save changes <span>↗</span>' : 'Add task <span>↗</span>';
  els.modal.classList.add('open'); els.modal.setAttribute('aria-hidden', 'false'); setTimeout(() => els.name.focus(), 50);
}
function closeModal() { els.modal.classList.remove('open'); els.modal.setAttribute('aria-hidden', 'true'); }
function openReminderModal(dayISO = todayISO(), reminder = null) {
  els.reminderForm.reset();
  els.reminderError.textContent = '';
  els.reminderId.value = reminder?.id || '';
  els.reminderDay.value = String(reminder?.remind_at || `${dayISO}T09:00`).slice(0, 10);
  els.reminderAt.value = reminder?.remind_at || `${dayISO}T09:00`;
  els.reminderTitle.value = reminder?.title || '';
  els.reminderNote.value = reminder?.note || '';
  $('#reminderModalTitle').textContent = reminder ? 'Edit reminder' : 'Add reminder';
  $('#submitReminder').innerHTML = reminder ? 'Save changes <span>↗</span>' : 'Add reminder <span>↗</span>';
  els.reminderModal.classList.add('open');
  els.reminderModal.setAttribute('aria-hidden', 'false');
  setTimeout(() => els.reminderTitle.focus(), 50);
}
function closeReminderModal() { els.reminderModal.classList.remove('open'); els.reminderModal.setAttribute('aria-hidden', 'true'); }
async function saveTask(event) {
  event.preventDefault(); els.error.textContent = '';
  if (els.deadline.value.slice(0, 10) < els.date.value) { els.error.textContent = 'Deadline cannot be earlier than the task date.'; return; }
  const body = { task: els.name.value.trim(), date: els.date.value, deadline: els.deadline.value, priority: els.priorityInput.value, status: els.statusInput.value };
  if (body.task.length < 3) { els.error.textContent = 'Task must be at least 3 characters.'; return; }
  const id = els.id.value;
  try {
    if (useLocal) {
      const item = { ...body, id: id ? Number(id) : Date.now(), created_at: id ? tasks.find((t) => t.id === Number(id)).created_at : new Date().toISOString() };
      tasks = id ? tasks.map((t) => t.id === Number(id) ? item : t) : [item, ...tasks];
      persistLocal();
    }
    else { const result = await request(id ? `${API}/${id}` : API, { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) }); if (id) tasks = tasks.map((t) => t.id === Number(id) ? normalizeTask(result.data) : t); else tasks.unshift(normalizeTask(result.data)); }
    closeModal(); render(); showToast(id ? 'Task updated successfully' : 'Task added successfully');
  } catch (error) { els.error.textContent = error.message || 'Unable to save task.'; }
}
async function saveReminder(event) {
  event.preventDefault();
  els.reminderError.textContent = '';
  const body = { title: els.reminderTitle.value.trim(), note: els.reminderNote.value.trim(), remindAt: els.reminderAt.value };
  if (body.title.length < 3) { els.reminderError.textContent = 'Reminder title must be at least 3 characters.'; return; }
  try {
    if (useLocal) {
      const item = { id: els.reminderId.value ? Number(els.reminderId.value) : Date.now(), title: body.title, note: body.note, remind_at: body.remindAt, status: 'pending', created_at: new Date().toISOString() };
      reminders = els.reminderId.value ? reminders.map((r) => r.id === item.id ? item : r) : [item, ...reminders];
    } else {
      const result = await request(els.reminderId.value ? `${REMINDER_API}/${els.reminderId.value}` : REMINDER_API, { method: els.reminderId.value ? 'PUT' : 'POST', body: JSON.stringify(body) });
      const item = normalizeReminder(result.data);
      reminders = els.reminderId.value ? reminders.map((reminder) => reminder.id === item.id ? item : reminder) : [item, ...reminders];
    }
    closeReminderModal(); render(); showToast('Reminder saved');
  } catch (error) { els.reminderError.textContent = error.message || 'Unable to save reminder.'; }
}
async function deleteReminder(id) {
  if (!window.confirm('Delete this reminder?')) return;
  try {
    if (!useLocal) await request(`${REMINDER_API}/${id}`, { method: 'DELETE' });
    reminders = reminders.filter((reminder) => reminder.id !== id);
    renderCalendar();
    showToast('Reminder deleted successfully');
  } catch (_error) { showToast('Unable to delete reminder'); }
}
async function deleteTask(id) {
  if (!window.confirm('Delete this task?')) return;
  try { if (useLocal) { tasks = tasks.filter((task) => task.id !== id); persistLocal(); } else { await request(`${API}/${id}`, { method: 'DELETE' }); tasks = tasks.filter((task) => task.id !== id); } render(); showToast('Task deleted successfully'); }
  catch (_error) { showToast('Unable to delete task'); }
}
async function updateStatus(id, status) {
  const task = tasks.find((item) => item.id === id); if (!task) return;
  const body = { task: task.task, date: task.date, deadline: task.deadline, priority: task.priority, status };
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
  const navItems = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const navSections = navItems.map((item) => document.querySelector(item.getAttribute('href'))).filter(Boolean);
  const updateActiveNav = () => {
    const current = navSections.reduce((active, section) => section.getBoundingClientRect().top <= 150 ? section : active, navSections[0]);
    navItems.forEach((item) => item.classList.toggle('active', item.getAttribute('href') === `#${current?.id}`));
  };
  navItems.forEach((item) => item.addEventListener('click', () => {
    navItems.forEach((navItem) => navItem.classList.remove('active'));
    item.classList.add('active');
    $('#navLinks').classList.remove('open');
  }));
  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();
  const accountMenu = $('#accountMenu');
  const accountMenuButton = $('#accountMenuButton');
  accountMenuButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = !accountMenu.hidden;
    accountMenu.hidden = isOpen;
    accountMenuButton.setAttribute('aria-expanded', String(!isOpen));
  });
  document.addEventListener('click', (event) => {
    if (accountMenu && !accountMenu.hidden && !event.target.closest('.account-menu')) {
      accountMenu.hidden = true;
      accountMenuButton?.setAttribute('aria-expanded', 'false');
    }
  });
  document.querySelectorAll('[data-open-modal]').forEach((button) => button.addEventListener('click', () => openModal()));
  $('#openReminderModal')?.addEventListener('click', () => openReminderModal(selectedCalendarDay || todayISO()));
  $('#closeModal').addEventListener('click', closeModal); $('#cancelModal').addEventListener('click', closeModal); els.modal.addEventListener('click', (event) => { if (event.target === els.modal) closeModal(); }); document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeModal(); });
  $('#closeReminderModal').addEventListener('click', closeReminderModal); $('#cancelReminderModal').addEventListener('click', closeReminderModal); els.reminderModal.addEventListener('click', (event) => { if (event.target === els.reminderModal) closeReminderModal(); });
  els.form.addEventListener('submit', saveTask); [els.search, els.status, els.priority, els.sort].forEach((control) => control.addEventListener('input', render));
  els.reminderForm.addEventListener('submit', saveReminder);
  $('#calendarPrev').addEventListener('click', () => { calendarMonth.setMonth(calendarMonth.getMonth() - 1); selectedCalendarDay = null; renderCalendar(); });
  $('#calendarNext').addEventListener('click', () => { calendarMonth.setMonth(calendarMonth.getMonth() + 1); selectedCalendarDay = null; renderCalendar(); });
  $('#calendarToday').addEventListener('click', () => { calendarMonth = new Date(); selectedCalendarDay = null; renderCalendar(); });
  els.calendarGrid.addEventListener('click', (event) => { const day = event.target.closest('[data-calendar-day]'); if (!day) return; selectedCalendarDay = String(day.dataset.calendarDay); calendarMonth = new Date(`${selectedCalendarDay}T12:00:00`); renderCalendar(); });
  els.calendarTaskList.addEventListener('click', (event) => {
    const editButton = event.target.closest('[data-edit-reminder]');
    const deleteButton = event.target.closest('[data-delete-reminder]');
    if (editButton) openReminderModal(todayISO(), reminders.find((reminder) => reminder.id === Number(editButton.dataset.editReminder)));
    if (deleteButton) deleteReminder(Number(deleteButton.dataset.deleteReminder));
  });
  $('#logoutBtn')?.addEventListener('click', () => { localStorage.removeItem(AUTH_KEY); window.location.href = '/login.html'; });
  const auth = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); if (auth?.user?.username) { $('#userName').textContent = auth.user.username; $('#accountName').textContent = auth.user.username; }
  loadTasks().then(() => loadReminders()).then(() => { syncPushSubscription(); notifyUpcomingDeadlines(); });
  window.setInterval(notifyUpcomingDeadlines, 60000);
});

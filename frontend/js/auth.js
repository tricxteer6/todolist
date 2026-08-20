const AUTH_KEY = 'taskflow-auth';
const form = document.querySelector('#authForm');
const errorText = document.querySelector('#authError');
const switchButton = document.querySelector('#authSwitch button');
let registerMode = new URLSearchParams(window.location.search).get('register') === '1';

function updateMode() {
  document.querySelector('#authKicker').textContent = registerMode ? 'Start fresh' : 'Welcome back';
  document.querySelector('#authTitle').textContent = registerMode ? 'Create your account' : 'Sign in to TaskFlow';
  document.querySelector('#authSubtitle').textContent = registerMode ? 'Your tasks, all in one focused space.' : 'Your focused workspace is waiting.';
  document.querySelector('#authSubmit').innerHTML = registerMode ? 'Create account <span>↗</span>' : 'Sign in <span>↗</span>';
  document.querySelector('#authSwitch').firstChild.textContent = registerMode ? 'Already have an account? ' : 'New to TaskFlow? ';
  switchButton.textContent = registerMode ? 'Sign in' : 'Create an account';
}

switchButton.addEventListener('click', () => { registerMode = !registerMode; errorText.textContent = ''; form.reset(); updateMode(); });
form.addEventListener('submit', async (event) => {
  event.preventDefault(); errorText.textContent = '';
  const username = document.querySelector('#usernameInput').value.trim();
  const password = document.querySelector('#passwordInput').value;
  try {
    const response = await fetch(`/api/auth/${registerMode ? 'register' : 'login'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Unable to continue.');
    localStorage.setItem(AUTH_KEY, JSON.stringify(result.data));
    window.location.href = '/';
  } catch (error) { errorText.textContent = error.message; }
});

updateMode();

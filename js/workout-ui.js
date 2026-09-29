window.WorkoutUI = (() => {
  const service = SprintWorkout.createService();
  const { dateKey, duration } = SprintWorkout;
  function updateDate() {
    const now = new Date();
    document.querySelectorAll('[data-current-date]').forEach(el => { el.textContent = dateKey(now).replaceAll('-', '/'); });
    document.querySelectorAll('[data-current-weekday]').forEach(el => { el.textContent = new Intl.DateTimeFormat('ko-KR', { weekday: 'long' }).format(now); });
  }
  function message(text = '', error = false) {
    const host = document.getElementById('workout-message');
    if (!host) return;
    host.classList.toggle('is-error', error);
    host.replaceChildren();
    const needsLogin = error && /로그인/.test(text);
    if (!needsLogin) {
      host.textContent = text;
      return;
    }
    const link = document.createElement('a');
    link.href = 'login.html';
    link.textContent = text;
    link.className = 'login-required-link';
    link.addEventListener('click', () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    });
    host.append(link);
  }
  function time(value) {
    return value ? new Date(value).toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--';
  }
  document.querySelectorAll('[data-demo-note]').forEach(el => { el.hidden = !service.demo; });
  updateDate(); setInterval(updateDate, 1000);
  return { service, dateKey, duration, time, message };
})();

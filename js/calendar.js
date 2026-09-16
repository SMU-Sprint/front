function calendarMonth(year, month) {
  const first = new Date(year, month, 1);
  const count = new Date(year, month + 1, 0).getDate();
  const cells = Array(Math.ceil((first.getDay() + count) / 7) * 7).fill(null);
  for (let day = 1; day <= count; day++) cells[first.getDay() + day - 1] = day;
  return { year: first.getFullYear(), month: first.getMonth(), cells };
}
if (typeof module !== 'undefined') module.exports = { calendarMonth };
if (typeof document !== 'undefined') {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function renderCalendars() {
    const now = new Date();
    const cards = [...document.querySelectorAll('.mini-card'), document.querySelector('.calendar-card')];
    cards.forEach((card, index) => {
      const model = calendarMonth(now.getFullYear(), now.getMonth() + index - 2);
      card.querySelector('h1, h2').textContent = `${model.month + 1}월`;
      const grid = card.querySelector('.mini-grid, .month-grid');
      grid.setAttribute('aria-label', `${model.year}년 ${model.month + 1}월`);
      grid.replaceChildren();
      if (index < 2) weekdays.forEach(day => {
        const label = document.createElement('small'); label.textContent = day; grid.append(label);
      });
      model.cells.forEach(day => {
        const cell = document.createElement('i');
        if (day === null) { cell.className = 'empty'; cell.setAttribute('aria-hidden', 'true'); }
        else {
          const date = `${model.year}-${String(model.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          cell.textContent = day; cell.dataset.date = date;
          cell.title = `${model.year}년 ${model.month + 1}월 ${day}일`;
          if (index === 2 && day === now.getDate()) { cell.className = 'today'; cell.setAttribute('aria-current', 'date'); }
        }
        grid.append(cell);
      });
    });
  }
  renderCalendars();
  setInterval(renderCalendars, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) renderCalendars(); });
}
